import { query } from "./_generated/server";
import { requireCmsOwner } from "./lib/auth";
import { SETTINGS_DEFAULTS } from "./cmsShared";

/**
 * Published site settings only (flags + shared metadata). Safe for anonymous clients.
 * Returns `null` until the singleton CMS row is seeded (run `internal.seed.seedSiteSettingsDefaults`
 * or save a draft once auth is wired).
 */
export const getPublished = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "settings"))
      .unique();

    if (!row) {
      return null;
    }

    return {
      flags: row.publishedSnapshot.flags,
      metadata: row.publishedSnapshot.metadata ?? null,
      updatedAt: row.updatedAt,
      publishedAt: row.publishedAt,
      publishedBy: row.publishedBy ?? null,
    };
  },
});

/**
 * Preview site settings for owner-only access. Returns the draft snapshot
 * (falling back to published snapshot / defaults) so the owner can preview
 * unpublished changes on the real marketing site.
 *
 * Returns `null` for unauthenticated or non-owner callers — never leaks drafts.
 */
export const getPreview = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }

    const row = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "settings"))
      .unique();

    if (!row) {
      return {
        flags: SETTINGS_DEFAULTS.flags,
        metadata: SETTINGS_DEFAULTS.metadata ?? null,
        updatedAt: null,
        publishedAt: null,
        publishedBy: null,
        hasDraftChanges: false,
      };
    }

    const snapshot = row.draftSnapshot ?? row.publishedSnapshot;

    return {
      flags: snapshot.flags,
      metadata: snapshot.metadata ?? null,
      updatedAt: row.updatedAt,
      publishedAt: row.publishedAt,
      publishedBy: row.publishedBy ?? null,
      hasDraftChanges: row.hasDraftChanges,
    };
  },
});
