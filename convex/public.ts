import { query } from "./_generated/server";
import { publishedSettingsFromRow } from "./publicSettingsSnapshot";

/**
 * **Public (anonymous) site reads** — published snapshot only.
 *
 * Add new landing-page queries here (one entry point per domain). Each handler must
 * read only `publishedSnapshot` (or other published columns), never `draftSnapshot`.
 * For owner preview / draft overlay, use `siteSettingsPreviewDraft` (see `siteSettingsPreviewDraft.ts`).
 */
export const getPublishedSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "settings"))
      .unique();

    const parsed = publishedSettingsFromRow(row);
    if (!parsed) {
      return null;
    }
    return { flags: parsed.flags };
  },
});
