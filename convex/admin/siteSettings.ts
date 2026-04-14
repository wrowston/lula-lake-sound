import { internalQuery } from "../_generated/server";
import { SITE_SETTINGS_KEY } from "../siteSettingsConstants";

/**
 * Full site settings document for admins / debugging (includes optional draft).
 * Run from the Convex dashboard (Functions) or `bunx convex run internal/admin/siteSettings:debugSnapshot`.
 */
export const debugSnapshot = internalQuery({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", SITE_SETTINGS_KEY))
      .unique();

    return row;
  },
});
