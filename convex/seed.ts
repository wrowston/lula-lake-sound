import { internalMutation } from "./_generated/server";
import { SITE_SETTINGS_KEY } from "./siteSettingsConstants";

const defaultFlags = { priceTabEnabled: true };

/**
 * Idempotent seed for local dev: creates the singleton site settings row if missing.
 *
 * Run once after deploying schema:
 * `bunx convex run internal.seed.seedSiteSettingsDefaults` (or from dashboard → Functions → internal).
 */
export const seedSiteSettingsDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", SITE_SETTINGS_KEY))
      .unique();

    const now = Date.now();

    if (existing) {
      return { status: "already_seeded" as const, id: existing._id };
    }

    const id = await ctx.db.insert("siteSettings", {
      key: SITE_SETTINGS_KEY,
      updatedAt: now,
      published: {
        flags: defaultFlags,
        metadata: {
          title: "Lula Lake Sound",
          description: "Studio and lake-house sessions.",
        },
      },
    });

    return { status: "inserted" as const, id };
  },
});
