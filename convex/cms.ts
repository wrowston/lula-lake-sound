import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
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
    content: v.union(settingsContentValidator, pricingContentValidator),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);

    // Runtime guard: the `content` union lets either shape through, but we
    // enforce that the payload matches the target section so a settings row
    // can never end up with a pricing payload (or vice versa).
    if (args.section === "settings") {
      if (!("metadata" in args.content) && !("flags" in args.content)) {
        cmsValidationError(
          "Settings content must include metadata.",
          "content",
        );
      }
      if ("flags" in args.content && !("metadata" in args.content)) {
        cmsValidationError(
          "Settings content cannot be a pricing payload.",
          "content",
        );
      }
    } else {
      if (!("flags" in args.content)) {
        cmsValidationError(
          "Pricing content must include flags.priceTabEnabled.",
          "content",
        );
      }
      if ("metadata" in args.content) {
        cmsValidationError(
          "Pricing content cannot include metadata.",
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
    return {
      ok: issues.length === 0,
      section: args.section,
      issues,
    };
  },
});

/**
 * Drops unpublished edits: removes `draftSnapshot` and clears `hasDraftChanges`.
 * Preview/admin reads then fall back to `publishedSnapshot` (see `getSection`).
 * `publishedSnapshot`, `publishedAt`, and `publishedBy` are unchanged.
 * When nothing has ever been published (`publishedAt === null`), published content
 * stays as stored (typically defaults from seed / first row insert); the draft is
 * cleared so the editor shows that same baseline. No separate storage refs today;
 * if snapshots gain `_storage` ids, add explicit cleanup here (see INF-76).
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

    await ctx.db.patch(row._id, {
      draftSnapshot: undefined,
      hasDraftChanges: false,
      updatedAt: now,
      updatedBy,
    });

    return { ok: true as const, section: args.section, discarded: true };
  },
});
