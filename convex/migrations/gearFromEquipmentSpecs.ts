import { internalMutation } from "../_generated/server";
import { insertLegacyEquipmentSeedDraft } from "../gearLegacySeed";
import { copyGearScope, ensureGearMeta, loadGearDocs } from "../gearTree";

/**
 * One-time migration: loads all gear from `gearEquipmentSeed.ts` (mirrored from
 * `src/components/equipment-specs.tsx`) into Convex and **publishes** so
 * `api.public.getPublishedGear` returns data without a manual admin publish.
 *
 * Idempotent:
 * - If **published** gear already exists → no-op (`published_already_has_data`).
 * - If **draft** already has rows (e.g. after `internal.seed.seedGearFromEquipmentSpecs`)
 *   but published is empty → copies draft → published only.
 * - If both scopes are empty → inserts draft from legacy seed, then publishes.
 *
 * Run after deploy:
 * `bunx convex run migrations/gearFromEquipmentSpecs:migrateGearFromEquipmentSpecs`
 */
export const migrateGearFromEquipmentSpecs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const published = await loadGearDocs(ctx, "published");
    if (published.categories.length + published.items.length > 0) {
      return {
        ok: false as const,
        reason: "published_already_has_data" as const,
      };
    }

    const draft = await loadGearDocs(ctx, "draft");
    if (draft.categories.length + draft.items.length === 0) {
      await insertLegacyEquipmentSeedDraft(ctx);
    }

    await copyGearScope(ctx, "draft", "published");

    const { id: metaId } = await ensureGearMeta(ctx);
    const now = Date.now();
    await ctx.db.patch(metaId, {
      hasDraftChanges: false,
      publishedAt: now,
      updatedAt: now,
    });

    return {
      ok: true as const,
      publishedAt: now,
    };
  },
});
