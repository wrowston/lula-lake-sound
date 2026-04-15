import { query } from "./_generated/server";

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
