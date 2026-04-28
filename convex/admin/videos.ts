import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_VIDEO_UPLOAD_BYTES,
  MAX_VIDEOS,
  ensureVideoMeta,
  getStorageMetadata,
  loadVideos,
  materializeVideos,
  patchVideoMetaAfterDraftChange,
  replaceVideosScope,
  type VideoDoc,
} from "../videos";
import { deleteStorageIfUnreferenced } from "../mediaStorage";
import { cmsNotFound, cmsPublishValidationFailed, cmsValidationError } from "../errors";
import { requireCmsOwner } from "../lib/auth";
import {
  externalIdValidationMessage,
  muxPlaybackUrlErrorMessage,
  normalizeExternalIdForProvider,
  parseHttpsThumbnailUrl,
  parseMuxPlaybackUrl,
  thumbnailUrlErrorMessage,
} from "../videoUrls";
import type { VideoProvider } from "../videoUrls";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

const videoProviderArg = v.union(
  v.literal("youtube"),
  v.literal("vimeo"),
  v.literal("mux"),
  v.literal("upload"),
);

type VideoPublishIssue = { path: string; message: string };

function generateVideoStableId(): string {
  return `vid_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeTitle(raw: string): string {
  const value = raw.trim();
  if (value.length === 0) {
    cmsValidationError("Title is required.", "title");
  }
  if (value.length > MAX_TITLE_LENGTH) {
    cmsValidationError(
      `Title must be at most ${MAX_TITLE_LENGTH} characters.`,
      "title",
    );
  }
  return value;
}

function normalizeDescription(raw?: string | null): string | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const value = raw.trim();
  if (value.length === 0) {
    return undefined;
  }
  if (value.length > MAX_DESCRIPTION_LENGTH) {
    cmsValidationError(
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`,
      "description",
    );
  }
  return value;
}

function normalizeOptionalThumbnailUrl(
  raw?: string | null,
): string | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const value = raw.trim();
  if (value.length === 0) {
    return undefined;
  }
  try {
    return parseHttpsThumbnailUrl(value).url;
  } catch (e) {
    const code = e instanceof Error ? e.message : "INVALID";
    if (code === "TOO_LONG") {
      cmsValidationError("Thumbnail URL is too long.", "thumbnailUrl");
    }
    cmsValidationError(
      thumbnailUrlErrorMessage("thumbnail URL"),
      "thumbnailUrl",
    );
  }
}

function normalizeOptionalMuxPlayback(
  raw?: string | null,
): string | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const value = raw.trim();
  if (value.length === 0) {
    return undefined;
  }
  try {
    return parseMuxPlaybackUrl(value).url;
  } catch {
    cmsValidationError(
      muxPlaybackUrlErrorMessage("Mux playback URL"),
      "playbackUrl",
    );
  }
}

function normalizeDurationSec(raw?: number | null): number | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (!Number.isFinite(raw) || raw < 0 || raw > 24 * 3600) {
    cmsValidationError(
      "Duration must be between 0 and 24 hours (in seconds).",
      "durationSec",
    );
  }
  return Math.round(raw * 1000) / 1000;
}

