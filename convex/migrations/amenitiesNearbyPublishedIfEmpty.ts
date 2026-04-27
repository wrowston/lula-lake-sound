import { internalMutation } from "../_generated/server";
import {
  copyAmenitiesNearbyScope,
  insertDefaultAmenitiesNearbyPublishedIfEmpty,
  loadAmenitiesNearbyCopy,
  loadAmenitiesNearbyItems,
} from "../amenitiesTree";
import { ensureSectionMetaRow, recomputeSectionHasDraftChanges } from "../cmsMeta";

/**
 * One-time backfill: inserts the shipped default “Local Favorites” amenity
 * cards into `amenitiesNearbyItems` for `scope="published"` when published is
 * empty (no copy row, no item rows). When **draft** is also empty, copies
 * published into draft so the admin editor matches live content. Idempotent.
 *
 * Run after deploy:
 * `bunx convex run migrations/amenitiesNearbyPublishedIfEmpty:migrateAmenitiesNearbyPublishedIfEmpty`
 */
export const migrateAmenitiesNearbyPublishedIfEmpty = internalMutation({
  args: {},
  handler: async (ctx) => {
    const didInsert = await insertDefaultAmenitiesNearbyPublishedIfEmpty(ctx);
    if (!didInsert) {
      return { ok: true as const, kind: "already_has_content" as const };
    }

    await ensureSectionMetaRow(ctx, "amenitiesNearby", undefined);

    const copyDraft = await loadAmenitiesNearbyCopy(ctx, "draft");
    const itemsDraft = await loadAmenitiesNearbyItems(ctx, "draft");
    if (copyDraft === null && itemsDraft.length === 0) {
      await copyAmenitiesNearbyScope(ctx, "published", "draft");
    }

    await recomputeSectionHasDraftChanges(ctx, "amenitiesNearby", undefined);
    return { ok: true as const, kind: "inserted" as const };
  },
});
