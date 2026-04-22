import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
  ALLOWED_AUDIO_CONTENT_TYPES,
  MAX_AUDIO_FILE_BYTES,
  MAX_AUDIO_TRACKS,
  type AudioPublishIssue,
  type AudioTrackDoc,
  deleteStorageIfUnreferencedAcrossCms,
  ensureAudioTrackMeta,
  getStorageMetadata,
  isAllowedAudioContentType,
  loadAudioTracks,
  materializeAudioTracks,
  patchAudioMetaAfterDraftChange,
  replaceAudioScope,
} from "../audioTracks";
import { cmsNotFound, cmsPublishValidationFailed, cmsValidationError } from "../errors";
import { requireCmsOwner } from "../lib/auth";

const MAX_TITLE_LENGTH = 120;
const MAX_FILENAME_LENGTH = 255;

function generateTrackStableId(): string {
  return `audio_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
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

function normalizeFileName(raw?: string | null): string | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const value = raw.trim();
  if (value.length === 0) {
    return undefined;
  }
  if (value.length > MAX_FILENAME_LENGTH) {
    cmsValidationError(
      `Filename must be at most ${MAX_FILENAME_LENGTH} characters.`,
      "originalFileName",
    );
  }
  return value;
}

function validateStorageMetadataOrThrow(
  storage: Awaited<ReturnType<typeof getStorageMetadata>>,
): asserts storage is NonNullable<
  Awaited<ReturnType<typeof getStorageMetadata>>
> & { contentType: string } {
  if (!storage) {
    cmsValidationError("Uploaded file was not found in storage.", "storageId");
  }
  if (!storage.contentType) {
    cmsValidationError(
      "Uploaded file is missing a content type. Use MP3, WAV, FLAC, M4A/AAC, or OGG.",
      "storageId",
    );
  }
  if (!isAllowedAudioContentType(storage.contentType)) {
    cmsValidationError(
      "Only MP3, WAV, FLAC, M4A/AAC, and OGG audio files are allowed.",
      "storageId",
    );
  }
  if (storage.size > MAX_AUDIO_FILE_BYTES) {
    cmsValidationError(
      `Audio must be ${Math.floor(MAX_AUDIO_FILE_BYTES / (1024 * 1024))}MB or smaller.`,
      "storageId",
    );
  }
}

function collectTrackIssues(
  rows: AudioTrackDoc[],
  storageById: Map<Id<"_storage">, Awaited<ReturnType<typeof getStorageMetadata>>>,
): AudioPublishIssue[] {
  const issues: AudioPublishIssue[] = [];
  const stableIds = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const base = `tracks[${i}]`;

    if (row.title.trim().length === 0) {
      issues.push({
        path: `${base}.title`,
        message: "Title is required.",
      });
    }
    if (row.title.length > MAX_TITLE_LENGTH) {
      issues.push({
        path: `${base}.title`,
        message: `Title must be at most ${MAX_TITLE_LENGTH} characters.`,
      });
    }
    if (stableIds.has(row.stableId)) {
      issues.push({
        path: `${base}.stableId`,
        message: `Duplicate stableId: ${row.stableId}`,
      });
    } else {
      stableIds.add(row.stableId);
    }

    const storage = storageById.get(row.storageId) ?? null;
    if (!storage) {
      issues.push({
        path: `${base}.storageId`,
        message: "Referenced storage blob is missing.",
      });
      continue;
    }
    if (!storage.contentType) {
      issues.push({
        path: `${base}.storageId`,
        message: "Storage blob is missing a content type.",
      });
      continue;
    }
    if (!isAllowedAudioContentType(storage.contentType)) {
      issues.push({
        path: `${base}.storageId`,
        message: `Unsupported content type: ${storage.contentType}`,
      });
    }
    if (storage.size > MAX_AUDIO_FILE_BYTES) {
      issues.push({
        path: `${base}.storageId`,
        message: `Audio exceeds ${Math.floor(MAX_AUDIO_FILE_BYTES / (1024 * 1024))}MB.`,
      });
    }
  }

  return issues;
}

async function getDraftTrackByStableId(
  ctx: MutationCtx,
  stableId: string,
): Promise<AudioTrackDoc | null> {
  return await ctx.db
    .query("audioTracks")
    .withIndex("by_scope_and_stableId", (q) =>
      q.eq("scope", "draft").eq("stableId", stableId),
    )
    .unique();
}

async function resequenceDraftTracks(ctx: MutationCtx): Promise<void> {
  const draft = await loadAudioTracks(ctx, "draft");
  for (let i = 0; i < draft.length; i++) {
    if (draft[i].sortOrder !== i) {
      await ctx.db.patch(draft[i]._id, { sortOrder: i });
    }
  }
}

export async function validateDraftAudioForPublish(
  ctx: MutationCtx,
  rows: AudioTrackDoc[],
): Promise<AudioPublishIssue[]> {
  const storageRecords = await Promise.all(
    Array.from(new Set(rows.map((row) => row.storageId))).map(async (storageId) => [
      storageId,
      await getStorageMetadata(ctx, storageId),
    ] as const),
  );
  return collectTrackIssues(rows, new Map(storageRecords));
}

export const listDraftAudioTracks = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    const rows = await loadAudioTracks(ctx, "draft");
    const meta = await ctx.db
      .query("audioTrackMeta")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();

    return {
      tracks: await materializeAudioTracks(ctx, rows),
      hasDraftChanges: meta?.hasDraftChanges ?? false,
      publishedAt: meta?.publishedAt ?? null,
      publishedBy: meta?.publishedBy ?? null,
      updatedAt: meta?.updatedAt ?? null,
      updatedBy: meta?.updatedBy ?? null,
      limits: {
        maxTracks: MAX_AUDIO_TRACKS,
        maxFileBytes: MAX_AUDIO_FILE_BYTES,
        acceptedMimeTypes: [...ALLOWED_AUDIO_CONTENT_TYPES],
      },
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    return { uploadUrl: await ctx.storage.generateUploadUrl() };
  },
});

export const saveUploadedAudioTrack = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.string(),
    originalFileName: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    await ensureAudioTrackMeta(ctx);

    const draft = await loadAudioTracks(ctx, "draft");
    if (draft.length >= MAX_AUDIO_TRACKS) {
      await deleteStorageIfUnreferencedAcrossCms(ctx, args.storageId);
      cmsValidationError(
        `Audio portfolio supports up to ${MAX_AUDIO_TRACKS} tracks.`,
        "storageId",
      );
    }

    try {
      const storage = await getStorageMetadata(ctx, args.storageId);
      validateStorageMetadataOrThrow(storage);
      const contentType = storage.contentType;
      const originalFileName = normalizeFileName(args.originalFileName);

      const sortOrder =
        draft.length === 0
          ? 0
          : Math.max(...draft.map((row) => row.sortOrder)) + 1;

      await ctx.db.insert("audioTracks", {
        scope: "draft",
        stableId: generateTrackStableId(),
        storageId: args.storageId,
        title: normalizeTitle(args.title),
        sortOrder,
        contentType,
        sizeBytes: storage.size,
        ...(originalFileName !== undefined ? { originalFileName } : {}),
      });
    } catch (error) {
      await deleteStorageIfUnreferencedAcrossCms(ctx, args.storageId);
      throw error;
    }

    await patchAudioMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

export const updateDraftAudioTrackTitle = mutation({
  args: {
    stableId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getDraftTrackByStableId(ctx, args.stableId);
    if (!row) {
      cmsNotFound("audioTrack", args.stableId);
    }

    await ctx.db.patch(row._id, {
      title: normalizeTitle(args.title),
    });

    await patchAudioMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

/**
 * Atomically point the draft row at `newStorageId`, then delete the previous blob
 * when nothing else references it (avoids a window where the old URL is still live
 * but the row already points elsewhere — the row keeps the old id until patch).
 */
export const replaceDraftAudioTrackFile = mutation({
  args: {
    stableId: v.string(),
    newStorageId: v.id("_storage"),
    originalFileName: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getDraftTrackByStableId(ctx, args.stableId);
    if (!row) {
      await deleteStorageIfUnreferencedAcrossCms(ctx, args.newStorageId);
      cmsNotFound("audioTrack", args.stableId);
    }

    const previousStorageId = row.storageId;

    try {
      const storage = await getStorageMetadata(ctx, args.newStorageId);
      validateStorageMetadataOrThrow(storage);
      const contentType = storage.contentType;
      const originalFileName = normalizeFileName(args.originalFileName);

      await ctx.db.patch(row._id, {
        storageId: args.newStorageId,
        contentType,
        sizeBytes: storage.size,
        ...(originalFileName !== undefined ? { originalFileName } : {}),
      });
    } catch (error) {
      await deleteStorageIfUnreferencedAcrossCms(ctx, args.newStorageId);
      throw error;
    }

    if (previousStorageId !== args.newStorageId) {
      await deleteStorageIfUnreferencedAcrossCms(ctx, previousStorageId);
    }

    await patchAudioMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

export const reorderDraftAudioTracks = mutation({
  args: { orderedStableIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const draft = await loadAudioTracks(ctx, "draft");
    if (draft.length !== args.orderedStableIds.length) {
      cmsValidationError(
        "Reorder payload must include every draft track exactly once.",
        "orderedStableIds",
      );
    }

    const draftIds = new Set(draft.map((row) => row.stableId));
    const orderedIds = new Set(args.orderedStableIds);
    if (
      orderedIds.size !== args.orderedStableIds.length ||
      draftIds.size !== orderedIds.size ||
      args.orderedStableIds.some((stableId) => !draftIds.has(stableId))
    ) {
      cmsValidationError(
        "Reorder payload must include every draft track exactly once.",
        "orderedStableIds",
      );
    }

    const byStableId = new Map(draft.map((row) => [row.stableId, row]));
    for (let i = 0; i < args.orderedStableIds.length; i++) {
      const trackRow = byStableId.get(args.orderedStableIds[i]);
      if (!trackRow) {
        cmsNotFound("audioTrack", args.orderedStableIds[i]);
      }
      if (trackRow.sortOrder !== i) {
        await ctx.db.patch(trackRow._id, { sortOrder: i });
      }
    }

    await patchAudioMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

export const removeDraftAudioTrack = mutation({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getDraftTrackByStableId(ctx, args.stableId);
    if (!row) {
      return { ok: true as const, removed: false };
    }

    await ctx.db.delete(row._id);
    await resequenceDraftTracks(ctx);
    await deleteStorageIfUnreferencedAcrossCms(ctx, row.storageId);
    await patchAudioMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const, removed: true };
  },
});

export async function publishAudioDraftCore(
  ctx: MutationCtx,
  args: { userId: string; updatedBy: string },
): Promise<{
  ok: true;
  kind: "published";
  publishedAt: number;
  publishedBy: string;
}> {
  const { userId, updatedBy } = args;
  const draft = await loadAudioTracks(ctx, "draft");
  const issues = await validateDraftAudioForPublish(ctx, draft);
  if (issues.length > 0) {
    cmsPublishValidationFailed(
      "audio",
      "Publish validation failed.",
      issues,
    );
  }

  await replaceAudioScope(ctx, "draft", "published");

  const now = Date.now();
  const { id: metaId } = await ensureAudioTrackMeta(ctx);
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

export const publishAudioTracks = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId, updatedBy } = await requireCmsOwner(ctx);
    return await publishAudioDraftCore(ctx, { userId, updatedBy });
  },
});

export const discardDraftAudioTracks = mutation({
  args: {},
  handler: async (ctx) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    await ensureAudioTrackMeta(ctx);
    await replaceAudioScope(ctx, "published", "draft");

    const now = Date.now();
    const { id: metaId } = await ensureAudioTrackMeta(ctx);
    await ctx.db.patch(metaId, {
      hasDraftChanges: false,
      updatedAt: now,
      updatedBy,
    });

    return { ok: true as const, discarded: true };
  },
});
