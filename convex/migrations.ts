import { internalMutation } from "./_generated/server";
import { settingsSnapshotsEqual } from "./cmsShared";

/**
 * One-time migration from legacy `siteSettings` table to `cmsSections` (INF-70).
 * Safe to run multiple times: no-ops if `cmsSections` already has settings or `siteSettings` is empty.
 */
export const migrateSiteSettingsToCmsSections = internalMutation({
  args: {},
  handler: async (ctx) => {
    const already = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "settings"))
      .unique();
    if (already) {
      return { status: "skip_cms_exists" as const };
    }

    const legacy = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "site"))
      .unique();

    if (!legacy) {
      return { status: "skip_no_legacy" as const };
    }

    const now = Date.now();
    const draftSource = legacy.draft ?? legacy.published;
    const hasDraftChanges = !settingsSnapshotsEqual(
      draftSource,
      legacy.published,
    );

    const id = await ctx.db.insert("cmsSections", {
      section: "settings",
      updatedAt: now,
      updatedBy: legacy.updatedBy,
      publishedSnapshot: legacy.published,
      publishedAt: legacy.publishedAt ?? now,
      draftSnapshot: hasDraftChanges ? draftSource : undefined,
      hasDraftChanges,
    });

    await ctx.db.delete(legacy._id);

    return { status: "migrated" as const, id };
  },
});
