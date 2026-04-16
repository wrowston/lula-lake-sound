import { query } from "./_generated/server";
import { requireCmsOwner } from "./lib/auth";
import { publishedSettingsFromRow } from "./publicSettingsSnapshot";

/**
 * Preview site metadata for owner-only access. Resolves **draft** when present,
 * else published (same effective snapshot as the editor).
 *
 * Returns `null` for unauthenticated or non-owner callers — never leaks drafts.
 */
export const getPreviewSiteSettings = query({
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
        ...publishedSettingsFromRow(null),
        hasDraftChanges: false,
      };
    }

    const effectiveRow = {
      ...row,
      publishedSnapshot: row.draftSnapshot ?? row.publishedSnapshot,
    };

    return {
      ...publishedSettingsFromRow(effectiveRow),
      hasDraftChanges: row.hasDraftChanges,
    };
  },
});
