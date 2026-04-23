/**
 * Shape for the public Recordings page (INF-48).
 *
 * Fields are a superset of the four primary columns (`title`, `artist`, `genre`,
 * `year`) plus metadata for Convex / CMS (`id`, `order`, `role`, `audioUrl`,
 * `coverImageUrl`, `spotifyUrl`, `appleMusicUrl`). Extended fields stay optional
 * so the table layout continues to work if entries omit them.
 *
 * `RECORDINGS` is empty until INF-49 (CMS) and INF-50 (media) supply content —
 * or wire this file to a Convex `preloadQuery` from `page.tsx` and pass the
 * list through.
 */
export interface Recording {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly genre: string;
  readonly year: number;
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

export const RECORDINGS: readonly Recording[] = [];