function isAllowedVideoMime(
  contentType: string,
): contentType is (typeof ALLOWED_VIDEO_MIME_TYPES)[number] {
  return (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(
    contentType,
  );
}

async function validateVideoUploadStorage(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
): Promise<void> {
  const storage = await getStorageMetadata(ctx, storageId);
  if (!storage) {
    cmsValidationError(
      "Uploaded file was not found in storage.",
      "videoStorageId",
    );
  }
  if (!storage.contentType || !isAllowedVideoMime(storage.contentType)) {
    cmsValidationError(
      "Only MP4, WebM, or QuickTime video uploads are allowed.",
      "videoStorageId",
    );
  }
  if (storage.size > MAX_VIDEO_UPLOAD_BYTES) {
    cmsValidationError(
      `Video uploads must be ${Math.floor(MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024))}MB or smaller.`,
      "videoStorageId",
    );
  }
}

async function getDraftVideoByStableId(
  ctx: MutationCtx,
  stableId: string,
): Promise<VideoDoc | null> {
  return await ctx.db
    .query("videos")
    .withIndex("by_scope_and_stableId", (q) =>
      q.eq("scope", "draft").eq("stableId", stableId),
    )
    .unique();
}

function resolveEmbedFields(args: {
  provider: VideoProvider;
  externalId?: string | null;
  playbackUrl?: string | null;
}): { externalId?: string; playbackUrl?: string } {
  const { provider } = args;
  if (provider === "upload") {
    return {};
  }
  if (provider === "mux") {
    const extRaw = args.externalId?.trim() ?? "";
    if (extRaw.length === 0) {
      cmsValidationError(
        "Mux playback id or URL is required.",
        "externalId",
      );
    }
    let externalId: string;
    try {
      externalId = normalizeExternalIdForProvider("mux", extRaw);
    } catch (e) {
      const code = e instanceof Error ? e.message : "INVALID_MUX_URL";
      cmsValidationError(
        externalIdValidationMessage("mux", code),
        "externalId",
      );
    }
    const playback = normalizeOptionalMuxPlayback(args.playbackUrl);
    return {
      externalId,
      ...(playback !== undefined ? { playbackUrl: playback } : {}),
    };
  }

  const extRaw = args.externalId?.trim() ?? "";
  if (extRaw.length === 0) {
    cmsValidationError(
      "Video id or watch URL is required for this provider.",
      "externalId",
    );
  }
  try {
    const externalId = normalizeExternalIdForProvider(provider, extRaw);
    return { externalId };
  } catch (e) {
    const code = e instanceof Error ? e.message : "INVALID";
    cmsValidationError(
      externalIdValidationMessage(provider, code),
      "externalId",
    );
  }
}

async function buildVideoInsertPatch(args: {
  provider: VideoProvider;
  title: string;
  description?: string;
  sortOrder: number;
  externalId?: string | null;
  playbackUrl?: string | null;
  videoStorageId?: Id<"_storage"> | null;
  thumbnailStorageId?: Id<"_storage"> | null;
  thumbnailUrl?: string | null;
  durationSec?: number | null;
}): Promise<Omit<VideoDoc, "_id" | "_creationTime">> {
  const title = normalizeTitle(args.title);
  const description = normalizeDescription(args.description);
  const thumbUrl = normalizeOptionalThumbnailUrl(args.thumbnailUrl);
  const durationSec = normalizeDurationSec(args.durationSec);

  const base = {
    scope: "draft" as const,
    title,
    ...(description !== undefined ? { description } : {}),
    sortOrder: args.sortOrder,
    ...(thumbUrl !== undefined ? { thumbnailUrl: thumbUrl } : {}),
    ...(args.thumbnailStorageId !== undefined &&
    args.thumbnailStorageId !== null
      ? { thumbnailStorageId: args.thumbnailStorageId }
      : {}),
    ...(durationSec !== undefined ? { durationSec } : {}),
  };

  if (args.provider === "upload") {
    if (!args.videoStorageId) {
      cmsValidationError(
        "A video file upload is required when provider is upload.",
        "videoStorageId",
      );
    }
    return {
      ...base,
      stableId: generateVideoStableId(),
      provider: "upload",
      videoStorageId: args.videoStorageId,
    };
  }

  const resolved = resolveEmbedFields({
    provider: args.provider,
    externalId: args.externalId,
    playbackUrl: args.playbackUrl,
  });

  return {
    ...base,
    stableId: generateVideoStableId(),
    provider: args.provider,
    ...(resolved.externalId !== undefined
      ? { externalId: resolved.externalId }
      : {}),
    ...(resolved.playbackUrl !== undefined
      ? { playbackUrl: resolved.playbackUrl }
      : {}),
  };
}

export async function validateDraftVideosForPublish(
  ctx: MutationCtx,
  rows: VideoDoc[],
): Promise<VideoPublishIssue[]> {
  const issues: VideoPublishIssue[] = [];
  const stableIds = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const base = `items[${i}]`;

    if (row.title.trim().length === 0) {
      issues.push({ path: `${base}.title`, message: "Title is required." });
    }
    if (stableIds.has(row.stableId)) {
      issues.push({
        path: `${base}.stableId`,
        message: `Duplicate stableId: ${row.stableId}`,
      });
    } else {
      stableIds.add(row.stableId);
    }

    if (row.provider === "upload") {
      if (!row.videoStorageId) {
        issues.push({
          path: `${base}.videoStorageId`,
          message: "Uploaded video file is missing.",
        });
      } else {
        const storage = await getStorageMetadata(ctx, row.videoStorageId);
        if (!storage) {
          issues.push({
            path: `${base}.videoStorageId`,
            message: "Referenced video storage blob is missing.",
          });
        } else if (!storage.contentType || !isAllowedVideoMime(storage.contentType)) {
          issues.push({
            path: `${base}.videoStorageId`,
            message: "Video blob must be MP4, WebM, or QuickTime.",
          });
        } else if (storage.size > MAX_VIDEO_UPLOAD_BYTES) {
          issues.push({
            path: `${base}.videoStorageId`,
            message: `Video exceeds ${Math.floor(MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024))}MB.`,
          });
        }
      }
    } else if (row.provider === "mux") {
      if (!row.externalId || row.externalId.trim().length === 0) {
        issues.push({
          path: `${base}.externalId`,
          message: "Mux playback id is required.",
        });
      }
      if (row.playbackUrl !== undefined && row.playbackUrl.trim().length > 0) {
        try {
          parseMuxPlaybackUrl(row.playbackUrl);
        } catch {
          issues.push({
            path: `${base}.playbackUrl`,
            message: muxPlaybackUrlErrorMessage("Mux playback URL"),
          });
        }
      }
    } else {
      if (!row.externalId || row.externalId.trim().length === 0) {
        issues.push({
          path: `${base}.externalId`,
          message: "Video id or URL is required.",
        });
      }
    }

    if (row.thumbnailUrl !== undefined && row.thumbnailUrl.trim().length > 0) {
      try {
        parseHttpsThumbnailUrl(row.thumbnailUrl);
      } catch {
        issues.push({
          path: `${base}.thumbnailUrl`,
          message: thumbnailUrlErrorMessage("thumbnail URL"),
        });
      }
    }
  }

  return issues;
}

