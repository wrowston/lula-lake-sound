import { query } from "./_generated/server";
import { requireCmsOwner } from "./lib/auth";
import { loadPricingPackages, pricingPackageFromRow } from "./pricingTree";
import { effectiveIsEnabled, getSectionMetaRow } from "./cmsMeta";

/**
 * Preview pricing payload for owner-only access. Resolves **draft** packages
 * when any exist, else falls back to published. Feature visibility mirrors
 * `cmsSections.pricing` with draft override applied.
 *
 * Returns `null` for unauthenticated or non-owner callers — never leaks drafts.
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

    const [row, draftRows, publishedRows] = await Promise.all([
      getSectionMetaRow(ctx, "pricing"),
      loadPricingPackages(ctx, "draft"),
      loadPricingPackages(ctx, "published"),
    ]);

    const source =
      draftRows.length > 0 ||
      ((row?.hasDraftChanges ?? false) && publishedRows.length > 0)
        ? draftRows
        : publishedRows;
    return {
      flags: { priceTabEnabled: effectiveIsEnabled(row, "pricing") },
      packages: source.map(pricingPackageFromRow),
      hasDraftChanges: row?.hasDraftChanges ?? false,
    };
  },
});
