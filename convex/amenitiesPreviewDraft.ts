import { query } from "./_generated/server";
import { requireCmsOwner } from "./lib/auth";
import {
  loadAmenitiesNearbyTree,
  materializePublicAmenitiesNearby,
  materializePublicAmenitiesNearbyFromSnapshot,
} from "./amenitiesTree";
import { AMENITIES_NEARBY_DEFAULT_ROWS } from "./cmsShared";
import { effectiveIsEnabled, getSectionMetaRow } from "./cmsMeta";

/**
 * Owner preview: draft amenities when present, else published (with default-row
 * fallback when published is empty). Returns `null` for non-owners.
 */
export const getPreviewAmenitiesNearby = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }

    const [draftTree, publishedTree, row] = await Promise.all([
      loadAmenitiesNearbyTree(ctx, "draft"),
      loadAmenitiesNearbyTree(ctx, "published"),
      getSectionMetaRow(ctx, "amenitiesNearby"),
    ]);

    if (!effectiveIsEnabled(row, "amenitiesNearby")) {
      return {
        isEnabled: false as const,
        eyebrow: null as string | null,
        heading: null as string | null,
        intro: null as string | null,
        rows: [] as Array<{
          stableId: string;
          name: string;
          type: string;
          description: string;
          website: string;
        }>,
        hasDraftChanges: row?.hasDraftChanges ?? false,
      };
    }

    const hasDraftRows =
      draftTree.items.length > 0 || draftTree.copy !== null;
    const sourceTree = hasDraftRows ? draftTree : publishedTree;
    const materialized = materializePublicAmenitiesNearby(sourceTree);
    const withFallback =
      materialized.rows.length > 0
        ? materialized
        : materializePublicAmenitiesNearbyFromSnapshot({
            ...(sourceTree.copy?.eyebrow !== undefined &&
            sourceTree.copy.eyebrow.trim().length > 0
              ? { eyebrow: sourceTree.copy.eyebrow }
              : {}),
            ...(sourceTree.copy?.heading !== undefined &&
            sourceTree.copy.heading.trim().length > 0
              ? { heading: sourceTree.copy.heading }
              : {}),
            ...(sourceTree.copy?.intro !== undefined &&
            sourceTree.copy.intro.trim().length > 0
              ? { intro: sourceTree.copy.intro }
              : {}),
            rows: AMENITIES_NEARBY_DEFAULT_ROWS,
          });

    return {
      isEnabled: true as const,
      eyebrow: withFallback.eyebrow,
      heading: withFallback.heading,
      intro: withFallback.intro,
      rows: withFallback.rows,
      hasDraftChanges: row?.hasDraftChanges ?? false,
    };
  },
});
