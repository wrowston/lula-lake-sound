import { query } from "./_generated/server";
import { requireCmsOwner } from "./lib/auth";
import { loadGearDocs, mapSortedGearTree } from "./gearTree";
import type { Doc } from "./_generated/dataModel";

type GearItemPreview = {
  stableId: string;
  name: string;
  sort: number;
  specs: Doc<"gearItems">["specs"];
  url?: string;
};

/**
 * Owner-only preview of studio gear (INF-88). Returns the **draft** tree when
 * `gearMeta.hasDraftChanges` is true, otherwise the published tree. Mirrors
 * `pricingPreviewDraft.getPreviewPricingFlags` so `/preview` can opt into
 * draft overlay without ever exposing it to anonymous readers.
 *
 * Returns `null` for unauthenticated or non-owner callers.
 */
export const getPreviewGear = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) return null;

    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }

    const meta = await ctx.db
      .query("gearMeta")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();

    const hasDraftChanges = meta?.hasDraftChanges ?? false;
    const scope = hasDraftChanges ? "draft" : "published";

    const { categories, items } = await loadGearDocs(ctx, scope);

    return {
      categories: mapSortedGearTree<GearItemPreview>(
        categories,
        items,
        (i) => ({
          stableId: i.stableId,
          name: i.name,
          sort: i.sort,
          specs: i.specs,
          ...(i.url !== undefined ? { url: i.url } : {}),
        }),
      ),
      hasDraftChanges,
    };
  },
});