async function resequenceDraftVideos(ctx: MutationCtx): Promise<void> {
  const draft = await loadVideos(ctx, "draft");
  draft.sort((a, b) => a.sortOrder - b.sortOrder);
  for (let i = 0; i < draft.length; i++) {
    const row = draft[i];
    if (row.sortOrder !== i) {
      await ctx.db.patch(row._id, { sortOrder: i });
    }
  }
}

export const listDraftVideos = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    const rows = await loadVideos(ctx, "draft");
    const meta = await ctx.db
      .query("videoMeta")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();
    const videos = await materializeVideos(ctx, rows);
    return {
      videos,
      meta: meta
        ? {
            hasDraftChanges: meta.hasDraftChanges,
            publishedAt: meta.publishedAt,
            publishedBy: meta.publishedBy,
            updatedAt: meta.updatedAt,
          }
        : null,
      maxVideos: MAX_VIDEOS,
    };
  },
});

export const createDraftVideo = mutation({
  args: {
    provider: videoProviderArg,
    title: v.string(),
    description: v.optional(v.string()),
    externalId: v.optional(v.string()),
    playbackUrl: v.optional(v.string()),
    videoStorageId: v.optional(v.id("_storage")),
    thumbnailStorageId: v.optional(v.id("_storage")),
    thumbnailUrl: v.optional(v.string()),
    durationSec: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    await ensureVideoMeta(ctx);

    const draft = await loadVideos(ctx, "draft");
    if (draft.length >= MAX_VIDEOS) {
      cmsValidationError(
        `Video list supports up to ${MAX_VIDEOS} items.`,
        "provider",
      );
    }

    const sortOrder = draft.length;

    if (args.provider === "upload") {
      if (!args.videoStorageId) {
        cmsValidationError(
          "videoStorageId is required for upload provider.",
          "videoStorageId",
        );
      }
      await validateVideoUploadStorage(ctx, args.videoStorageId);
    } else if (args.videoStorageId !== undefined) {
      cmsValidationError(
        "videoStorageId is only valid when provider is upload.",
        "videoStorageId",
      );
    }

    const patch = await buildVideoInsertPatch({
      provider: args.provider,
      title: args.title,
      description: args.description,
      sortOrder,
      externalId: args.externalId,
      playbackUrl: args.playbackUrl,
      videoStorageId: args.videoStorageId,
      thumbnailStorageId: args.thumbnailStorageId,
      thumbnailUrl: args.thumbnailUrl,
      durationSec: args.durationSec,
    });

    await ctx.db.insert("videos", patch);
    await patchVideoMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const, stableId: patch.stableId };
  },
});

