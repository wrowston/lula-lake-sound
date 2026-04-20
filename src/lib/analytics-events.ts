/**
 * Canonical event names for PostHog. Use these when instrumenting the marketing site
 * so the CMS dashboard and PostHog stay aligned.
 */
export const POSTHOG_EVENTS = {
  /** Fired when the user clicks a pricing "Book your session" CTA. */
  PRICING_BOOK_SESSION_CLICK: "studio_pricing_book_session_click",
} as const;
