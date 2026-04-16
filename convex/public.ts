import { query } from "./_generated/server";
import {
  publishedPricingFromRows,
  publishedSettingsFromRow,
} from "./publicSettingsSnapshot";

/**
 * **Public (anonymous) site reads** — published snapshot only.
 *
 * Add new landing-page queries here (one entry point per domain). Each handler must
 * read only `publishedSnapshot` (or other published columns), never `draftSnapshot`.
 * For owner preview / draft overlay, use `pricingPreviewDraft` / `siteSettingsPreviewDraft`.
 */
export const getPublishedSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "settings"))
      .unique();

    return publishedSettingsFromRow(row);
  },
});

/**
 * Published pricing feature flags.
 *
 * Resolves the `pricing` section's `publishedSnapshot.flags`. If that row
 * has not yet been written (legacy deployments that still store flags on
 * the `settings` row), the helper falls back to `settings.flags` and then
 * to the seeded defaults, so the marketing site always renders.
 */
export const getPublishedPricingFlags = query({
  args: {},
  handler: async (ctx) => {
    const [pricingRow, settingsRow] = await Promise.all([
      ctx.db
        .query("cmsSections")
        .withIndex("by_section", (q) => q.eq("section", "pricing"))
        .unique(),
      ctx.db
        .query("cmsSections")
        .withIndex("by_section", (q) => q.eq("section", "settings"))
        .unique(),
    ]);

    return publishedPricingFromRows(pricingRow, settingsRow);
  },
});
