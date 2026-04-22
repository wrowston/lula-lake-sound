import { query } from "./_generated/server";
import {
  materializePublicAbout,
  publishedAboutFromRow,
  publishedPricingFromRows,
  publishedSettingsFromRow,
} from "./publicSettingsSnapshot";
import { loadGearDocs, mapSortedGearTree } from "./gearTree";
import type { Doc } from "./_generated/dataModel";
import { loadGalleryPhotos, materializeGalleryPhotos } from "./galleryPhotos";
import { loadAudioTracks, materializeAudioTracks } from "./audioTracks";

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

/**
 * Published studio gear only (INF-86). Anonymous; reads `scope === "published"`.
 */
export const getPublishedGear = query({
  args: {},
  handler: async (ctx) => {
    const { categories, items } = await loadGearDocs(ctx, "published");
    return {
      categories: mapSortedGearTree<GearItemPublic>(categories, items, (i) => ({
        stableId: i.stableId,
        name: i.name,
        sort: i.sort,
        specs: i.specs,
        ...(i.url !== undefined ? { url: i.url } : {}),
      })),
    };
  },
});

/**
 * Published About page copy only. Anonymous; reads `publishedSnapshot` for
 * the `about` section. Falls back to seeded defaults when the row doesn't
 * exist yet, so the public route always renders.
 */
export const getPublishedAbout = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "about"))
      .unique();
    const snapshot = publishedAboutFromRow(row);
    return await materializePublicAbout(ctx, snapshot);
  },
});

/**
 * Lightweight visibility check for the INF-46 About-page feature flag. Used
 * by the header nav and other high-traffic surfaces so we don't have to load
 * the full About snapshot (and generate signed team-headshot URLs) every
 * time they need to decide whether to render the "About" link.
 */
export const getPublishedAboutVisibility = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "about"))
      .unique();
    const snapshot = publishedAboutFromRow(row);
    return { published: snapshot.published === true };
  },
});

/**
 * Published studio gallery photos only. Anonymous; reads `scope === "published"`.
 */
export const getPublishedGalleryPhotos = query({
  args: {},
  handler: async (ctx) => {
    const rows = await loadGalleryPhotos(ctx, "published");
    const photos = await materializeGalleryPhotos(ctx, rows);
    return photos.filter((photo) => photo.url !== null);
  },
});

/**
 * Published audio portfolio tracks only. Anonymous; reads `scope === "published"`.
 */
export const getPublishedAudioTracks = query({
  args: {},
  handler: async (ctx) => {
    const rows = await loadAudioTracks(ctx, "published");
    const tracks = await materializeAudioTracks(ctx, rows);
    return tracks.filter((track) => track.url !== null);
  },
});
