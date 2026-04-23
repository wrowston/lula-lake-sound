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
export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
] as const;

export const MAX_AUDIO_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_AUDIO_TRACKS = 30;
const AUDIO_QUERY_LIMIT = 128;

/** Draft rows older than this without a published reference are eligible for GC. */
export const ABANDONED_DRAFT_AUDIO_MS = 7 * 24 * 60 * 60 * 1000;

export type AudioTrackDoc = Doc<"audioTracks">;
export type AudioScope = AudioTrackDoc["scope"];
export type AudioMetaDoc = Doc<"audioTrackMeta">;
export type AudioPublishIssue = { path: string; message: string };

function comparableTrack(row: AudioTrackDoc) {
  return {
    stableId: row.stableId,
    storageId: row.storageId,
    title: row.title,
    artist: row.artist ?? null,
    description: row.description,
    mimeType: row.mimeType,
    durationSec: row.durationSec ?? null,
    albumThumbnailUrl: row.albumThumbnailUrl ?? null,
    spotifyUrl: row.spotifyUrl ?? null,
    appleMusicUrl: row.appleMusicUrl ?? null,
    sortOrder: row.sortOrder,
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

export async function ensureAudioMeta(
  ctx: MutationCtx,
): Promise<{ id: Doc<"audioTrackMeta">["_id"]; row: AudioMetaDoc }> {
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
      ...(row.artist !== undefined ? { artist: row.artist } : {}),
      description: row.description,
      mimeType: row.mimeType,
      ...(row.durationSec !== undefined ? { durationSec: row.durationSec } : {}),
      ...(row.albumThumbnailUrl !== undefined
        ? { albumThumbnailUrl: row.albumThumbnailUrl }
        : {}),
      ...(row.spotifyUrl !== undefined ? { spotifyUrl: row.spotifyUrl } : {}),
      ...(row.appleMusicUrl !== undefined
        ? { appleMusicUrl: row.appleMusicUrl }
        : {}),
      sortOrder: row.sortOrder,
      sizeBytes: row.sizeBytes,
      ...(row.originalFileName !== undefined
        ? { originalFileName: row.originalFileName }
        : {}),
      createdAt: row.createdAt,
    });
  }

  for (const storageId of targetOnlyStorageIds) {
    await deleteStorageIfUnreferenced(ctx, storageId);
  }
}

export async function patchAudioMetaAfterDraftChange(
  ctx: MutationCtx,
  updatedBy: string,
): Promise<void> {
  const [draft, published, meta] = await Promise.all([
    loadAudioTracks(ctx, "draft"),
    loadAudioTracks(ctx, "published"),
    ensureAudioMeta(ctx),
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
    artist: string | null;
    description: string;
    mimeType: string;
    durationSec: number | null;
    sortOrder: number;
    sizeBytes: number;
    originalFileName: string | null;
    albumThumbnailUrl: string | null;
    spotifyUrl: string | null;
    appleMusicUrl: string | null;
  }>
> {
  return await Promise.all(
    rows.map(async (row) => ({
      stableId: row.stableId,
      storageId: row.storageId,
      url: await ctx.storage.getUrl(row.storageId),
      title: row.title,
      artist: row.artist ?? null,
      description: row.description,
      mimeType: row.mimeType,
      durationSec: row.durationSec ?? null,
      sortOrder: row.sortOrder,
      sizeBytes: row.sizeBytes,
      originalFileName: row.originalFileName ?? null,
      albumThumbnailUrl: row.albumThumbnailUrl ?? null,
      spotifyUrl: row.spotifyUrl ?? null,
      appleMusicUrl: row.appleMusicUrl ?? null,
    })),
  );
}
