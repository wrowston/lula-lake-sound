import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
  ABANDONED_DRAFT_AUDIO_MS,
  ALLOWED_AUDIO_MIME_TYPES,
  MAX_AUDIO_FILE_BYTES,
  MAX_AUDIO_TRACKS,
  audioDraftMatchesPublished,
  type AudioPublishIssue,
  type AudioTrackDoc,
  deleteStorageIfUnreferenced,
  ensureAudioMeta,
  getStorageMetadata,
  loadAudioTracks,
  materializeAudioTracks,
  patchAudioMetaAfterDraftChange,
  replaceAudioScope,
} from "../audioTracks";
import {
  ALLOWED_GALLERY_IMAGE_TYPES,
  MAX_GALLERY_IMAGE_BYTES,
} from "../galleryPhotos";
import {
  cmsNotFound,
  cmsPublishValidationFailed,
  cmsValidationError,
} from "../errors";
import { requireCmsOwner } from "../lib/auth";

const MAX_TITLE_LENGTH = 200;
const MAX_ARTIST_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_FILENAME_LENGTH = 255;
const MAX_EXTERNAL_URL_LENGTH = 2048;

function hostnameOfHttpsUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") {
      return null;
    }
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isSpotifyHostname(host: string): boolean {
  return host === "spotify.com" || host.endsWith(".spotify.com");
}

/**
 * Optional HTTPS URL for streaming / artwork. Empty or null clears the field.
 */
function normalizeOptionalExternalUrl(
  raw: string | null | undefined,
  field: "albumThumbnailUrl" | "spotifyUrl" | "appleMusicUrl",
): string | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (trimmed.length > MAX_EXTERNAL_URL_LENGTH) {
    cmsValidationError(
      `URL must be at most ${MAX_EXTERNAL_URL_LENGTH} characters.`,
      field,
    );
  }
  const host = hostnameOfHttpsUrl(trimmed);
  if (!host) {
    cmsValidationError("URL must be a valid https:// link.", field);
  }
  if (field === "spotifyUrl") {
    if (!isSpotifyHostname(host)) {
      cmsValidationError("Spotify URL must be on spotify.com.", field);
    }
  }
  if (field === "appleMusicUrl") {
    const okApple =
      host === "music.apple.com" ||
      host.endsWith(".music.apple.com") ||
      host === "itunes.apple.com" ||
      host.endsWith(".itunes.apple.com");
    if (!okApple) {
      cmsValidationError(
        "Apple Music URL must be on music.apple.com or itunes.apple.com.",
        field,
      );
    }
  }
  return trimmed;
}

function isAllowedAudioMimeType(
  contentType: string,
): contentType is (typeof ALLOWED_AUDIO_MIME_TYPES)[number] {
  return (ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(contentType);
}

function isAllowedAlbumArtMimeType(
  contentType: string,
): contentType is (typeof ALLOWED_GALLERY_IMAGE_TYPES)[number] {
  return (ALLOWED_GALLERY_IMAGE_TYPES as readonly string[]).includes(
    contentType,
  );
}

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

function normalizeArtist(raw?: string | null): string | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const value = raw.trim();
  if (value.length === 0) {
    return undefined;
  }
  if (value.length > MAX_ARTIST_LENGTH) {
    cmsValidationError(
      `Artist must be at most ${MAX_ARTIST_LENGTH} characters.`,
      "artist",
    );
  }
  return value;
}

