import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  deleteStorageIfUnreferenced,
  getStorageMetadata,
  type StorageMetadataRecord,
} from "./mediaStorage";

export {
  deleteStorageIfUnreferenced,
  getStorageMetadata,
  type StorageMetadataRecord,
};

export const ALLOWED_GALLERY_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_GALLERY_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_GALLERY_PHOTOS = 40;
const GALLERY_QUERY_LIMIT = 128;

/**
 * INF-47 — controlled vocabulary for the `/gallery` page filter pills
 * (Variant C header pattern). Stored on each photo as lower-case slugs.
 * The implicit `"all"` filter never lives in the array; the public page
 * derives it.
 */
export const GALLERY_CATEGORY_SLUGS = ["rooms", "gear", "grounds"] as const;

export type GalleryCategorySlug = (typeof GALLERY_CATEGORY_SLUGS)[number];

/** Display labels for the public filter pills. Order matches the design. */
export const GALLERY_CATEGORY_LABELS: Record<GalleryCategorySlug, string> = {
  rooms: "Rooms",
  gear: "Gear",
  grounds: "Grounds",
};

export function isGalleryCategorySlug(
  value: string,
): value is GalleryCategorySlug {
  return (GALLERY_CATEGORY_SLUGS as readonly string[]).includes(value);
}

/**
 * Normalise a raw categories array (already trimmed in the caller) by
 * lower-casing, validating against the controlled vocabulary, and removing
 * duplicates while preserving the catalogue order. Returns `undefined` when
 * no valid categories remain so callers can omit the field on the
 * underlying document.
 */
export function normalizeGalleryCategories(
  raw: readonly string[] | null | undefined,
): GalleryCategorySlug[] | undefined {
  if (!raw || raw.length === 0) return undefined;
  const seen = new Set<GalleryCategorySlug>();
  for (const value of raw) {
    if (typeof value !== "string") continue;
    const slug = value.trim().toLowerCase();
    if (slug.length === 0) continue;
    if (isGalleryCategorySlug(slug)) {
      seen.add(slug);
    }
  }
  if (seen.size === 0) return undefined;
  return GALLERY_CATEGORY_SLUGS.filter((slug) => seen.has(slug));
}

export type GalleryScope = Doc<"galleryPhotos">["scope"];
export type GalleryPhotoDoc = Doc<"galleryPhotos">;
export type GalleryMetaDoc = Doc<"galleryPhotoMeta">;
export type GalleryPublishIssue = { path: string; message: string };

function comparablePhoto(row: GalleryPhotoDoc) {
  return {
    stableId: row.stableId,
    storageId: row.storageId,
    alt: row.alt,
    caption: row.caption ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    sortOrder: row.sortOrder,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    originalFileName: row.originalFileName ?? null,
    categories: row.categories ?? null,
    showInCarousel: row.showInCarousel ?? null,
    showInGallery: row.showInGallery ?? null,
  };
}

export function galleryDraftMatchesPublished(
  draft: GalleryPhotoDoc[],
  published: GalleryPhotoDoc[],
): boolean {
  if (draft.length !== published.length) {
    return false;
  }

  for (let i = 0; i < draft.length; i++) {
    if (
      JSON.stringify(comparablePhoto(draft[i])) !==
      JSON.stringify(comparablePhoto(published[i]))
    ) {
      return false;
    }
  }

  return true;
}

export async function loadGalleryPhotos(
  ctx: QueryCtx | MutationCtx,
  scope: GalleryScope,
): Promise<GalleryPhotoDoc[]> {
  return await ctx.db
    .query("galleryPhotos")
    .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
    .take(GALLERY_QUERY_LIMIT);
}

export async function ensureGalleryMeta(
  ctx: MutationCtx,
): Promise<{ id: Doc<"galleryPhotoMeta">["_id"]; row: GalleryMetaDoc }> {
  const existing = await ctx.db
    .query("galleryPhotoMeta")
    .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
    .unique();

  if (existing) {
    return { id: existing._id, row: existing };
  }

  const now = Date.now();
  const id = await ctx.db.insert("galleryPhotoMeta", {
    singletonKey: "default",
    hasDraftChanges: false,
    publishedAt: null,
    updatedAt: now,
  });
  const row = await ctx.db.get(id);
  if (!row) {
    throw new Error("Failed to create gallery photo meta row.");
  }
  return { id, row };
}

export async function replaceGalleryScope(
  ctx: MutationCtx,
  fromScope: GalleryScope,
  toScope: GalleryScope,
): Promise<void> {
  const [source, target] = await Promise.all([
    loadGalleryPhotos(ctx, fromScope),
    loadGalleryPhotos(ctx, toScope),
  ]);

  const sourceStorageIds = new Set(source.map((row) => row.storageId));
  const targetOnlyStorageIds = Array.from(
    new Set(
      target
        .map((row) => row.storageId)
        .filter((storageId) => !sourceStorageIds.has(storageId)),
    ),
  );

  for (const row of target) {
    await ctx.db.delete(row._id);
  }

  for (const row of source) {
    await ctx.db.insert("galleryPhotos", {
      scope: toScope,
      stableId: row.stableId,
      storageId: row.storageId,
      alt: row.alt,
      ...(row.caption !== undefined ? { caption: row.caption } : {}),
      ...(row.width !== undefined ? { width: row.width } : {}),
      ...(row.height !== undefined ? { height: row.height } : {}),
      sortOrder: row.sortOrder,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      ...(row.originalFileName !== undefined
        ? { originalFileName: row.originalFileName }
        : {}),
      ...(row.categories !== undefined && row.categories.length > 0
        ? { categories: [...row.categories] }
        : {}),
      ...(row.showInCarousel !== undefined
        ? { showInCarousel: row.showInCarousel }
        : {}),
      ...(row.showInGallery !== undefined
        ? { showInGallery: row.showInGallery }
        : {}),
    });
  }

  for (const storageId of targetOnlyStorageIds) {
    await deleteStorageIfUnreferenced(ctx, storageId);
  }
}

export async function patchGalleryMetaAfterDraftChange(
  ctx: MutationCtx,
  updatedBy: string,
): Promise<void> {
  const [draft, published, meta] = await Promise.all([
    loadGalleryPhotos(ctx, "draft"),
    loadGalleryPhotos(ctx, "published"),
    ensureGalleryMeta(ctx),
  ]);

  await ctx.db.patch(meta.id, {
    hasDraftChanges: !galleryDraftMatchesPublished(draft, published),
    updatedAt: Date.now(),
    updatedBy,
  });
}

export async function materializeGalleryPhotos(
  ctx: QueryCtx | MutationCtx,
  rows: GalleryPhotoDoc[],
): Promise<
  Array<{
    stableId: string;
    storageId: Id<"_storage">;
    url: string | null;
    alt: string;
    caption: string | null;
    width: number | null;
    height: number | null;
    sortOrder: number;
    contentType: string;
    sizeBytes: number;
    originalFileName: string | null;
    categories: GalleryCategorySlug[];
    showInCarousel: boolean;
    showInGallery: boolean;
  }>
> {
  return await Promise.all(
    rows.map(async (row) => ({
      stableId: row.stableId,
      storageId: row.storageId,
      url: await ctx.storage.getUrl(row.storageId),
      alt: row.alt,
      caption: row.caption ?? null,
      width: row.width ?? null,
      height: row.height ?? null,
      sortOrder: row.sortOrder,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      originalFileName: row.originalFileName ?? null,
      categories: normalizeGalleryCategories(row.categories) ?? [],
      showInCarousel: row.showInCarousel !== false,
      showInGallery: row.showInGallery !== false,
    })),
  );
}
