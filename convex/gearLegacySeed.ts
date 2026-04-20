import type { MutationCtx } from "./_generated/server";
import { LEGACY_EQUIPMENT_SEED } from "./gearEquipmentSeed";
import { ensureGearMeta, gearDraftMatchesPublished, loadGearDocs } from "./gearTree";

/**
 * Inserts `LEGACY_EQUIPMENT_SEED` into **draft** only. Caller must ensure draft is empty.
 * Updates `gearMeta` draft/published diff flags.
 */
export async function insertLegacyEquipmentSeedDraft(
  ctx: MutationCtx,
): Promise<void> {
  for (let ci = 0; ci < LEGACY_EQUIPMENT_SEED.length; ci++) {
    const cat = LEGACY_EQUIPMENT_SEED[ci];
    const catStableId = `legacy_cat_${ci}`;
    await ctx.db.insert("gearCategories", {
      scope: "draft",
      stableId: catStableId,
      name: cat.category,
      sort: ci,
    });
    for (let ii = 0; ii < cat.items.length; ii++) {
      const item = cat.items[ii];
      await ctx.db.insert("gearItems", {
        scope: "draft",
        stableId: `legacy_cat_${ci}_item_${ii}`,
        categoryStableId: catStableId,
        name: item.name,
        sort: ii,
        specs: { kind: "markdown", text: item.specs ?? "" },
      });
    }
  }

  const { id: metaId } = await ensureGearMeta(ctx);
  const draftAfter = await loadGearDocs(ctx, "draft");
  const publishedAfter = await loadGearDocs(ctx, "published");
  const hasDraftChanges = !gearDraftMatchesPublished(draftAfter, publishedAfter);
  await ctx.db.patch(metaId, {
    hasDraftChanges,
    updatedAt: Date.now(),
  });
}
