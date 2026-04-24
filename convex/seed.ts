import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import {
  ABOUT_DEFAULTS,
  DEFAULT_PRICING_PACKAGES,
  SETTINGS_DEFAULTS,
} from "./cmsShared";
import {
  DEFAULT_IS_ENABLED,
  ensureSectionMetaRow,
} from "./cmsMeta";
import { ABOUT_CONTENT_DEFAULTS, loadAboutContent } from "./aboutTree";
import { loadPricingPackages } from "./pricingTree";
import { loadSettingsContent } from "./settingsTree";
import { LEGACY_EQUIPMENT_SEED } from "./gearEquipmentSeed";
import { insertLegacyEquipmentSeedDraft } from "./gearLegacySeed";
import { deleteAllGearForScope, loadGearDocs } from "./gearTree";

/**
 * Idempotent seed for local dev: creates the four `cmsSections` metadata rows
 * (settings, pricing, about, recordings) and seeds per-section published-scope
 * content so the admin editors and public queries have a consistent baseline.
 *
 * Run once after deploying schema:
 * `bunx convex run internal.seed.seedSiteSettingsDefaults`.
 */
export const seedSiteSettingsDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    type SectionSeedResult = {
      section: "settings" | "pricing" | "about" | "recordings";
      status: "already_seeded" | "inserted";
    };

    const results: SectionSeedResult[] = [];

    for (const section of ["settings", "pricing", "about", "recordings"] as const) {
      const before = await ctx.db
        .query("cmsSections")
        .withIndex("by_section", (q) => q.eq("section", section))
        .unique();
      await ensureSectionMetaRow(ctx, section, undefined);
      results.push({
        section,
        status: before ? "already_seeded" : "inserted",
      });
    }

    // Published-scope content seeds — only insert when the scope is empty so
    // re-running the seed never clobbers authored data.
    const settingsPublished = await loadSettingsContent(ctx, "published");
    if (settingsPublished === null) {
      await ctx.db.insert("settingsContent", {
        scope: "published",
        ...(SETTINGS_DEFAULTS.metadata?.title !== undefined
          ? { title: SETTINGS_DEFAULTS.metadata.title }
          : {}),
        ...(SETTINGS_DEFAULTS.metadata?.description !== undefined
          ? { description: SETTINGS_DEFAULTS.metadata.description }
          : {}),
      });
    }

    const aboutPublished = await loadAboutContent(ctx, "published");
    if (aboutPublished === null) {
      await ctx.db.insert("aboutContent", {
        scope: "published",
        heroTitle: ABOUT_CONTENT_DEFAULTS.heroTitle,
        ...(ABOUT_CONTENT_DEFAULTS.heroSubtitle !== undefined
          ? { heroSubtitle: ABOUT_CONTENT_DEFAULTS.heroSubtitle }
          : {}),
        ...(ABOUT_CONTENT_DEFAULTS.bodyBlocks !== undefined
          ? { bodyBlocks: ABOUT_CONTENT_DEFAULTS.bodyBlocks }
          : {}),
        ...(ABOUT_CONTENT_DEFAULTS.pullQuote !== undefined
          ? { pullQuote: ABOUT_CONTENT_DEFAULTS.pullQuote }
          : {}),
        ...(ABOUT_CONTENT_DEFAULTS.seoTitle !== undefined
          ? { seoTitle: ABOUT_CONTENT_DEFAULTS.seoTitle }
          : {}),
        ...(ABOUT_CONTENT_DEFAULTS.seoDescription !== undefined
          ? { seoDescription: ABOUT_CONTENT_DEFAULTS.seoDescription }
          : {}),
      });
    }

    const pricingPublished = await loadPricingPackages(ctx, "published");
    if (pricingPublished.length === 0) {
      for (const pkg of DEFAULT_PRICING_PACKAGES) {
        await ctx.db.insert("pricingPackages", {
          scope: "published",
          stableId: pkg.id,
          name: pkg.name,
          ...(pkg.description !== undefined
            ? { description: pkg.description }
            : {}),
          priceCents: pkg.priceCents,
          currency: pkg.currency,
          billingCadence: pkg.billingCadence,
          ...(pkg.unitLabel !== undefined ? { unitLabel: pkg.unitLabel } : {}),
          highlight: pkg.highlight,
          sortOrder: pkg.sortOrder,
          isActive: pkg.isActive,
          ...(pkg.features !== undefined ? { features: pkg.features } : {}),
        });
      }
    }

    return {
      results,
      defaultIsEnabled: DEFAULT_IS_ENABLED,
      aboutDefaultsHeroTitle: ABOUT_DEFAULTS.heroTitle,
    };
  },
});

/**
 * One-time import of legacy `equipment-specs.tsx` gear into **draft** only (INF-86).
 * No-op when any gear rows already exist (unless `force: true`, which deletes draft
 * and published gear first — use only when you intend to replace everything).
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
