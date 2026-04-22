import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export const ALLOWED_AUDIO_CONTENT_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
] as const;

export const MAX_AUDIO_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_AUDIO_TRACKS = 30;
const AUDIO_QUERY_LIMIT = 128;

export type AudioScope = Doc<"audioTracks">["scope"];
export type AudioTrackDoc = Doc<"audioTracks">;
export type AudioTrackMetaDoc = Doc<"audioTrackMeta">;
export type AudioPublishIssue = { path: string; message: string };

export type StorageMetadataRecord = {
  _id: Id<"_storage">;
  _creationTime: number;
  contentType?: string;
  sha256: string;
  size: number;
};

function comparableTrack(row: AudioTrackDoc) {
  return {
    stableId: row.stableId,
    storageId: row.storageId,
    title: row.title,
    sortOrder: row.sortOrder,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    originalFileName: row.originalFileName ?? null,
  };
}

export function audioDraftMatchesPublished(
  draft: AudioTrackDoc[],
  published: AudioTrackDoc[],
): boolean {
  if (draft.length !== published.length) {
    return false;
  }
  for (let i = 0; i < draft.length; i++) {
    if (
      JSON.stringify(comparableTrack(draft[i])) !==
      JSON.stringify(comparableTrack(published[i]))
    ) {
      return false;
    }
  }
  return true;
}

export async function loadAudioTracks(
  ctx: QueryCtx | MutationCtx,
  scope: AudioScope,
): Promise<AudioTrackDoc[]> {
  return await ctx.db
    .query("audioTracks")
    .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
    .take(AUDIO_QUERY_LIMIT);
}

export async function ensureAudioTrackMeta(
  ctx: MutationCtx,
): Promise<{ id: Doc<"audioTrackMeta">["_id"]; row: AudioTrackMetaDoc }> {
  const existing = await ctx.db
    .query("audioTrackMeta")
    .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
    .unique();

  if (existing) {
    return { id: existing._id, row: existing };
  }

  const now = Date.now();
  const id = await ctx.db.insert("audioTrackMeta", {
    singletonKey: "default",
    hasDraftChanges: false,
    publishedAt: null,
    updatedAt: now,
  });
  const row = await ctx.db.get(id);
  if (!row) {
    throw new Error("Failed to create audio track meta row.");
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

/**
 * Deletes a storage blob only when no gallery photo or audio track references it.
 */
export async function deleteStorageIfUnreferencedAcrossCms(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
): Promise<boolean> {
  const galleryRefs = await ctx.db
    .query("galleryPhotos")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .take(1);
  if (galleryRefs.length > 0) {
    return false;
  }

  const audioRefs = await ctx.db
    .query("audioTracks")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .take(1);
  if (audioRefs.length > 0) {
    return false;
  }

  const storage = await getStorageMetadata(ctx, storageId);
  if (!storage) {
    return false;
  }

  await ctx.storage.delete(storageId);
  return true;
}

export async function replaceAudioScope(
  ctx: MutationCtx,
  fromScope: AudioScope,
  toScope: AudioScope,
): Promise<void> {
  const [source, target] = await Promise.all([
    loadAudioTracks(ctx, fromScope),
    loadAudioTracks(ctx, toScope),
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
    await ctx.db.insert("audioTracks", {
      scope: toScope,
      stableId: row.stableId,
      storageId: row.storageId,
      title: row.title,
      sortOrder: row.sortOrder,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      ...(row.originalFileName !== undefined
        ? { originalFileName: row.originalFileName }
        : {}),
    });
  }

  for (const storageId of targetOnlyStorageIds) {
    await deleteStorageIfUnreferencedAcrossCms(ctx, storageId);
  }
}

export async function patchAudioMetaAfterDraftChange(
  ctx: MutationCtx,
  updatedBy: string,
): Promise<void> {
  const [draft, published, meta] = await Promise.all([
    loadAudioTracks(ctx, "draft"),
    loadAudioTracks(ctx, "published"),
    ensureAudioTrackMeta(ctx),
  ]);

  await ctx.db.patch(meta.id, {
    hasDraftChanges: !audioDraftMatchesPublished(draft, published),
    updatedAt: Date.now(),
    updatedBy,
  });
}

export async function materializeAudioTracks(
  ctx: QueryCtx | MutationCtx,
  rows: AudioTrackDoc[],
): Promise<
  Array<{
    stableId: string;
    storageId: Id<"_storage">;
    url: string | null;
    title: string;
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
      title: row.title,
      sortOrder: row.sortOrder,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      originalFileName: row.originalFileName ?? null,
    })),
  );
}

export function isAllowedAudioContentType(
  contentType: string,
): contentType is (typeof ALLOWED_AUDIO_CONTENT_TYPES)[number] {
  return (ALLOWED_AUDIO_CONTENT_TYPES as readonly string[]).includes(contentType);
}
