import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  aboutContentValidator,
  cmsSectionValidator,
  pricingContentValidator,
  settingsContentValidator,
} from "./schema.shared";
import {
  cmsSnapshotsEqual,
  defaultSnapshotForSection,
} from "./cmsShared";
import {
  requireAuthenticatedIdentity,
  requireCmsOwner,
} from "./lib/auth";
import {
  collectAboutTeamBlobIssues,
  collectDraftOnlyAboutTeamStorageIds,
  deleteDraftOnlyAboutTeamBlobs,
  pruneAboutTeamBlobsAfterSaveDraft,
} from "./aboutTeamStorage";
import type { AboutSnapshot } from "./cmsShared";
import {
  collectPublishIssues,
  ensureSectionRow,
  getSectionRow,
  publishSectionCore,
} from "./cmsPublishHelpers";
import { cmsValidationError } from "./errors";

/**
 * Full section document for the admin UI (published + optional draft).
 * Requires a valid Convex identity; returns per-section defaults when no row exists yet.
 */
export const getSection = query({
  args: { section: cmsSectionValidator },
  handler: async (ctx, args) => {
    await requireAuthenticatedIdentity(ctx);
    const row = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", args.section))
      .unique();

    if (!row) {
      return {
        section: args.section,
        publishedSnapshot: defaultSnapshotForSection(args.section),
        publishedAt: null,
        publishedBy: null,
        draftSnapshot: null,
        hasDraftChanges: false,
        updatedAt: null,
        updatedBy: null,
      };
    }

    return {
      section: row.section,
      publishedSnapshot: row.publishedSnapshot,
      publishedAt: row.publishedAt,
      publishedBy: row.publishedBy ?? null,
      draftSnapshot: row.draftSnapshot ?? null,
      hasDraftChanges: row.hasDraftChanges,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy ?? null,
    };
  },
});

/**
 * Persist a working copy for a section. Does not change what public readers see.
 * First save on a new environment creates the singleton row (same defaults as seed).
 *
 * `content` is a discriminated union keyed by `section` so the validator only
 * accepts the shape that belongs to the target section.
 */
export const saveDraft = mutation({
  args: {
    section: cmsSectionValidator,
    content: v.union(
      settingsContentValidator,
      pricingContentValidator,
      aboutContentValidator,
    ),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);

    // Runtime guard: the `content` union lets any of the three shapes through,
    // but we enforce that the payload matches the target section so e.g. a
    // settings row can never end up with a pricing or about payload.
    const isSettingsPayload =
      "metadata" in args.content &&
      !("heroTitle" in args.content) &&
      !("packages" in args.content);
    const isPricingPayload =
      "flags" in args.content &&
      typeof (args.content as { flags?: unknown }).flags === "object" &&
      (args.content as { flags?: { priceTabEnabled?: unknown } }).flags
        ?.priceTabEnabled !== undefined;
    const isAboutPayload =
      "heroTitle" in args.content && "body" in args.content;

    if (args.section === "settings") {
      if (!isSettingsPayload) {
        cmsValidationError(
          "Settings content must include metadata.",
          "content",
        );
      }
    } else if (args.section === "pricing") {
      if ("metadata" in args.content) {
        cmsValidationError(
          "Pricing content cannot include metadata.",
          "content",
        );
      }
      if (!isPricingPayload) {
        cmsValidationError(
          "Pricing content must include flags.priceTabEnabled.",
          "content",
        );
      }
    } else {
      if (!isAboutPayload) {
        cmsValidationError(
          "About content must include heroTitle and body blocks.",
          "content",
        );
      }
    }

    const { id, row } = await ensureSectionRow(ctx, args.section, updatedBy);
    const now = Date.now();

    const hasDraftChanges = !cmsSnapshotsEqual(
      args.content,
      row.publishedSnapshot,
    );

    await ctx.db.patch(id, {
      draftSnapshot: args.content,
      hasDraftChanges,
      updatedAt: now,
      updatedBy,
    });

    if (args.section === "about") {
      await pruneAboutTeamBlobsAfterSaveDraft(
        ctx,
        row,
        args.content as AboutSnapshot,
      );
    }

    return { ok: true as const, section: args.section, hasDraftChanges };
  },
});

/**
 * Validates then atomically promotes draft → published in one transaction.
 * Idempotent: if there is no draft and nothing pending, returns `already_current` without writes.
 * Sets `publishedAt` and `publishedBy` (Clerk user id). On validation failure, throws
 * `PUBLISH_VALIDATION_FAILED` with optional field-level `issues` (Effect-friendly via client mapping).
 */
export const publishSection = mutation({
  args: {
    section: cmsSectionValidator,
  },
  handler: async (ctx, args) => {
    const { identity, userId, updatedBy } = await requireCmsOwner(ctx);
    void identity;
    const { id, row } = await ensureSectionRow(ctx, args.section, updatedBy);
    return await publishSectionCore(ctx, {
      section: args.section,
      id,
      row,
      publishedByUserId: userId,
      updatedByTokenId: updatedBy,
    });
  },
});

/**
 * Read-only validation for the current draft (or published snapshot if no draft).
 * Does not write. Owner-only when `CMS_OWNER_TOKEN_IDENTIFIERS` is configured.
 */
export const validatePublishSection = query({
  args: { section: cmsSectionValidator },
  handler: async (ctx, args) => {
    await requireCmsOwner(ctx);
    const row = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", args.section))
      .unique();

    const snapshot =
      row?.draftSnapshot ??
      row?.publishedSnapshot ??
      defaultSnapshotForSection(args.section);
    const issues = collectPublishIssues(args.section, snapshot);
    const blobIssues =
      args.section === "about"
        ? await collectAboutTeamBlobIssues(ctx, snapshot as AboutSnapshot)
        : [];
    const allIssues = [...issues, ...blobIssues];
    return {
      ok: allIssues.length === 0,
      section: args.section,
      issues: allIssues,
    };
  },
});

/**
 * Drops unpublished edits: removes `draftSnapshot` and clears `hasDraftChanges`.
 * Preview/admin reads then fall back to `publishedSnapshot` (see `getSection`).
 * `publishedSnapshot`, `publishedAt`, and `publishedBy` are unchanged.
 * When nothing has ever been published (`publishedAt === null`), published content
 * stays as stored (typically defaults from seed / first row insert); the draft is
 * cleared so the editor shows that same baseline. About team headshots: orphan
 * blobs only referenced by the discarded draft are removed (see INF-76).
 */
export const discardDraft = mutation({
  args: {
    section: cmsSectionValidator,
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getSectionRow(ctx, args.section);
    if (!row) {
      return { ok: true as const, section: args.section, discarded: false };
    }

    if (!row.draftSnapshot && !row.hasDraftChanges) {
      return { ok: true as const, section: args.section, discarded: false };
    }

    const now = Date.now();

    const draftOnlyAboutBlobs =
      args.section === "about" ? collectDraftOnlyAboutTeamStorageIds(row) : [];

    await ctx.db.patch(row._id, {
      draftSnapshot: undefined,
      hasDraftChanges: false,
      updatedAt: now,
      updatedBy,
    });

    if (draftOnlyAboutBlobs.length > 0) {
      await deleteDraftOnlyAboutTeamBlobs(ctx, draftOnlyAboutBlobs);
    }

    return { ok: true as const, section: args.section, discarded: true };
  },
});
