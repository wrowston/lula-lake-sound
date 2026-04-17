import { internalMutation } from "./_generated/server";
import {
  PRICING_DEFAULTS,
  SETTINGS_DEFAULTS,
  type CmsSection,
  type CmsSnapshot,
} from "./cmsShared";
import { LEGACY_EQUIPMENT_SEED } from "./gearEquipmentSeed";
import { ensureGearMeta, gearDraftMatchesPublished, loadGearDocs } from "./gearTree";

/**
 * Idempotent seed for local dev: creates both CMS rows (`settings`, `pricing`)
 * if missing, so admin editors and public queries have a consistent baseline.
 *
 * Run once after deploying schema:
 * `bunx convex run internal.seed.seedSiteSettingsDefaults` (or from dashboard → Functions → internal).
 */
export const seedSiteSettingsDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    async function ensureSeeded(
      section: CmsSection,
      snapshot: CmsSnapshot,
    ): Promise<{ section: CmsSection; status: "already_seeded" | "inserted" }> {
      const existing = await ctx.db
        .query("cmsSections")
        .withIndex("by_section", (q) => q.eq("section", section))
        .unique();
      if (existing) {
        return { section, status: "already_seeded" };
      }
      await ctx.db.insert("cmsSections", {
        section,
        updatedAt: now,
        publishedSnapshot: snapshot,
        publishedAt: now,
        hasDraftChanges: false,
      });
      return { section, status: "inserted" };
    }

    const results = await Promise.all([
      ensureSeeded("settings", SETTINGS_DEFAULTS),
      ensureSeeded("pricing", PRICING_DEFAULTS),
    ]);

    return {
      results,
    };
  },
});

/**
 * One-time import of legacy `equipment-specs.tsx` gear into **draft** only (INF-86).
 * No-op when any gear rows already exist. After running, call `api.admin.gear.publishGear`
 * from the dashboard (owner auth) to go live, or edit draft first.
 *
 * `bunx convex run internal.seed.seedGearFromEquipmentSpecs`
 */
export const seedGearFromEquipmentSpecs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const draft = await loadGearDocs(ctx, "draft");
    const published = await loadGearDocs(ctx, "published");
    if (
      draft.categories.length +
        draft.items.length +
        published.categories.length +
        published.items.length >
      0
    ) {
      return { ok: false as const, reason: "already_has_data" as const };
    }

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

    return {
      ok: true as const,
      categoriesSeeded: LEGACY_EQUIPMENT_SEED.length,
    };
  },
});
