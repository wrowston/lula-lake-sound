<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Lula Lake Sound Next.js 15 App Router project.

**Client-side initialization** was added to `src/instrumentation-client.ts` alongside the existing Sentry setup, using the Next.js 15.3+ recommended `instrumentation-client.ts` approach with a reverse proxy (`/ingest`) so analytics requests are not blocked by ad-blockers.

**Server-side tracking** was added to the contact API route (`src/app/api/contact/route.ts`), capturing a confirmed `inquiry_saved` event on every successful inquiry write to the database.

**Reverse proxy rewrites** were added to `next.config.ts` so PostHog JS and ingestion traffic routes through `/ingest` on the app's own domain.

**Environment variables** `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` were written to `.env.local`.

**New file** `src/lib/posthog-server.ts` provides a singleton `getPostHogClient()` for server-side event capture using `posthog-node`.

| Event | Description | File |
|---|---|---|
| `contact_inquiry_submitted` | User successfully submitted the artist contact inquiry form | `src/components/contact-inquiry-form.tsx` |
| `contact_inquiry_failed` | Contact inquiry form submission encountered a server or network error | `src/components/contact-inquiry-form.tsx` |
| `inquiry_saved` | Artist inquiry was successfully saved to the database and email sent (server-side) | `src/app/api/contact/route.ts` |
| `studio_pricing_book_session_click` | User clicked Book Your Session CTA on a pricing package card | `src/components/services-pricing.tsx` |
| `pricing_custom_quote_clicked` | User clicked the Get Custom Quote CTA in the pricing section | `src/components/services-pricing.tsx` |
| `recording_played` | User started playing a recording track | `src/app/recordings/recordings-client.tsx` |
| `streaming_link_clicked` | User clicked a Spotify or Apple Music streaming link on a recording | `src/app/recordings/recordings-client.tsx` |
| `gallery_filter_selected` | User selected a category filter pill in the gallery | `src/app/gallery/gallery-client.tsx` |
| `gallery_item_opened` | User opened a photo or video in the gallery lightbox | `src/app/gallery/gallery-client.tsx` |
| `booking_date_selected` | User selected an available date in the booking availability calendar | `src/components/booking-availability.tsx` |
| `booking_quick_package_clicked` | User clicked a quick booking package option (e.g. Single Day, 3-Day Album) | `src/components/booking-availability.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/404204/dashboard/1529002
- **Inquiry submission funnel** (pricing CTA → form submit): https://us.posthog.com/project/404204/insights/twneP8xC
- **Contact inquiry submissions over time**: https://us.posthog.com/project/404204/insights/BdwEKsFR
- **Pricing CTA clicks by package**: https://us.posthog.com/project/404204/insights/Cgh4ezzp
- **Top played recordings**: https://us.posthog.com/project/404204/insights/d43xb3b7
- **Inquiry submission error rate** (success vs failure): https://us.posthog.com/project/404204/insights/Xcek67Lx

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
