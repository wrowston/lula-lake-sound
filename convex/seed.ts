import { internalMutation } from "./_generated/server";
import {
  PRICING_DEFAULTS,
  SETTINGS_DEFAULTS,
  type CmsSection,
  type CmsSnapshot,
} from "./cmsShared";

/**
 * Idempotent seed for local dev: creates both CMS rows (`settings`, `pricing`)
 * if missing, so admin editors and public queries have a consistent baseline.
 *
 * Run once after deploying schema:
 * `bunx convex run internal.seed.seedSiteSettingsDefaults` (or from dashboard → Functions → internal).
 */
export const seedSiteSettingsDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    async function ensureSeeded(
      section: CmsSection,
      snapshot: CmsSnapshot,
    ): Promise<{ section: CmsSection; status: "already_seeded" | "inserted" }> {
      const existing = await ctx.db
        .query("cmsSections")
        .withIndex("by_section", (q) => q.eq("section", section))
        .unique();
      if (existing) {
        return { section, status: "already_seeded" };
      }
      await ctx.db.insert("cmsSections", {
        section,
        updatedAt: now,
        publishedSnapshot: snapshot,
        publishedAt: now,
        hasDraftChanges: false,
      });
      return { section, status: "inserted" };
    }

    const results = await Promise.all([
      ensureSeeded("settings", SETTINGS_DEFAULTS),
      ensureSeeded("pricing", PRICING_DEFAULTS),
    ]);

    return {
      results,
    };
  },
});
