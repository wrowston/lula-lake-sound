import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import {
  ABOUT_DEFAULTS,
  PRICING_DEFAULTS,
  SETTINGS_DEFAULTS,
  type CmsSection,
  type CmsSnapshot,
} from "./cmsShared";
import { LEGACY_EQUIPMENT_SEED } from "./gearEquipmentSeed";
import { insertLegacyEquipmentSeedDraft } from "./gearLegacySeed";
import { deleteAllGearForScope, loadGearDocs } from "./gearTree";

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
      ensureSeeded("about", ABOUT_DEFAULTS),
    ]);

    return {
      results,
    };
  },
});

/**
 * One-time import of legacy `equipment-specs.tsx` gear into **draft** only (INF-86).
 * No-op when any gear rows already exist (unless `force: true`, which deletes draft
 * and published gear first — use only when you intend to replace everything).
 * After running, call `api.admin.gear.publishGear` from the dashboard (owner auth)
 * to go live, or use `migrations/gearFromEquipmentSpecs:migrateGearFromEquipmentSpecs`
 * to publish without owner auth.
 *
 * `bunx convex run seed:seedGearFromEquipmentSpecs`
 * Replace existing gear: `bunx convex run seed:seedGearFromEquipmentSpecs '{"force":true}'`
 */
export const seedGearFromEquipmentSpecs = internalMutation({
  args: {
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const draft = await loadGearDocs(ctx, "draft");
    const published = await loadGearDocs(ctx, "published");
    const hasAny =
      draft.categories.length +
        draft.items.length +
        published.categories.length +
        published.items.length >
      0;

    if (hasAny && !args.force) {
      return { ok: false as const, reason: "already_has_data" as const };
    }

    if (args.force && hasAny) {
      await deleteAllGearForScope(ctx, "draft");
      await deleteAllGearForScope(ctx, "published");
    }

    await insertLegacyEquipmentSeedDraft(ctx);

    return {
      ok: true as const,
      categoriesSeeded: LEGACY_EQUIPMENT_SEED.length,
      replaced: Boolean(args.force && hasAny),
    };
  },
});
