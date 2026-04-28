import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export type StorageMetadataRecord = {
  _id: Id<"_storage">;
  _creationTime: number;
  contentType?: string;
  sha256: string;
  size: number;
};

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
  const [galleryRefs, audioRefs, audioArtRefs, videoRefs, videoThumbRefs] =
    await Promise.all([
    ctx.db
      .query("galleryPhotos")
      .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
      .take(1),
    ctx.db
      .query("audioTracks")
      .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
      .take(1),
    ctx.db
      .query("audioTracks")
      .withIndex("by_albumThumbnailStorageId", (q) =>
        q.eq("albumThumbnailStorageId", storageId),
      )
      .take(1),
    ctx.db
      .query("videos")
      .withIndex("by_videoStorageId", (q) => q.eq("videoStorageId", storageId))
      .take(1),
    ctx.db
      .query("videos")
      .withIndex("by_thumbnailStorageId", (q) =>
        q.eq("thumbnailStorageId", storageId),
      )
      .take(1),
  ]);
  if (
    galleryRefs.length > 0 ||
    audioRefs.length > 0 ||
    audioArtRefs.length > 0 ||
    videoRefs.length > 0 ||
    videoThumbRefs.length > 0
  ) {
    return false;
  }

  const storage = await getStorageMetadata(ctx, storageId);
  if (!storage) {
    return false;
  }

  await ctx.storage.delete(storageId);
  return true;
}
