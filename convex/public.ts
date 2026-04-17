import { query } from "./_generated/server";
import {
  publishedPricingFromRows,
  publishedSettingsFromRow,
} from "./publicSettingsSnapshot";
import { loadGearDocs } from "./gearTree";
import type { Doc } from "./_generated/dataModel";

/**
 * **Public (anonymous) site reads** — published snapshot only.
 *
 * Add new landing-page queries here (one entry point per domain). Each handler must
 * read only `publishedSnapshot` (or other published columns), never `draftSnapshot`.
 * For owner preview / draft overlay, use `pricingPreviewDraft` / `siteSettingsPreviewDraft`.
 */
export const getPublishedSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "settings"))
      .unique();

    return publishedSettingsFromRow(row);
  },
});

/**
 * Published pricing feature flags.
 *
 * Resolves the `pricing` section's `publishedSnapshot.flags`. If that row
 * has not yet been written (legacy deployments that still store flags on
 * the `settings` row), the helper falls back to `settings.flags` and then
 * to the seeded defaults, so the marketing site always renders.
 */
export const getPublishedPricingFlags = query({
  args: {},
  handler: async (ctx) => {
    const [pricingRow, settingsRow] = await Promise.all([
      ctx.db
        .query("cmsSections")
        .withIndex("by_section", (q) => q.eq("section", "pricing"))
        .unique(),
      ctx.db
        .query("cmsSections")
        .withIndex("by_section", (q) => q.eq("section", "settings"))
        .unique(),
    ]);

    return publishedPricingFromRows(pricingRow, settingsRow);
  },
});

type GearItemPublic = {
  stableId: string;
  name: string;
  sort: number;
  specs: Doc<"gearItems">["specs"];
  url?: string;
};

type GearCategoryPublic = {
  stableId: string;
  name: string;
  sort: number;
  items: GearItemPublic[];
};

function publishedGearTree(
  categories: Doc<"gearCategories">[],
  items: Doc<"gearItems">[],
): GearCategoryPublic[] {
  const byCat = new Map<string, Doc<"gearItems">[]>();
  for (const it of items) {
    const list = byCat.get(it.categoryStableId) ?? [];
    list.push(it);
    byCat.set(it.categoryStableId, list);
  }
  for (const list of byCat.values()) {
    list.sort((a, b) => a.sort - b.sort || a.stableId.localeCompare(b.stableId));
  }
  const sortedCats = [...categories].sort(
    (a, b) => a.sort - b.sort || a.stableId.localeCompare(b.stableId),
  );
  return sortedCats.map((c) => ({
    stableId: c.stableId,
    name: c.name,
    sort: c.sort,
    items: (byCat.get(c.stableId) ?? []).map((i) => ({
      stableId: i.stableId,
      name: i.name,
      sort: i.sort,
      specs: i.specs,
      ...(i.url !== undefined ? { url: i.url } : {}),
    })),
  }));
}

/**
 * Published studio gear only (INF-86). Anonymous; reads `scope === "published"`.
 */
export const getPublishedGear = query({
  args: {},
  handler: async (ctx) => {
    const { categories, items } = await loadGearDocs(ctx, "published");
    return { categories: publishedGearTree(categories, items) };
  },
});
