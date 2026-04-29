import { query } from "./_generated/server";
import { loadGalleryPhotos, materializeGalleryPhotos } from "./galleryPhotos";
import { loadVideos, materializeVideos } from "./videos";
import { requireCmsOwner } from "./lib/auth";

/**
 * Owner-only preview of studio gallery photos. Returns the **draft** set when
 * there are unpublished changes, otherwise the published set. Returns `null`
 * for unauthenticated or non-owner callers.
 */
export const getPreviewGalleryPhotos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }

    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }

    const meta = await ctx.db
      .query("galleryPhotoMeta")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();

    const hasDraftChanges = meta?.hasDraftChanges ?? false;
    const rows = await loadGalleryPhotos(
      ctx,
      hasDraftChanges ? "draft" : "published",
    );
    const photos = await materializeGalleryPhotos(ctx, rows);
    return {
      photos: photos.filter(
        (photo) => photo.url !== null && photo.showInGallery !== false,
      ),
      hasDraftChanges,
    };
  },
});

/**
 * Owner-only: draft/published images for the homepage carousel (`showInCarousel`).
 */
export const getPreviewCarouselPhotos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }

    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }

    const meta = await ctx.db
      .query("galleryPhotoMeta")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();

    const hasDraftChanges = meta?.hasDraftChanges ?? false;
    const rows = await loadGalleryPhotos(
      ctx,
      hasDraftChanges ? "draft" : "published",
    );
    const photos = await materializeGalleryPhotos(ctx, rows);

    return {
      photos: photos.filter(
        (photo) => photo.url !== null && photo.showInCarousel !== false,
      ),
      hasDraftChanges,
    };
  },
});

/**
 * Owner-only preview of CMS videos for `/preview/gallery`. Resolves draft rows
 * when unpublished video changes exist; otherwise mirrors the published list.
 * Lives alongside gallery preview queries so one deployment surface updates with
 * the gallery admin bundle.
 */
export const getPreviewVideos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }

    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }

    const meta = await ctx.db
      .query("videoMeta")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();

    const hasDraftChanges = meta?.hasDraftChanges ?? false;
    const rows = await loadVideos(
      ctx,
      hasDraftChanges ? "draft" : "published",
    );

    return {
      videos: await materializeVideos(ctx, rows),
      hasDraftChanges,
    };
  },
});
