import type { Doc } from "./_generated/dataModel";

export type VideoProvider = Doc<"videos">["provider"];

const MAX_URL_LENGTH = 2048;

/** Hostnames allowed for user-supplied HTTPS URLs (thumbnail, Mux playback). */
const ALLOWED_THUMB_HOST_SUFFIXES = [
  "i.ytimg.com",
  "img.youtube.com",
  "i9.ytimg.com",
  "yt3.ggpht.com",
  "vumbnail.com",
  "vumbnail.net",
  "i.vimeocdn.com",
  "images.unsplash.com",
  "fastly.picsum.photos",
  "picsum.photos",
  "image.mux.com",
  "stream.mux.com",
  "cdn.mux.com",
  "assets.mux.com",
  "image-us-east-1.mux.com",
] as const;

const MUX_PLAYBACK_HOST_SUFFIXES = [
  "mux.com",
  "muxcdn.com",
  "fastly.mux.com",
] as const;

function normalizeHostname(raw: string): string | null {
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

function hostnameMatchesSuffix(hostname: string, suffix: string): boolean {
  return hostname === suffix || hostname.endsWith(`.${suffix}`);
}

function isAllowedThumbnailHost(hostname: string): boolean {
  for (const suffix of ALLOWED_THUMB_HOST_SUFFIXES) {
    if (hostnameMatchesSuffix(hostname, suffix)) {
      return true;
    }
  }
  return false;
}

function isAllowedMuxPlaybackHost(hostname: string): boolean {
  for (const suffix of MUX_PLAYBACK_HOST_SUFFIXES) {
    if (hostnameMatchesSuffix(hostname, suffix)) {
      return true;
    }
  }
  return false;
}

/**
 * Validates an HTTPS URL for optional thumbnail / poster images.
 * Rejects arbitrary hosts so embed security stays tied to known CDNs.
 */
export function parseHttpsThumbnailUrl(raw: string): {
  url: string;
  hostname: string;
} {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error("EMPTY");
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new Error("TOO_LONG");
  }
  const hostname = normalizeHostname(trimmed);
  if (!hostname) {
    throw new Error("INVALID");
  }
  if (!isAllowedThumbnailHost(hostname)) {
    throw new Error("HOST_NOT_ALLOWED");
  }
  return { url: trimmed, hostname };
}

export function thumbnailUrlErrorMessage(fieldLabel: string): string {
  return `Invalid ${fieldLabel}: use an HTTPS URL from an allowed image host (YouTube/Vimeo CDNs, Mux image CDN, or common image hosts).`;
}

/**
 * Mux stream / asset playback URLs (HLS or image) — hostname allowlist.
 */
export function parseMuxPlaybackUrl(raw: string): {
  url: string;
  hostname: string;
} {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error("EMPTY");
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new Error("TOO_LONG");
  }
  const hostname = normalizeHostname(trimmed);
  if (!hostname) {
    throw new Error("INVALID");
  }
  if (!isAllowedMuxPlaybackHost(hostname)) {
    throw new Error("HOST_NOT_ALLOWED");
  }
  return { url: trimmed, hostname };
}

export function muxPlaybackUrlErrorMessage(fieldLabel: string): string {
  return `Invalid ${fieldLabel}: use an HTTPS URL on an allowed Mux host (e.g. stream.mux.com, image.mux.com, *.mux.com).`;
}

const YOUTUBE_ID_RE = /^[\w-]{11}$/;
/** Vimeo numeric id or legacy hash-style id (short hex). */
const VIMEO_ID_RE = /^\d{6,12}$/;
const VIMEO_HASH_RE = /^[a-f0-9]{8,12}$/i;

function stripOuterQuotes(raw: string): string {
  const t = raw.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim();
  }
  return t;
}

function urlWithHttpsFallback(raw: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) {
    return t;
  }
  if (t.startsWith("//")) {
    return `https:${t}`;
  }
  return `https://${t}`;
}

/**
 * Normalizes YouTube/Vimeo/Mux **externalId** from a pasted URL or bare id.
 * Returns canonical external id for storage, or throws with a code for messaging.
 */
