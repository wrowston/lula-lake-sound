import { query } from "./_generated/server";
import { requireCmsOwner } from "./lib/auth";
import { publishedPricingFromRows } from "./publicSettingsSnapshot";

/**
 * Preview pricing flags for owner-only access. Resolves **draft** when present
 * on the `pricing` section, else published. Also consults the legacy `settings`
 * row's flags so preview keeps working during migration.
 *
 * Returns `null` for unauthenticated or non-owner callers — never leaks drafts.
 * `hasDraftChanges` reflects only the `pricing` section.
 */
export const getPreviewPricingFlags = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }

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

    const effectivePricing = pricingRow
      ? {
          ...pricingRow,
          publishedSnapshot:
            pricingRow.draftSnapshot ?? pricingRow.publishedSnapshot,
        }
      : null;

    const resolved = publishedPricingFromRows(effectivePricing, settingsRow);

    return {
      ...resolved,
      hasDraftChanges: pricingRow?.hasDraftChanges ?? false,
    };
  },
});
