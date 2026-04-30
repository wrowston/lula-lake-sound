/**
 * HTTP cache directives for owner CMS preview routes (`/preview`, `/preview/*`).
 * Used by `next.config.ts` `headers()` so every response on those paths —
 * including Clerk `auth.protect()` redirects — avoids public edge/CDN caching
 * of HTML/RSC payloads (draft leakage risk).
 *
 * @see docs/cms-preview.md
 */
export const PREVIEW_CACHE_CONTROL =
  "private, no-cache, no-store, max-age=0, must-revalidate";
