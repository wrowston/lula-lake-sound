# CMS videos (INF-92)

## Decision (v1)

**Primary strategy: structured embeds + optional Convex upload.**

- **Default path:** store **`provider`** (`youtube` | `vimeo` | `mux`) and a canonical **`externalId`** (or parsed from a pasted watch URL). The **public site never assigns arbitrary iframe `src` strings** — it builds player/embed URLs from allowlisted provider patterns (same idea as validating on save).
- **Secondary path:** **`provider: upload`** — raw video file in **Convex file storage** (`videoStorageId`). Used when an embed is not acceptable or for short clips. **No transcoding** in v1; clients play the file URL directly (MP4/WebM) where supported.

This is **one** mental model: each row is either an embed reference + metadata or an uploaded blob + metadata. There is no parallel “paste any iframe HTML” flow.

## Schema (`cmsVideos`)

| Field | Purpose |
| ----- | ------- |
| `scope` | `draft` \| `published` (same as gallery photos / audio). |
| `stableId` | Client-stable id for edits. |
| `title`, `description` | Display copy. |
| `sortOrder` | Manual ordering. |
| `provider` | `youtube` \| `vimeo` \| `mux` \| `upload`. |
| `externalId` | Provider-native id (YouTube 11-char id, Vimeo id, Mux playback id), **after** URL normalization. |
| `playbackUrl` | Optional **Mux** HTTPS playback URL (hostname allowlist); can accompany `externalId`. |
| `videoStorageId` | Convex `_storage` id when `provider === "upload"`. |
| `thumbnailStorageId` | Optional poster image in Convex storage. |
| `thumbnailUrl` | Optional HTTPS poster URL (hostname allowlist — CDNs only, not arbitrary domains). |
| `durationSec` | Optional length in seconds. |

Bookkeeping: **`cmsVideoMeta`** mirrors **`galleryPhotoMeta`** (`hasDraftChanges`, `publishedAt`, etc.).

## Constraints (upload)

- **Max videos:** 24 rows (draft list cap).
- **Max upload size:** 100MB (`MAX_CMS_VIDEO_UPLOAD_BYTES`).
- **Allowed MIME types:** `video/mp4`, `video/webm`, `video/quicktime`.
- **Transcoding:** out of scope — owners should upload browser-playable files or use YouTube/Vimeo/Mux embeds.

## Security

- **Embeds:** only **`provider`** values in the enum are valid; **`externalId`** is validated per provider (YouTube/Vimeo URL parsing, Mux id/URL extraction). No user-supplied iframe URL for YouTube/Vimeo.
- **HTTPS URLs** (thumbnails, optional Mux playback): validated with **hostname allowlists** in `convex/videoUrls.ts` so arbitrary attacker-controlled origins cannot be stored.

## Convex API

| Surface | Functions |
| ------- | --------- |
| **Admin** | `admin/videos`: `listDraftVideos`, `createDraftVideo`, `updateDraftVideo`, `removeDraftVideo`, `reorderDraftVideos`, `publishVideos`, `discardDraftVideos` |
| **Public** | `public.getPublishedCmsVideos` — published scope only, materialized URLs for storage-backed assets |

Invalid URLs and ids fail with **`ConvexError`** payload `code: "VALIDATION_ERROR"` and a **clear message** (e.g. invalid YouTube URL, thumbnail host not allowed).

## Follow-ups

- Wire the Next.js admin UI to these mutations.
- Optional: add `cmsVideos` to `publishSite` if site-wide publish should include videos in one action.
