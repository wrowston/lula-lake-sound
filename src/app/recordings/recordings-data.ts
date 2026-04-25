/**
 * Shape for the public Recordings page (INF-48 / INF-97).
 *
 * Fields are a superset of the four primary columns (`title`, `artist`, `genre`,
 * `year`) plus metadata for Convex / CMS (`id`, `order`, `role`, `audioUrl`,
 * `coverImageUrl`, `spotifyUrl`, `appleMusicUrl`). `genre` and `year` are
 * optional for CMS-sourced audio (portfolio tracks do not store them yet).
 */
export interface Recording {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  /**
   * When omitted or blank, the table shows an em dash. Reserved for a future
   * CMS field.
   */
  readonly genre?: string;
  /**
   * When omitted or zero, the table shows an em dash. Reserved for a future
   * CMS field.
   */
  readonly year?: number;
  readonly audioUrl: string;
  /** Album / single artwork — shown as a row thumbnail when set. */
  readonly coverImageUrl?: string;
  readonly order?: number;
  /** Optional engineering credit — kept as secondary metadata per client direction. */
  readonly role?: string;
  /** Optional streaming links — shown in the table when set. */
  readonly spotifyUrl?: string;
  readonly appleMusicUrl?: string;
}

/** @deprecated Use {@link mapPublishedAudioToRecordings} with Convex; kept for tests. */
export const RECORDINGS: readonly Recording[] = [];

/**
 * One row as returned from `getPublishedAudioTracks` / `getPreviewAudioTracks`
 * (after `materializeAudioTracks`); `url` may be null for incomplete rows.
 */
export type CmsAudioTrackRow = {
  readonly stableId: string;
  readonly url: string | null;
  readonly title: string;
  readonly artist: string | null;
  readonly sortOrder: number;
  readonly albumThumbnailDisplayUrl: string | null;
  readonly spotifyUrl: string | null;
  readonly appleMusicUrl: string | null;
};

/**
 * Map CMS audio portfolio rows to table rows for {@link RecordingsClient}.
 * Drops tracks without a playback URL. Preserves `sortOrder` from Convex.
 */
export function mapPublishedAudioToRecordings(
  rows: readonly CmsAudioTrackRow[],
): Recording[] {
  return rows
    .filter(
      (t): t is CmsAudioTrackRow & { url: string } =>
        t.url !== null && t.url.length > 0,
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => {
      const artist = t.artist?.trim() ? t.artist : "—";
      return {
        id: t.stableId,
        title: t.title,
        artist,
        audioUrl: t.url,
        order: t.sortOrder,
        ...(t.albumThumbnailDisplayUrl
          ? { coverImageUrl: t.albumThumbnailDisplayUrl }
          : {}),
        ...(t.spotifyUrl ? { spotifyUrl: t.spotifyUrl } : {}),
        ...(t.appleMusicUrl ? { appleMusicUrl: t.appleMusicUrl } : {}),
      } satisfies Recording;
    });
}
