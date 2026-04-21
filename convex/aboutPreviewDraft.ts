import { query } from "./_generated/server";
import { requireCmsOwner } from "./lib/auth";
import { publishedAboutFromRow } from "./publicSettingsSnapshot";

/**
 * Preview About copy for owner-only access. Resolves **draft** when present,
 * else published (same effective snapshot as the editor).
 *
 * Returns `null` for unauthenticated or non-owner callers — never leaks drafts.
 */
export const getPreviewAbout = query({
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
      .withIndex("by_section", (q) => q.eq("section", "about"))
      .unique();

    if (!row) {
      return {
        ...publishedAboutFromRow(null),
        hasDraftChanges: false,
      };
    }

    const effectiveRow = {
      ...row,
      publishedSnapshot: row.draftSnapshot ?? row.publishedSnapshot,
    };

    return {
      ...publishedAboutFromRow(effectiveRow),
      hasDraftChanges: row.hasDraftChanges,
    };
  },
});
