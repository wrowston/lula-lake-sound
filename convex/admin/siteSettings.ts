import { internalQuery } from "../_generated/server";

/**
 * Full settings section document for admins / debugging (includes optional draft).
 * Run from the Convex dashboard (Functions) or `bunx convex run internal.admin.siteSettings.debugSnapshot`.
 */
export const debugSnapshot = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "settings"))
      .unique();
  },
});
