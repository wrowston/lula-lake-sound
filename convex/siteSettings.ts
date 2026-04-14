import { query } from "./_generated/server";
import { SITE_SETTINGS_KEY } from "./siteSettingsConstants";

/**
 * Published site settings only (flags + shared metadata). Safe for anonymous clients.
 * Returns `null` until the singleton row is seeded.
 */
export const getPublished = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", SITE_SETTINGS_KEY))
      .unique();

    if (!row) {
      return null;
    }

    return {
      flags: row.published.flags,
      metadata: row.published.metadata ?? null,
      updatedAt: row.updatedAt,
    };
  },
});
