/**
 * Frontend helpers for rendering CMS video previews.
 *
 * Embed URLs are constructed from a known `provider` + `externalId` combo
 * (already validated server-side in `convex/videoUrls.ts`), so the admin
 * preview never assigns an arbitrary user-supplied iframe `src` string.
 *
 * Privacy-enhanced parameters are applied by default:
 *   - YouTube → `youtube-nocookie.com` + `rel=0&modestbranding=1`
 *   - Vimeo   → `dnt=1` (Do Not Track)
 *   - Mux     → hosted Mux Player iframe (`player.mux.com/{playbackId}`)
 *
 * `provider: "upload"` uses a native `<video>` element with the materialized
 * Convex storage URL; this module exposes a minimal type for that case so
 * the editor can render both styles from a single descriptor.
 */

export type VideoProvider = "youtube" | "vimeo" | "mux" | "upload";

export interface VideoEmbedDescriptor {
  readonly provider: VideoProvider;
  /** Provider-native id (YouTube 11-char, Vimeo numeric, Mux playback id). */
  readonly externalId?: string | null;
  /** Materialized Convex storage URL for `provider: "upload"`. */
  readonly videoUrl?: string | null;
  /** Optional Mux HLS playback URL. */
  readonly playbackUrl?: string | null;
  readonly thumbnailUrl?: string | null;
}

export type VideoPreviewEmbed =
  | {
      readonly kind: "iframe";
      readonly src: string;
      /** Provider-friendly label (e.g. "YouTube"). */
      readonly providerLabel: string;
      /**
       * `allow` attr — keeps clipboard-write for share buttons and
       * picture-in-picture for desktop viewers. Autoplay/encrypted-media
       * are deliberately omitted in admin preview.
       */
      readonly allow: string;
      readonly allowFullScreen: boolean;
    }
  | {
      readonly kind: "video";
      readonly src: string;
      readonly poster?: string;
      readonly providerLabel: string;
    }
  | {
      readonly kind: "missing";
      readonly providerLabel: string;
      readonly reason: string;
    };

const DEFAULT_IFRAME_ALLOW =
  "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

const PROVIDER_LABEL: Record<VideoProvider, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  mux: "Mux",
  upload: "Upload",
};

export function getProviderLabel(provider: VideoProvider): string {
  return PROVIDER_LABEL[provider] ?? provider;
}

/**
 * Build a privacy-enhanced YouTube embed URL from a validated 11-char id.
 * Always uses the `youtube-nocookie.com` cookie-less variant.
 */
export function buildYouTubeEmbedUrl(externalId: string): string {
  const id = encodeURIComponent(externalId);
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/**
 * Build a privacy-enhanced Vimeo embed URL. `dnt=1` opts the embed out of
 * Vimeo session tracking.
 */
export function buildVimeoEmbedUrl(externalId: string): string {
  const id = encodeURIComponent(externalId);
  const params = new URLSearchParams({
    dnt: "1",
    title: "1",
    byline: "0",
    portrait: "0",
  });
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}

/**
 * Build the hosted Mux Player iframe URL.
 *
 * `player.mux.com/{playbackId}` is the canonical Mux-hosted player page
 * (see https://docs.mux.com/guides/mux-player-web/embed-mux-player). It
 * accepts a `metadata-video-title` param for analytics labelling.
 */
export function buildMuxPlayerUrl(
  playbackId: string,
  options?: { readonly title?: string },
): string {
  const id = encodeURIComponent(playbackId);
  const params = new URLSearchParams();
  if (options?.title) {
    params.set("metadata-video-title", options.title);
  }
  const query = params.toString();
  return query.length > 0
    ? `https://player.mux.com/${id}?${query}`
    : `https://player.mux.com/${id}`;
}

/**
 * Resolve a {@link VideoPreviewEmbed} from a descriptor. When the descriptor
 * is incomplete (e.g. an upload row whose blob URL hasn't been materialized
 * yet) the `missing` variant is returned with a human-readable reason.
 */
export function resolveVideoPreview(
  descriptor: VideoEmbedDescriptor,
  options?: { readonly title?: string },
): VideoPreviewEmbed {
  const providerLabel = getProviderLabel(descriptor.provider);

  switch (descriptor.provider) {
    case "youtube": {
      const id = descriptor.externalId?.trim();
      if (!id) {
        return {
          kind: "missing",
          providerLabel,
          reason: "Add a YouTube watch URL or video id to enable preview.",
        };
      }
      return {
        kind: "iframe",
        src: buildYouTubeEmbedUrl(id),
        providerLabel,
        allow: DEFAULT_IFRAME_ALLOW,
        allowFullScreen: true,
      };
    }
    case "vimeo": {
      const id = descriptor.externalId?.trim();
      if (!id) {
        return {
          kind: "missing",
          providerLabel,
          reason: "Add a Vimeo URL or numeric video id to enable preview.",
        };
      }
      return {
        kind: "iframe",
        src: buildVimeoEmbedUrl(id),
        providerLabel,
        allow: DEFAULT_IFRAME_ALLOW,
        allowFullScreen: true,
      };
    }
    case "mux": {
      const id = descriptor.externalId?.trim();
      if (!id) {
        return {
          kind: "missing",
          providerLabel,
          reason: "Add a Mux playback id (or stream URL) to enable preview.",
        };
      }
      return {
        kind: "iframe",
        src: buildMuxPlayerUrl(id, options),
        providerLabel,
        allow: DEFAULT_IFRAME_ALLOW,
        allowFullScreen: true,
      };
    }
    case "upload": {
      const url = descriptor.videoUrl?.trim();
      if (!url) {
        return {
          kind: "missing",
          providerLabel,
          reason: "Upload a video file to enable preview.",
        };
      }
      const poster = descriptor.thumbnailUrl?.trim();
      return {
        kind: "video",
        src: url,
        providerLabel,
        ...(poster && poster.length > 0 ? { poster } : {}),
      };
    }
  }
}

/**
 * Returns `true` when the row has the minimum data required for the public
 * site to render it: a non-empty title plus a playable reference matching
 * its provider. Used by the admin to keep "Will block publish" hints in
 * sync with the server-side `validateDraftVideosForPublish` check.
 */
export function isPlayableForPublish(row: {
  readonly title: string;
  readonly provider: VideoProvider;
  readonly externalId?: string | null;
  readonly videoStorageId?: string | null;
  readonly videoUrl?: string | null;
}): boolean {
  if (row.title.trim().length === 0) return false;
  switch (row.provider) {
    case "upload":
      return Boolean(row.videoStorageId ?? row.videoUrl);
    case "youtube":
    case "vimeo":
    case "mux":
      return Boolean(row.externalId && row.externalId.trim().length > 0);
  }
}

/** Pretty-print bytes for upload size hints (B/KB/MB). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Pretty-print a duration in seconds as `m:ss` or `h:mm:ss`. Returns `null`
 * when the value is not a finite positive number, so the caller can drop
 * the hint entirely.
 */
export function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total - h * 3600) / 60);
  const s = total - h * 3600 - m * 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Title fallback for newly-uploaded videos (mirrors photos' alt fallback).
 */
export function defaultTitleFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length === 0) {
    return "Studio video";
  }
  return normalized[0].toUpperCase() + normalized.slice(1);
}