function normalizeDescription(raw: string): string {
  const value = raw.trim();
  if (value.length === 0) {
    cmsValidationError("Description is required.", "description");
  }
  if (value.length > MAX_DESCRIPTION_LENGTH) {
    cmsValidationError(
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`,
      "description",
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

function normalizeDurationSec(
  raw: number | null | undefined,
): number | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (!Number.isFinite(raw) || raw < 0 || raw > 24 * 60 * 60) {
    cmsValidationError(
      "Duration must be between 0 and 86400 seconds.",
      "durationSec",
    );
  }
  return raw;
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
      "Uploaded file is missing a content type. Upload MP3 or WAV only.",
      "storageId",
    );
  }

  if (!isAllowedAudioMimeType(storage.contentType)) {
    cmsValidationError(
      "Only MP3 and WAV audio files are allowed.",
      "storageId",
    );
  }

  if (storage.size > MAX_AUDIO_FILE_BYTES) {
    cmsValidationError(
      `Audio files must be ${Math.floor(MAX_AUDIO_FILE_BYTES / (1024 * 1024))}MB or smaller.`,
      "storageId",
    );
  }
}

function validateAlbumArtStorageMetadataOrThrow(
  storage: Awaited<ReturnType<typeof getStorageMetadata>>,
): asserts storage is NonNullable<
  Awaited<ReturnType<typeof getStorageMetadata>>
> & { contentType: string } {
  if (!storage) {
    cmsValidationError(
      "Uploaded album art was not found in storage.",
      "albumThumbnailStorageId",
    );
  }

  if (!storage.contentType) {
    cmsValidationError(
      "Uploaded album art is missing a content type. Upload JPEG, PNG, or WebP only.",
      "albumThumbnailStorageId",
    );
  }

  if (!isAllowedAlbumArtMimeType(storage.contentType)) {
    cmsValidationError(
      "Only JPEG, PNG, and WebP album art images are allowed.",
      "albumThumbnailStorageId",
    );
  }

  if (storage.size > MAX_GALLERY_IMAGE_BYTES) {
    cmsValidationError(
      `Album art images must be ${Math.floor(MAX_GALLERY_IMAGE_BYTES / (1024 * 1024))}MB or smaller.`,
      "albumThumbnailStorageId",
    );
  }
}

function collectTrackIssues(
  rows: AudioTrackDoc[],
  storageById: Map<
    Id<"_storage">,
    Awaited<ReturnType<typeof getStorageMetadata>>
  >,
): AudioPublishIssue[] {
  const issues: AudioPublishIssue[] = [];
  const stableIds = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    /** Index-only paths — `publishSite` prefixes with `audio.` like `photos.*`. */
    const base = `tracks[${i}]`;

    if (row.title.trim().length === 0) {
      issues.push({ path: `${base}.title`, message: "Title is required." });
    }
    if (row.title.length > MAX_TITLE_LENGTH) {
      issues.push({
        path: `${base}.title`,
        message: `Title must be at most ${MAX_TITLE_LENGTH} characters.`,
      });
    }
    if ((row.artist ?? "").length > MAX_ARTIST_LENGTH) {
      issues.push({
        path: `${base}.artist`,
        message: `Artist must be at most ${MAX_ARTIST_LENGTH} characters.`,
      });
    }
    if (row.description.trim().length === 0) {
      issues.push({
        path: `${base}.description`,
        message: "Description is required.",
      });
    }
    if (row.description.length > MAX_DESCRIPTION_LENGTH) {
      issues.push({
        path: `${base}.description`,
        message: `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`,
      });
    }
    if (
      row.durationSec !== undefined &&
      (!Number.isFinite(row.durationSec) ||
        row.durationSec < 0 ||
        row.durationSec > 24 * 60 * 60)
    ) {
      issues.push({
        path: `${base}.durationSec`,
        message: "Duration must be between 0 and 86400 seconds.",
      });
    }

    const thumb = row.albumThumbnailUrl?.trim() ?? "";
    if (thumb.length > 0) {
      if (thumb.length > MAX_EXTERNAL_URL_LENGTH) {
        issues.push({
          path: `${base}.albumThumbnailUrl`,
          message: `URL must be at most ${MAX_EXTERNAL_URL_LENGTH} characters.`,
        });
      } else if (!hostnameOfHttpsUrl(thumb)) {
        issues.push({
          path: `${base}.albumThumbnailUrl`,
          message: "Album thumbnail must be a valid https:// URL.",
        });
      }
    }

    if (row.albumThumbnailStorageId !== undefined) {
      const storage = storageById.get(row.albumThumbnailStorageId) ?? null;
      if (!storage) {
        issues.push({
          path: `${base}.albumThumbnailStorageId`,
          message: "Uploaded album art is missing. Try uploading again.",
        });
      } else if (!storage.contentType) {
        issues.push({
          path: `${base}.albumThumbnailStorageId`,
          message: "Uploaded album art is missing a content type.",
        });
      } else if (!isAllowedAlbumArtMimeType(storage.contentType)) {
        issues.push({
          path: `${base}.albumThumbnailStorageId`,
          message: `Unsupported album art content type: ${storage.contentType}`,
        });
      } else if (storage.size > MAX_GALLERY_IMAGE_BYTES) {
        issues.push({
          path: `${base}.albumThumbnailStorageId`,
          message: `Album art must be ${Math.floor(
            MAX_GALLERY_IMAGE_BYTES / (1024 * 1024),
          )}MB or smaller.`,
        });
      }
    }

    const spotify = row.spotifyUrl?.trim() ?? "";
    if (spotify.length > 0) {
      if (spotify.length > MAX_EXTERNAL_URL_LENGTH) {
        issues.push({
          path: `${base}.spotifyUrl`,
          message: `URL must be at most ${MAX_EXTERNAL_URL_LENGTH} characters.`,
        });
      } else {
        const h = hostnameOfHttpsUrl(spotify);
        if (!h || !isSpotifyHostname(h)) {
          issues.push({
            path: `${base}.spotifyUrl`,
            message: "Spotify URL must be a valid https link on spotify.com.",
          });
        }
      }
    }

    const apple = row.appleMusicUrl?.trim() ?? "";
    if (apple.length > 0) {
      if (apple.length > MAX_EXTERNAL_URL_LENGTH) {
        issues.push({
          path: `${base}.appleMusicUrl`,
          message: `URL must be at most ${MAX_EXTERNAL_URL_LENGTH} characters.`,
        });
      } else {
        const h = hostnameOfHttpsUrl(apple);
        if (!h) {
          issues.push({
            path: `${base}.appleMusicUrl`,
            message: "Apple Music URL must be a valid https link.",
          });
        } else {
          const okApple =
            h === "music.apple.com" ||
            h.endsWith(".music.apple.com") ||
            h === "itunes.apple.com" ||
            h.endsWith(".itunes.apple.com");
          if (!okApple) {
            issues.push({
              path: `${base}.appleMusicUrl`,
              message:
                "Apple Music URL must be on music.apple.com or itunes.apple.com.",
            });
          }
        }
      }
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
    if (!isAllowedAudioMimeType(storage.contentType)) {
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
    Array.from(
      new Set(
        rows.flatMap((row) =>
          row.albumThumbnailStorageId !== undefined
            ? [row.storageId, row.albumThumbnailStorageId]
            : [row.storageId],
        ),
      ),
    ).map(
      async (storageId) =>
        [storageId, await getStorageMetadata(ctx, storageId)] as const,
    ),
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
        acceptedMimeTypes: [...ALLOWED_AUDIO_MIME_TYPES],
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

export const saveUploadedTrack = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.string(),
    artist: v.optional(v.union(v.string(), v.null())),
    description: v.string(),
    durationSec: v.optional(v.union(v.number(), v.null())),
    originalFileName: v.optional(v.union(v.string(), v.null())),
    albumThumbnailUrl: v.optional(v.union(v.string(), v.null())),
    albumThumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    spotifyUrl: v.optional(v.union(v.string(), v.null())),
    appleMusicUrl: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    await ensureAudioMeta(ctx);

    const draft = await loadAudioTracks(ctx, "draft");
    if (draft.length >= MAX_AUDIO_TRACKS) {
      await deleteStorageIfUnreferenced(ctx, args.storageId);
      if (
        args.albumThumbnailStorageId !== null &&
        args.albumThumbnailStorageId !== undefined
      ) {
        await deleteStorageIfUnreferenced(ctx, args.albumThumbnailStorageId);
      }
      cmsValidationError(
        `Audio portfolio supports up to ${MAX_AUDIO_TRACKS} tracks.`,
        "storageId",
      );
    }

    const now = Date.now();
    try {
      const storage = await getStorageMetadata(ctx, args.storageId);
      validateStorageMetadataOrThrow(storage);
      const mimeType = storage.contentType;

      const title = normalizeTitle(args.title);
      const artist = normalizeArtist(args.artist);
      const description = normalizeDescription(args.description);
      const durationSec = normalizeDurationSec(args.durationSec ?? undefined);
      const originalFileName = normalizeFileName(args.originalFileName);
      const albumThumbnailUrl = normalizeOptionalExternalUrl(
        args.albumThumbnailUrl,
        "albumThumbnailUrl",
      );
      let albumThumbnailStorageId: Id<"_storage"> | undefined;
      if (
        args.albumThumbnailStorageId !== null &&
        args.albumThumbnailStorageId !== undefined
      ) {
        const albumArtStorage = await getStorageMetadata(
          ctx,
          args.albumThumbnailStorageId,
        );
        validateAlbumArtStorageMetadataOrThrow(albumArtStorage);
        albumThumbnailStorageId = args.albumThumbnailStorageId;
      }
      const spotifyUrl = normalizeOptionalExternalUrl(
        args.spotifyUrl,
        "spotifyUrl",
      );
      const appleMusicUrl = normalizeOptionalExternalUrl(
        args.appleMusicUrl,
        "appleMusicUrl",
      );

      const sortOrder =
        draft.length === 0
          ? 0
          : Math.max(...draft.map((row) => row.sortOrder)) + 1;

      await ctx.db.insert("audioTracks", {
        scope: "draft",
        stableId: generateTrackStableId(),
        storageId: args.storageId,
        title,
        ...(artist !== undefined ? { artist } : {}),
        description,
        mimeType,
        ...(durationSec !== undefined ? { durationSec } : {}),
        ...(albumThumbnailUrl !== undefined ? { albumThumbnailUrl } : {}),
        ...(albumThumbnailStorageId !== undefined
          ? { albumThumbnailStorageId }
          : {}),
        ...(spotifyUrl !== undefined ? { spotifyUrl } : {}),
        ...(appleMusicUrl !== undefined ? { appleMusicUrl } : {}),
        sortOrder,
        sizeBytes: storage.size,
        ...(originalFileName !== undefined ? { originalFileName } : {}),
        createdAt: now,
      });
    } catch (error) {
      await deleteStorageIfUnreferenced(ctx, args.storageId);
      if (
        args.albumThumbnailStorageId !== null &&
        args.albumThumbnailStorageId !== undefined
      ) {
        await deleteStorageIfUnreferenced(ctx, args.albumThumbnailStorageId);
      }
      throw error;
    }

    await patchAudioMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

export const updateDraftTrack = mutation({
  args: {
    stableId: v.string(),
    title: v.string(),
    artist: v.optional(v.union(v.string(), v.null())),
    description: v.string(),
    durationSec: v.optional(v.union(v.number(), v.null())),
    albumThumbnailUrl: v.optional(v.union(v.string(), v.null())),
    albumThumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    spotifyUrl: v.optional(v.union(v.string(), v.null())),
    appleMusicUrl: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getDraftTrackByStableId(ctx, args.stableId);
    if (!row) {
      cmsNotFound("audioTrack", args.stableId);
    }

    let draftRowReplaced = false;
    try {
      const title = normalizeTitle(args.title);
      const description = normalizeDescription(args.description);

      let nextArtist: string | undefined;
      if (args.artist === null) {
        nextArtist = undefined;
      } else if (args.artist !== undefined) {
        nextArtist = normalizeArtist(args.artist);
      } else {
        nextArtist = row.artist;
      }

      let durationSec: number | undefined;
      if (args.durationSec === null) {
        durationSec = undefined;
      } else if (args.durationSec !== undefined) {
        durationSec = normalizeDurationSec(args.durationSec);
      } else {
        durationSec = row.durationSec;
      }

      let nextAlbumThumbnailUrl: string | undefined;
      if (args.albumThumbnailUrl === null) {
        nextAlbumThumbnailUrl = undefined;
      } else if (args.albumThumbnailUrl !== undefined) {
        nextAlbumThumbnailUrl = normalizeOptionalExternalUrl(
          args.albumThumbnailUrl,
          "albumThumbnailUrl",
        );
      } else {
        nextAlbumThumbnailUrl = row.albumThumbnailUrl;
      }

      let nextAlbumThumbnailStorageId: Id<"_storage"> | undefined;
      if (args.albumThumbnailStorageId === null) {
        nextAlbumThumbnailStorageId = undefined;
      } else if (args.albumThumbnailStorageId !== undefined) {
        const storage = await getStorageMetadata(
          ctx,
          args.albumThumbnailStorageId,
        );
        validateAlbumArtStorageMetadataOrThrow(storage);
        nextAlbumThumbnailStorageId = args.albumThumbnailStorageId;
      } else {
        nextAlbumThumbnailStorageId = row.albumThumbnailStorageId;
      }

      let nextSpotifyUrl: string | undefined;
      if (args.spotifyUrl === null) {
        nextSpotifyUrl = undefined;
      } else if (args.spotifyUrl !== undefined) {
        nextSpotifyUrl = normalizeOptionalExternalUrl(
          args.spotifyUrl,
          "spotifyUrl",
        );
      } else {
        nextSpotifyUrl = row.spotifyUrl;
      }

      let nextAppleMusicUrl: string | undefined;
      if (args.appleMusicUrl === null) {
        nextAppleMusicUrl = undefined;
      } else if (args.appleMusicUrl !== undefined) {
        nextAppleMusicUrl = normalizeOptionalExternalUrl(
          args.appleMusicUrl,
          "appleMusicUrl",
        );
      } else {
        nextAppleMusicUrl = row.appleMusicUrl;
      }

      await ctx.db.replace(row._id, {
        scope: row.scope,
        stableId: row.stableId,
        storageId: row.storageId,
        title,
        description,
        mimeType: row.mimeType,
        sortOrder: row.sortOrder,
        sizeBytes: row.sizeBytes,
        createdAt: row.createdAt,
        ...(nextArtist !== undefined ? { artist: nextArtist } : {}),
        ...(durationSec !== undefined ? { durationSec } : {}),
        ...(nextAlbumThumbnailUrl !== undefined
          ? { albumThumbnailUrl: nextAlbumThumbnailUrl }
          : {}),
        ...(nextAlbumThumbnailStorageId !== undefined
          ? { albumThumbnailStorageId: nextAlbumThumbnailStorageId }
          : {}),
        ...(nextSpotifyUrl !== undefined ? { spotifyUrl: nextSpotifyUrl } : {}),
        ...(nextAppleMusicUrl !== undefined
          ? { appleMusicUrl: nextAppleMusicUrl }
          : {}),
        ...(row.originalFileName !== undefined
          ? { originalFileName: row.originalFileName }
          : {}),
      });
      draftRowReplaced = true;

      if (
        row.albumThumbnailStorageId !== undefined &&
        row.albumThumbnailStorageId !== nextAlbumThumbnailStorageId
      ) {
        await deleteStorageIfUnreferenced(ctx, row.albumThumbnailStorageId);
      }

      await patchAudioMetaAfterDraftChange(ctx, updatedBy);
      return { ok: true as const };
    } catch (error) {
      if (
        !draftRowReplaced &&
        args.albumThumbnailStorageId !== null &&
        args.albumThumbnailStorageId !== undefined &&
        args.albumThumbnailStorageId !== row.albumThumbnailStorageId
      ) {
        await deleteStorageIfUnreferenced(ctx, args.albumThumbnailStorageId);
      }
      throw error;
    }
  },
});

export const reorderDraftTracks = mutation({
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
      const row = byStableId.get(args.orderedStableIds[i]);
      if (!row) {
        cmsNotFound("audioTrack", args.orderedStableIds[i]);
      }
      if (row.sortOrder !== i) {
        await ctx.db.patch(row._id, { sortOrder: i });
      }
    }

    await patchAudioMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

export const removeDraftTrack = mutation({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getDraftTrackByStableId(ctx, args.stableId);
    if (!row) {
      return { ok: true as const, removed: false };
    }

    await ctx.db.delete(row._id);
    await resequenceDraftTracks(ctx);
    await deleteStorageIfUnreferenced(ctx, row.storageId);
    if (row.albumThumbnailStorageId !== undefined) {
      await deleteStorageIfUnreferenced(ctx, row.albumThumbnailStorageId);
    }
    await patchAudioMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const, removed: true };
  },
});

/**
 * Swap a draft track's audio file for a freshly uploaded blob. The new
 * `storageId` must already exist in Convex storage (uploaded via the URL from
 * `generateUploadUrl`). Within this single mutation transaction we:
 *
 *   1. Validate the new blob (allowlisted MIME, size cap).
 *   2. Patch the draft row so `<audio src>` switches to the new signed URL
 *      atomically — no window where the public URL is broken.
 *   3. Best-effort delete the old blob if nothing else references it
 *      (including the still-live `published` row, which we intentionally keep
 *      working until the next publish).
 *
 * On validation failure we delete the newly uploaded blob so it does not
 * linger as an orphan. Other metadata (title, artist, description, artwork,
 * streaming links) is preserved — call `updateDraftTrack` separately to edit
 * those.
 */
export const replaceDraftTrackFile = mutation({
  args: {
    stableId: v.string(),
    storageId: v.id("_storage"),
    durationSec: v.optional(v.union(v.number(), v.null())),
    originalFileName: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getDraftTrackByStableId(ctx, args.stableId);
    if (!row) {
      // Can't resolve the draft row — the uploaded blob has no home, clean it up.
      await deleteStorageIfUnreferenced(ctx, args.storageId);
      cmsNotFound("audioTrack", args.stableId);
    }

    if (row.storageId === args.storageId) {
      // Same blob — caller re-picked the existing file. Nothing to swap, and
      // no orphan to clean up (the row still references it).
      return { ok: true as const, replaced: false };
    }

    const oldStorageId = row.storageId;
    let mimeType: string;
    let sizeBytes: number;
    let nextDurationSec: number | undefined;
    let nextOriginalFileName: string | undefined;
    try {
      const storage = await getStorageMetadata(ctx, args.storageId);
      validateStorageMetadataOrThrow(storage);
      mimeType = storage.contentType;
      sizeBytes = storage.size;

      if (args.durationSec === null || args.durationSec === undefined) {
        nextDurationSec = undefined;
      } else {
        nextDurationSec = normalizeDurationSec(args.durationSec);
      }

      if (
        args.originalFileName === null ||
        args.originalFileName === undefined
      ) {
        nextOriginalFileName = undefined;
      } else {
        nextOriginalFileName = normalizeFileName(args.originalFileName);
      }
    } catch (error) {
      // Validation failed — the draft row is untouched, but the new blob is
      // now orphaned. Remove it so we don't leak storage.
      await deleteStorageIfUnreferenced(ctx, args.storageId);
      throw error;
    }

    // Swap the reference. Using `ctx.db.replace` here (like `updateDraftTrack`)
    // keeps the document shape explicit and lets us clear the optional
    // `durationSec` / `originalFileName` fields when the new upload doesn't
    // provide them.
    await ctx.db.replace(row._id, {
      scope: row.scope,
      stableId: row.stableId,
      storageId: args.storageId,
      title: row.title,
      description: row.description,
      mimeType,
      sortOrder: row.sortOrder,
      sizeBytes,
      createdAt: row.createdAt,
      ...(row.artist !== undefined ? { artist: row.artist } : {}),
      ...(nextDurationSec !== undefined
        ? { durationSec: nextDurationSec }
        : {}),
      ...(row.albumThumbnailUrl !== undefined
        ? { albumThumbnailUrl: row.albumThumbnailUrl }
        : {}),
      ...(row.albumThumbnailStorageId !== undefined
        ? { albumThumbnailStorageId: row.albumThumbnailStorageId }
        : {}),
      ...(row.spotifyUrl !== undefined ? { spotifyUrl: row.spotifyUrl } : {}),
      ...(row.appleMusicUrl !== undefined
        ? { appleMusicUrl: row.appleMusicUrl }
        : {}),
      ...(nextOriginalFileName !== undefined
        ? { originalFileName: nextOriginalFileName }
        : {}),
    });

    // Old blob may still be referenced by the published row or by another
    // draft track (rare, but possible). `deleteStorageIfUnreferenced` checks
    // every `audioTracks` and `galleryPhotos` row before deleting, so this is
    // a safe best-effort cleanup.
    await deleteStorageIfUnreferenced(ctx, oldStorageId);
    await patchAudioMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const, replaced: true };
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
    cmsPublishValidationFailed("audio", "Publish validation failed.", issues);
  }

  await replaceAudioScope(ctx, "draft", "published");

  const now = Date.now();
  const { id: metaId } = await ensureAudioMeta(ctx);
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
    await replaceAudioScope(ctx, "published", "draft");

    const now = Date.now();
    const { id: metaId } = await ensureAudioMeta(ctx);
    await ctx.db.patch(metaId, {
      hasDraftChanges: false,
      updatedAt: now,
      updatedBy,
    });

    return { ok: true as const, discarded: true };
  },
});

/**
 * Removes draft-only audio rows (and their blobs) that were never published and
 * are older than `ABANDONED_DRAFT_AUDIO_MS`. Does not touch rows still referenced
 * from the published scope.
 */
export const garbageCollectAbandonedDraftAudio = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - ABANDONED_DRAFT_AUDIO_MS;
    const staleDraft = await ctx.db
      .query("audioTracks")
      .withIndex("by_scope_and_createdAt", (q) =>
        q.eq("scope", "draft").lt("createdAt", cutoff),
      )
      .take(50);

    let removedRows = 0;
    for (const row of staleDraft) {
      const publishedTwin = await ctx.db
        .query("audioTracks")
        .withIndex("by_scope_and_stableId", (q) =>
          q.eq("scope", "published").eq("stableId", row.stableId),
        )
        .unique();
      if (publishedTwin) {
        continue;
      }
      await ctx.db.delete(row._id);
      await deleteStorageIfUnreferenced(ctx, row.storageId);
      if (row.albumThumbnailStorageId !== undefined) {
        await deleteStorageIfUnreferenced(ctx, row.albumThumbnailStorageId);
      }
      removedRows += 1;
    }

    if (removedRows > 0) {
      await resequenceDraftTracks(ctx);
      const meta = await ctx.db
        .query("audioTrackMeta")
        .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
        .unique();
      if (meta) {
        const [draft, published] = await Promise.all([
          loadAudioTracks(ctx, "draft"),
          loadAudioTracks(ctx, "published"),
        ]);
        await ctx.db.patch(meta._id, {
          hasDraftChanges: !audioDraftMatchesPublished(draft, published),
          updatedAt: Date.now(),
        });
      }
    }

    return { ok: true as const, removedRows };
  },
});