export const updateDraftVideo = mutation({
  args: {
    stableId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    externalId: v.optional(v.string()),
    playbackUrl: v.optional(v.union(v.string(), v.null())),
    videoStorageId: v.optional(v.id("_storage")),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    thumbnailUrl: v.optional(v.union(v.string(), v.null())),
    durationSec: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getDraftVideoByStableId(ctx, args.stableId);
    if (!row) {
      cmsNotFound("video", args.stableId);
    }

    const patch: Partial<VideoDoc> = {};

    if (args.title !== undefined) {
      patch.title = normalizeTitle(args.title);
    }
    if (args.description !== undefined) {
      if (args.description === null) {
        patch.description = undefined;
      } else {
        const d = normalizeDescription(args.description);
        if (d === undefined) {
          patch.description = undefined;
        } else {
          patch.description = d;
        }
      }
    }
    if (args.durationSec !== undefined) {
      if (args.durationSec === null) {
        patch.durationSec = undefined;
      } else {
        patch.durationSec = normalizeDurationSec(args.durationSec);
      }
    }

    if (args.thumbnailUrl !== undefined) {
      if (args.thumbnailUrl === null) {
        patch.thumbnailUrl = undefined;
      } else {
        const u = normalizeOptionalThumbnailUrl(args.thumbnailUrl);
        if (u === undefined) {
          patch.thumbnailUrl = undefined;
        } else {
          patch.thumbnailUrl = u;
        }
      }
    }

    if (args.thumbnailStorageId !== undefined) {
      if (args.thumbnailStorageId === null) {
        patch.thumbnailStorageId = undefined;
      } else {
        patch.thumbnailStorageId = args.thumbnailStorageId;
      }
    }

    if (row.provider === "upload") {
      if (args.videoStorageId !== undefined) {
        await validateVideoUploadStorage(ctx, args.videoStorageId);
        patch.videoStorageId = args.videoStorageId;
      }
    }

    if (row.provider !== "upload") {
      const nextExternal =
        args.externalId !== undefined ? args.externalId : row.externalId;
      const nextPlayback =
        args.playbackUrl !== undefined
          ? args.playbackUrl
          : row.playbackUrl;

      if (
        args.externalId !== undefined ||
        args.playbackUrl !== undefined
      ) {
        const resolved = resolveEmbedFields({
          provider: row.provider,
          externalId: nextExternal ?? "",
          playbackUrl: nextPlayback ?? null,
        });
        patch.externalId = resolved.externalId as string;
        if (resolved.playbackUrl !== undefined) {
          patch.playbackUrl = resolved.playbackUrl;
        } else if (
          row.provider === "mux" &&
          args.playbackUrl !== undefined &&
          args.playbackUrl === null
        ) {
          patch.playbackUrl = undefined;
        }
      }
    }

    await ctx.db.patch(row._id, patch);

    if (args.thumbnailStorageId !== undefined) {
      const prev = row.thumbnailStorageId;
      if (prev && prev !== args.thumbnailStorageId) {
        await deleteStorageIfUnreferenced(ctx, prev);
      }
    }

    if (row.provider === "upload" && args.videoStorageId !== undefined) {
      const prev = row.videoStorageId;
      if (prev && prev !== args.videoStorageId) {
        await deleteStorageIfUnreferenced(ctx, prev);
      }
    }

    await patchVideoMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

export const removeDraftVideo = mutation({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getDraftVideoByStableId(ctx, args.stableId);
    if (!row) {
      return { ok: true as const, removed: false };
    }

    await ctx.db.delete(row._id);
    if (row.videoStorageId) {
      await deleteStorageIfUnreferenced(ctx, row.videoStorageId);
    }
    if (row.thumbnailStorageId) {
      await deleteStorageIfUnreferenced(ctx, row.thumbnailStorageId);
    }
    await resequenceDraftVideos(ctx);
    await patchVideoMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const, removed: true };
  },
});

export const reorderDraftVideos = mutation({
  args: { orderedStableIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const draft = await loadVideos(ctx, "draft");
    if (args.orderedStableIds.length !== draft.length) {
      cmsValidationError(
        "Reorder payload must include every draft video exactly once.",
        "orderedStableIds",
      );
    }

    const draftIds = new Set(draft.map((r) => r.stableId));
    const orderedIds = new Set(args.orderedStableIds);
    if (
      orderedIds.size !== args.orderedStableIds.length ||
      draftIds.size !== orderedIds.size ||
      args.orderedStableIds.some((stableId) => !draftIds.has(stableId))
    ) {
      cmsValidationError(
        "Reorder payload must include every draft video exactly once.",
        "orderedStableIds",
      );
    }
    for (let i = 0; i < args.orderedStableIds.length; i++) {
      const stableId = args.orderedStableIds[i];
      const row = draft.find((r) => r.stableId === stableId);
      if (!row) {
        cmsNotFound("video", stableId);
      }
      if (row.sortOrder !== i) {
        await ctx.db.patch(row._id, { sortOrder: i });
      }
    }
    await patchVideoMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

export async function publishVideosDraftCore(
  ctx: MutationCtx,
  args: { userId: string; updatedBy: string },
): Promise<{
  ok: true;
  kind: "published";
  publishedAt: number;
  publishedBy: string;
}> {
  const { userId, updatedBy } = args;
  const draft = await loadVideos(ctx, "draft");
  const issues = await validateDraftVideosForPublish(ctx, draft);
  if (issues.length > 0) {
    cmsPublishValidationFailed("videos", "Publish validation failed.", issues);
  }

  await replaceVideosScope(ctx, "draft", "published");

  const now = Date.now();
  const { id: metaId } = await ensureVideoMeta(ctx);
  await ctx.db.patch(metaId, {
    hasDraftChanges: false,
    publishedAt: now,
    publishedBy: userId,
    updatedAt: now,
    updatedBy,
  });

  return {
    ok: true as const,
    kind: "published" as const,
    publishedAt: now,
    publishedBy: userId,
  };
}

export const publishVideos = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId, updatedBy } = await requireCmsOwner(ctx);
    return await publishVideosDraftCore(ctx, { userId, updatedBy });
  },
});

export const discardDraftVideos = mutation({
  args: {},
  handler: async (ctx) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    await ensureVideoMeta(ctx);
    await replaceVideosScope(ctx, "published", "draft");

    const now = Date.now();
    const { id: metaId } = await ensureVideoMeta(ctx);
    await ctx.db.patch(metaId, {
      hasDraftChanges: false,
      updatedAt: now,
      updatedBy,
    });

    return { ok: true as const, discarded: true };
  },
});
