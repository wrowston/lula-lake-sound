import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  deleteStorageIfUnreferenced,
  getStorageMetadata,
} from "./mediaStorage";

const VIDEO_QUERY_LIMIT = 64;

export const MAX_VIDEOS = 24;

/** Convex file upload — raw video only; no transcoding (INF-92). */
export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024;

export type VideoScope = Doc<"videos">["scope"];
export type VideoDoc = Doc<"videos">;
export type VideoMetaDoc = Doc<"videoMeta">;

function comparableVideo(row: VideoDoc) {
  return {
    stableId: row.stableId,
    title: row.title,
    description: row.description ?? null,
    sortOrder: row.sortOrder,
    provider: row.provider,
    externalId: row.externalId ?? null,
    playbackUrl: row.playbackUrl ?? null,
    videoStorageId: row.videoStorageId ?? null,
    thumbnailStorageId: row.thumbnailStorageId ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    durationSec: row.durationSec ?? null,
  };
}

export function videoDraftMatchesPublished(
  draft: VideoDoc[],
  published: VideoDoc[],
): boolean {
  if (draft.length !== published.length) {
    return false;
  }
  for (let i = 0; i < draft.length; i++) {
    if (
      JSON.stringify(comparableVideo(draft[i])) !==
      JSON.stringify(comparableVideo(published[i]))
    ) {
      return false;
    }
  }
  return true;
}

export async function loadVideos(
  ctx: QueryCtx | MutationCtx,
  scope: VideoScope,
): Promise<VideoDoc[]> {
  return await ctx.db
    .query("videos")
    .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
    .take(VIDEO_QUERY_LIMIT);
}

export async function ensureVideoMeta(
  ctx: MutationCtx,
): Promise<{ id: Id<"videoMeta">; row: VideoMetaDoc }> {
  const existing = await ctx.db
    .query("videoMeta")
    .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
    .unique();

  if (existing) {
    return { id: existing._id, row: existing };
  }

  const now = Date.now();
  const id = await ctx.db.insert("videoMeta", {
    singletonKey: "default",
    hasDraftChanges: false,
    publishedAt: null,
    updatedAt: now,
  });
  const row = await ctx.db.get(id);
  if (!row) {
    throw new Error("Failed to create videoMeta row.");
  }
  return { id, row };
}

export async function replaceVideosScope(
  ctx: MutationCtx,
  fromScope: VideoScope,
  toScope: VideoScope,
): Promise<void> {
  const [source, target] = await Promise.all([
    loadVideos(ctx, fromScope),
    loadVideos(ctx, toScope),
  ]);

  const sourceStorageIds = new Set<Id<"_storage">>();
  for (const row of source) {
    if (row.videoStorageId) {
      sourceStorageIds.add(row.videoStorageId);
    }
    if (row.thumbnailStorageId) {
      sourceStorageIds.add(row.thumbnailStorageId);
    }
  }

  const targetOnlyStorageIds: Id<"_storage">[] = [];
  for (const row of target) {
    if (row.videoStorageId && !sourceStorageIds.has(row.videoStorageId)) {
      targetOnlyStorageIds.push(row.videoStorageId);
    }
    if (row.thumbnailStorageId && !sourceStorageIds.has(row.thumbnailStorageId)) {
      targetOnlyStorageIds.push(row.thumbnailStorageId);
    }
  }
  const uniqueOrphans = Array.from(new Set(targetOnlyStorageIds));

  for (const row of target) {
    await ctx.db.delete(row._id);
  }

  for (const row of source) {
    await ctx.db.insert("videos", {
      scope: toScope,
      stableId: row.stableId,
      title: row.title,
      ...(row.description !== undefined ? { description: row.description } : {}),
      sortOrder: row.sortOrder,
      provider: row.provider,
      ...(row.externalId !== undefined ? { externalId: row.externalId } : {}),
      ...(row.playbackUrl !== undefined ? { playbackUrl: row.playbackUrl } : {}),
      ...(row.videoStorageId !== undefined
        ? { videoStorageId: row.videoStorageId }
        : {}),
      ...(row.thumbnailStorageId !== undefined
        ? { thumbnailStorageId: row.thumbnailStorageId }
        : {}),
      ...(row.thumbnailUrl !== undefined ? { thumbnailUrl: row.thumbnailUrl } : {}),
      ...(row.durationSec !== undefined ? { durationSec: row.durationSec } : {}),
    });
  }

  for (const storageId of uniqueOrphans) {
    await deleteStorageIfUnreferenced(ctx, storageId);
  }
}

export async function patchVideoMetaAfterDraftChange(
  ctx: MutationCtx,
  updatedBy: string,
): Promise<void> {
  const [draft, published, meta] = await Promise.all([
    loadVideos(ctx, "draft"),
    loadVideos(ctx, "published"),
    ensureVideoMeta(ctx),
  ]);

  await ctx.db.patch(meta.id, {
    hasDraftChanges: !videoDraftMatchesPublished(draft, published),
    updatedAt: Date.now(),
    updatedBy,
  });
}

export type MaterializedVideo = {
  stableId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  provider: VideoDoc["provider"];
  externalId: string | null;
  playbackUrl: string | null;
  videoStorageId: Id<"_storage"> | null;
  videoUrl: string | null;
  thumbnailStorageId: Id<"_storage"> | null;
  thumbnailUrl: string | null;
  resolvedThumbnailUrl: string | null;
  durationSec: number | null;
};

export async function materializeVideos(
  ctx: QueryCtx | MutationCtx,
  rows: VideoDoc[],
): Promise<MaterializedVideo[]> {
  return await Promise.all(
    rows.map(async (row) => {
      const videoUrl = row.videoStorageId
        ? await ctx.storage.getUrl(row.videoStorageId)
        : null;
      const thumbFromStorage = row.thumbnailStorageId
        ? await ctx.storage.getUrl(row.thumbnailStorageId)
        : null;
      return {
        stableId: row.stableId,
        title: row.title,
        description: row.description ?? null,
        sortOrder: row.sortOrder,
        provider: row.provider,
        externalId: row.externalId ?? null,
        playbackUrl: row.playbackUrl ?? null,
        videoStorageId: row.videoStorageId ?? null,
        videoUrl,
        thumbnailStorageId: row.thumbnailStorageId ?? null,
        thumbnailUrl: row.thumbnailUrl ?? null,
        resolvedThumbnailUrl: thumbFromStorage ?? row.thumbnailUrl ?? null,
        durationSec: row.durationSec ?? null,
      };
    }),
  );
}

export { getStorageMetadata };
