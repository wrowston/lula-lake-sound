import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { amenitiesNearbySnapshotValidator } from "./schema.shared";
import { requireCmsOwner } from "./lib/auth";
import {
  effectiveIsEnabled,
  ensureSectionMetaRow,
  getSectionMetaRow,
  publishedIsEnabled,
  recomputeSectionHasDraftChanges,
  sectionHasContentDraftDiff,
} from "./cmsMeta";
import {
  loadAmenitiesNearbyTree,
  replaceAmenitiesNearbyDraft,
  snapshotFromAmenitiesTree,
} from "./amenitiesTree";

/**
 * Owner-only editor payload: published baseline, optional draft overlay, meta.
 */
export const getAdminAmenitiesNearby = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    const row = await getSectionMetaRow(ctx, "amenitiesNearby");
    const publishedTree = await loadAmenitiesNearbyTree(ctx, "published");
    const publishedSnapshot = snapshotFromAmenitiesTree(publishedTree);
    const hasContentDraft = await sectionHasContentDraftDiff(
      ctx,
      "amenitiesNearby",
    );
    const draftSnapshot = hasContentDraft
      ? snapshotFromAmenitiesTree(await loadAmenitiesNearbyTree(ctx, "draft"))
      : null;

    return {
      section: "amenitiesNearby" as const,
      publishedSnapshot,
      publishedAt: row?.publishedAt ?? null,
      publishedBy: row?.publishedBy ?? null,
      draftSnapshot,
      hasDraftChanges: row?.hasDraftChanges ?? false,
      updatedAt: row?.updatedAt ?? null,
      updatedBy: row?.updatedBy ?? null,
      isEnabled: row
        ? publishedIsEnabled(row, "amenitiesNearby")
        : true,
      isEnabledDraft: effectiveIsEnabled(row ?? null, "amenitiesNearby"),
    };
  },
});

export const saveAmenitiesNearbyDraft = mutation({
  args: {
    snapshot: amenitiesNearbySnapshotValidator,
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    await ensureSectionMetaRow(ctx, "amenitiesNearby", updatedBy);
    await replaceAmenitiesNearbyDraft(ctx, args.snapshot);
    await recomputeSectionHasDraftChanges(ctx, "amenitiesNearby", updatedBy);
    const row = await getSectionMetaRow(ctx, "amenitiesNearby");
    return {
      ok: true as const,
      hasDraftChanges: row?.hasDraftChanges ?? false,
    };
  },
});