export function normalizeExternalIdForProvider(
  provider: Exclude<VideoProvider, "upload">,
  raw: string,
): string {
  const input = stripOuterQuotes(raw).trim();
  if (input.length === 0) {
    throw new Error("EMPTY");
  }
  if (input.length > 512) {
    throw new Error("TOO_LONG");
  }

  if (provider === "youtube") {
    if (YOUTUBE_ID_RE.test(input)) {
      return input;
    }
    try {
      const u = new URL(urlWithHttpsFallback(input));
      const host = u.hostname.toLowerCase();
      if (
        !hostnameMatchesSuffix(host, "youtube.com") &&
        !hostnameMatchesSuffix(host, "youtube-nocookie.com") &&
        host !== "youtu.be"
      ) {
        throw new Error("INVALID_YOUTUBE_HOST");
      }
      if (host === "youtu.be") {
        const id = u.pathname.replace(/^\//, "").split("/")[0] ?? "";
        if (!YOUTUBE_ID_RE.test(id)) {
          throw new Error("INVALID_YOUTUBE_ID");
        }
        return id;
      }
      const pathParts = u.pathname.split("/").filter(Boolean);
      if (pathParts[0] === "shorts" && pathParts[1]) {
        const id = pathParts[1];
        if (!YOUTUBE_ID_RE.test(id)) {
          throw new Error("INVALID_YOUTUBE_ID");
        }
        return id;
      }
      const v = u.searchParams.get("v");
      if (v && YOUTUBE_ID_RE.test(v)) {
        return v;
      }
      if (pathParts[0] === "embed" && pathParts[1]) {
        const id = pathParts[1];
        if (!YOUTUBE_ID_RE.test(id)) {
          throw new Error("INVALID_YOUTUBE_ID");
        }
        return id;
      }
      throw new Error("INVALID_YOUTUBE_ID");
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("INVALID")) {
        throw e;
      }
      throw new Error("INVALID_YOUTUBE_URL");
    }
  }

  if (provider === "vimeo") {
    if (VIMEO_ID_RE.test(input) || VIMEO_HASH_RE.test(input)) {
      return input;
    }
    try {
      const u = new URL(urlWithHttpsFallback(input));
      const host = u.hostname.toLowerCase();
      if (!hostnameMatchesSuffix(host, "vimeo.com")) {
        throw new Error("INVALID_VIMEO_HOST");
      }
      const parts = u.pathname.split("/").filter(Boolean);
      const videoIdx = parts.indexOf("video");
      const idCandidate =
        videoIdx >= 0 && parts[videoIdx + 1]
          ? parts[videoIdx + 1]
          : parts[0];
      if (
        !idCandidate ||
        (!VIMEO_ID_RE.test(idCandidate) && !VIMEO_HASH_RE.test(idCandidate))
      ) {
        throw new Error("INVALID_VIMEO_ID");
      }
      return idCandidate;
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("INVALID")) {
        throw e;
      }
      throw new Error("INVALID_VIMEO_URL");
    }
  }

  // mux — store playback id or asset id string (admin UI builds iframe/player URL client-side)
  if (provider === "mux") {
    if (/^[a-zA-Z0-9_-]+$/.test(input) && input.length >= 4 && input.length <= 128) {
      return input;
    }
    try {
      const u = new URL(urlWithHttpsFallback(input));
      const host = u.hostname.toLowerCase();
      if (!isAllowedMuxPlaybackHost(host)) {
        throw new Error("INVALID_MUX_HOST");
      }
      const path = u.pathname;
      const match = path.match(/\/(?:videos|manifest)\/([a-zA-Z0-9_-]+)/);
      if (match?.[1]) {
        return match[1];
      }
      const last = path.split("/").filter(Boolean).pop();
      let segment = last ?? "";
      const dot = segment.lastIndexOf(".");
      if (dot > 0) {
        const ext = segment.slice(dot + 1).toLowerCase();
        if (ext === "m3u8" || ext === "mp4") {
          segment = segment.slice(0, dot);
        }
      }
      if (segment && /^[a-zA-Z0-9_-]+$/.test(segment)) {
        return segment;
      }
      throw new Error("INVALID_MUX_ID");
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("INVALID")) {
        throw e;
      }
      throw new Error("INVALID_MUX_URL");
    }
  }

  throw new Error("UNSUPPORTED_PROVIDER");
}

export function externalIdValidationMessage(
  provider: Exclude<VideoProvider, "upload">,
  code: string,
): string {
  switch (code) {
    case "EMPTY":
      return "Video id or URL is required for this provider.";
    case "TOO_LONG":
      return "Video id or URL is too long.";
    case "INVALID_YOUTUBE_HOST":
    case "INVALID_YOUTUBE_URL":
    case "INVALID_YOUTUBE_ID":
      return "Invalid YouTube URL or video id. Paste a watch URL, youtu.be link, or the 11-character video id.";
    case "INVALID_VIMEO_HOST":
    case "INVALID_VIMEO_URL":
    case "INVALID_VIMEO_ID":
      return "Invalid Vimeo URL or video id. Paste a vimeo.com/video/… link or the numeric video id.";
    case "INVALID_MUX_HOST":
    case "INVALID_MUX_URL":
    case "INVALID_MUX_ID":
      return "Invalid Mux URL or playback id. Use a stream URL on mux.com or paste the playback/asset id.";
    default:
      return `Invalid ${provider} reference.`;
  }
}
