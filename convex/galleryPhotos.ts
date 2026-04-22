import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { deleteStorageIfUnreferencedAcrossCms } from "./audioTracks";

export const ALLOWED_GALLERY_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_GALLERY_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_GALLERY_PHOTOS = 40;
const GALLERY_QUERY_LIMIT = 128;

export type GalleryScope = Doc<"galleryPhotos">["scope"];
export type GalleryPhotoDoc = Doc<"galleryPhotos">;
export type GalleryMetaDoc = Doc<"galleryPhotoMeta">;
export type GalleryPublishIssue = { path: string; message: string };
export type StorageMetadataRecord = {
  _id: Id<"_storage">;
  _creationTime: number;
  contentType?: string;
  sha256: string;
  size: number;
};

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

export async function getStorageMetadata(
  ctx: QueryCtx | MutationCtx,
  storageId: Id<"_storage">,
): Promise<StorageMetadataRecord | null> {
  return (await ctx.db.system.get(
    "_storage",
    storageId,
  )) as StorageMetadataRecord | null;
}

export async function deleteStorageIfUnreferenced(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
): Promise<boolean> {
  return deleteStorageIfUnreferencedAcrossCms(ctx, storageId);
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
    })),
  );
}
