import { query } from "./_generated/server";
import {
  materializePublicAbout,
  publishedAboutFromScoped,
  publishedPricingFromScoped,
  publishedSettingsFromScoped,
} from "./publicSettingsSnapshot";
import { loadGearDocs, mapSortedGearTree } from "./gearTree";
import type { Doc } from "./_generated/dataModel";
import { loadGalleryPhotos, materializeGalleryPhotos } from "./galleryPhotos";
import { loadAudioTracks, materializeAudioTracks } from "./audioTracks";
import { getSectionMetaRow, publishedIsEnabled } from "./cmsMeta";

/**
 * **Public (anonymous) site reads** — published only.
 *
 * Each handler reads from the per-section scoped tables at `scope="published"`
 * and/or the `cmsSections.isEnabled` flag. For owner preview / draft overlay,
 * see `aboutPreviewDraft` / `pricingPreviewDraft`.
 */
export const getPublishedSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    return await publishedSettingsFromScoped(ctx);
  },
});

/**
 * Published pricing payload for the marketing site.
 *
 * Returns `{ flags: { priceTabEnabled }, packages }` where `priceTabEnabled`
 * mirrors `cmsSections.pricing.isEnabled`. The shape is preserved for back-
 * compat with existing front-end consumers.
 */
export const getPublishedPricingFlags = query({
  args: {},
  handler: async (ctx) => {
    return await publishedPricingFromScoped(ctx);
  },
});

type GearItemPublic = {
  stableId: string;
  name: string;
  sort: number;
  specs: Doc<"gearItems">["specs"];
  url?: string;
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
 * Published About page copy only. Anonymous; reads the published scope of
 * `aboutContent` + `aboutHighlights` + `aboutTeamMembers`. Falls back to
 * seeded defaults when nothing has been published yet.
 */
export const getPublishedAbout = query({
  args: {},
  handler: async (ctx) => {
    const snapshot = await publishedAboutFromScoped(ctx);
    return await materializePublicAbout(ctx, snapshot);
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
 * Published audio portfolio (INF-95). Anonymous; `scope === "published"` only.
 *
 * **Playback URL:** each track includes `url` from `ctx.storage.getUrl` — a
 * time-limited HTTPS URL suitable for `<audio src={url} crossOrigin="anonymous">`.
 * Convex serves stored files with CORS allowing browser fetches from any origin;
 * if playback fails in dev, check the browser network tab for blocked mixed content
 * or expired URLs (refresh the query to obtain a new signed URL).
 */
export const getPublishedAudioTracks = query({
  args: {},
  handler: async (ctx) => {
    const rows = await loadAudioTracks(ctx, "published");
    const tracks = await materializeAudioTracks(ctx, rows);
    return tracks.filter((t) => t.url !== null);
  },
});

/**
 * Marketing-site visibility flags. Reads each section's `cmsSections.isEnabled`
 * and returns the historical shape `{ aboutPage, recordingsPage, pricingSection }`
 * so the existing frontend consumers keep working without changes.
 */
export const getPublishedMarketingFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    const [aboutRow, recordingsRow, pricingRow] = await Promise.all([
      getSectionMetaRow(ctx, "about"),
      getSectionMetaRow(ctx, "recordings"),
      getSectionMetaRow(ctx, "pricing"),
    ]);
    return {
      aboutPage: publishedIsEnabled(aboutRow, "about"),
      recordingsPage: publishedIsEnabled(recordingsRow, "recordings"),
      pricingSection: publishedIsEnabled(pricingRow, "pricing"),
    };
  },
});
