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
import { loadVideos, materializeVideos } from "./videos";
import { getSectionMetaRow, publishedIsEnabled } from "./cmsMeta";
import {
  fallbackAmenitiesSnapshotFromTree,
  loadAmenitiesNearbyTree,
  materializePublicAmenitiesNearby,
  materializePublicAmenitiesNearbyFromSnapshot,
} from "./amenitiesTree";
import { FAQ_DEFAULTS } from "./cmsShared";
import { loadFaqTree, materializeFaqCategories } from "./faqTree";

type MaterializedGalleryPhoto = Awaited<
  ReturnType<typeof materializeGalleryPhotos>
>[number];
type MaterializedAudioTrack = Awaited<
  ReturnType<typeof materializeAudioTracks>
>[number];
type MaterializedVideo = Awaited<ReturnType<typeof materializeVideos>>[number];

function hasResolvedUrl<T extends { url: string | null }>(
  row: T,
): row is T & { url: string } {
  return row.url !== null;
}

function publicGalleryPhoto(photo: MaterializedGalleryPhoto) {
  return {
    stableId: photo.stableId,
    url: photo.url,
    alt: photo.alt,
    caption: photo.caption,
    width: photo.width,
    height: photo.height,
    sortOrder: photo.sortOrder,
    contentType: photo.contentType,
    categories: photo.categories,
  };
}

function publicCarouselPhoto(photo: MaterializedGalleryPhoto) {
  return {
    stableId: photo.stableId,
    url: photo.url,
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
    sortOrder: photo.sortOrder,
  };
}

function publicAudioTrack(track: MaterializedAudioTrack & { url: string }) {
  return {
    stableId: track.stableId,
    url: track.url,
    title: track.title,
    artist: track.artist,
    genre: track.genre,
    year: track.year,
    role: track.role,
    sortOrder: track.sortOrder,
    albumThumbnailDisplayUrl: track.albumThumbnailDisplayUrl,
    spotifyUrl: track.spotifyUrl,
    appleMusicUrl: track.appleMusicUrl,
  };
}

function publicVideo(video: MaterializedVideo) {
  return {
    stableId: video.stableId,
    title: video.title,
    description: video.description,
    sortOrder: video.sortOrder,
    provider: video.provider,
    externalId: video.externalId,
    playbackUrl: video.playbackUrl,
    videoUrl: video.videoUrl,
    thumbnailUrl: video.thumbnailUrl,
    resolvedThumbnailUrl: video.resolvedThumbnailUrl,
    durationSec: video.durationSec,
  };
}

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
 * Excludes images with `showInGallery === false`.
 */
export const getPublishedGalleryPhotos = query({
  args: {},
  handler: async (ctx) => {
    const rows = await loadGalleryPhotos(ctx, "published");
    const photos = await materializeGalleryPhotos(ctx, rows);
    return photos
      .filter((photo) => photo.url !== null && photo.showInGallery !== false)
      .map(publicGalleryPhoto);
  },
});

/**
 * Images for the homepage "The Space" carousel — same table, filtered by `showInCarousel !== false`.
 */
export const getPublishedCarouselPhotos = query({
  args: {},
  handler: async (ctx) => {
    const rows = await loadGalleryPhotos(ctx, "published");
    const photos = await materializeGalleryPhotos(ctx, rows);
    return photos
      .filter((photo) => photo.url !== null && photo.showInCarousel !== false)
      .map(publicCarouselPhoto);
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
    return tracks.filter(hasResolvedUrl).map(publicAudioTrack);
  },
});

/**
 * Published CMS videos (INF-92). Anonymous; `scope === "published"` only.
 * Embed URLs are **not** stored — clients build YouTube/Vimeo/Mux iframes from
 * `provider` + `externalId`; uploads expose `videoUrl` from storage.
 */
export const getPublishedVideos = query({
  args: {},
  handler: async (ctx) => {
    const rows = await loadVideos(ctx, "published");
    const videos = await materializeVideos(ctx, rows);
    return videos.map(publicVideo);
  },
});

/**
 * Published homepage "Local Favorites" block.
 * When `isEnabled` is false the section is hidden (empty payload).
 * When enabled and published rows are empty, falls back to
 * {@link AMENITIES_NEARBY_DEFAULT_ROWS}.
 */
export const getPublishedAmenitiesNearby = query({
  args: {},
  handler: async (ctx) => {
    const row = await getSectionMetaRow(ctx, "amenitiesNearby");
    if (!publishedIsEnabled(row, "amenitiesNearby")) {
      return {
        isEnabled: false as const,
        eyebrow: null as string | null,
        heading: null as string | null,
        intro: null as string | null,
        rows: [] as Array<{
          stableId: string;
          name: string;
          type: string;
          description: string;
          website: string;
        }>,
      };
    }
    const tree = await loadAmenitiesNearbyTree(ctx, "published");
    const out = materializePublicAmenitiesNearby(tree);
    if (out.rows.length === 0) {
      return {
        isEnabled: true as const,
        ...materializePublicAmenitiesNearbyFromSnapshot(
          fallbackAmenitiesSnapshotFromTree(tree),
        ),
      };
    }
    return { isEnabled: true as const, ...out };
  },
});

/**
 * Published homepage FAQ (plain text answers). Falls back to shipped defaults
 * when the published scope has not been seeded yet.
 */
export const getPublishedFaq = query({
  args: {},
  handler: async (ctx) => {
    const tree = await loadFaqTree(ctx, "published");
    if (tree.categories.length === 0) {
      return { categories: FAQ_DEFAULTS.categories };
    }
    return { categories: materializeFaqCategories(tree) };
  },
});

/**
 * Marketing-site visibility flags. Reads each section's `cmsSections.isEnabled`
 * and returns `{ aboutPage, recordingsPage, pricingSection, galleryPage }`.
 */
export const getPublishedMarketingFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    const [aboutRow, recordingsRow, pricingRow, photosRow] = await Promise.all([
      getSectionMetaRow(ctx, "about"),
      getSectionMetaRow(ctx, "recordings"),
      getSectionMetaRow(ctx, "pricing"),
      getSectionMetaRow(ctx, "photos"),
    ]);
    return {
      aboutPage: publishedIsEnabled(aboutRow, "about"),
      recordingsPage: publishedIsEnabled(recordingsRow, "recordings"),
      pricingSection: publishedIsEnabled(pricingRow, "pricing"),
      galleryPage: publishedIsEnabled(photosRow, "photos"),
    };
  },
});
