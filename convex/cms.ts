import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  cmsSectionValidator,
  settingsContentValidator,
} from "./schema.shared";
import { SETTINGS_DEFAULTS, settingsSnapshotsEqual } from "./cmsShared";
import {
  requireAuthenticatedIdentity,
  requireCmsOwner,
} from "./lib/auth";
import {
  collectSettingsPublishIssues,
  ensureSectionRow,
  getSectionRow,
  publishSettingsSectionCore,
} from "./cmsPublishHelpers";

/**
 * Full section document for the admin UI (published + optional draft).
 * Requires a valid Convex identity; returns SETTINGS_DEFAULTS when no row exists yet.
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
        publishedSnapshot: SETTINGS_DEFAULTS,
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
 */
export const saveDraft = mutation({
  args: {
    section: cmsSectionValidator,
    content: settingsContentValidator,
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const { id, row } = await ensureSectionRow(
      ctx,
      args.section,
      updatedBy,
    );
    const now = Date.now();

    const hasDraftChanges = !settingsSnapshotsEqual(
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
    return await publishSettingsSectionCore(ctx, {
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
      row?.draftSnapshot ?? row?.publishedSnapshot ?? SETTINGS_DEFAULTS;
    const issues = collectSettingsPublishIssues(snapshot);
    return {
      ok: issues.length === 0,
      section: args.section,
      issues,
    };
  },
});

/**
 * Drops unpublished edits and aligns the working copy with what is live.
 * Clears optional draft fields; no-op if there was no draft.
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

    await ctx.db.replace("cmsSections", row._id, {
      section: row.section,
      publishedSnapshot: row.publishedSnapshot,
      publishedAt: row.publishedAt,
      publishedBy: row.publishedBy,
      updatedAt: now,
      updatedBy,
      hasDraftChanges: false,
    });

    return { ok: true as const, section: args.section, discarded: true };
  },
});
