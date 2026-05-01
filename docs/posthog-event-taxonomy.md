# PostHog event taxonomy (client reference)

Short reference for **Lula Lake Sound** marketing and ops: custom events emitted by the public site, useful properties, and how to build a **pricing effectiveness** view in PostHog without relying on CMS admin tiles.

**PostHog UI:** Use the project that matches your app (this codebase points the tracker UI at `https://us.posthog.com`; if your project lives in the EU region, use the EU PostHog URL instead).

---

## Automatic events

PostHog’s JavaScript SDK records **`$pageview`** on navigation (along with other defaults in use for this project).

### Optional `$pageview` filters (examples)

| Goal | Suggested filter |
|------|------------------|
| Homepage only | Event = `$pageview` and **`$pathname`** equals **`/`** |
| Any visit that hit pricing section | `$pageview` where **`$pathname`** equals **`/`** (pricing is on the homepage) — or use a funnel starting at `$pageview` and a later pricing CTA event for a stricter “saw pricing” proxy |

Property names can vary slightly by SDK version; if **`$pathname`** is empty in your project, try **`$current_url`** contains your site origin and path **`/`**.

---

## Pricing & inquiry flow (primary “effectiveness” story)

These events answer: *Did visitors who see pricing act on it and complete an inquiry?*

| Order | Event | Where it fires | Notes |
|------|--------|----------------|-------|
| 1 | **`$pageview`** | Any page load | Filter to **`/`** to focus on the main landing experience. |
| 2 | **`studio_pricing_book_session_click`** | “Book Your Session” on the homepage (Services & Pricing + The Space sections) | Strongest pricing CTA. |
| 3a | **`contact_inquiry_submitted`** | Browser, after successful `/api/contact` response | Submission confirmed in the client session (good for funnels). |
| 3b | **`inquiry_saved`** | Server, after Convex save + successful email send | Confirmed pipeline completion; uses the **same browser distinct ID** as step 2 when the contact form sends PostHog headers (see below). |

Supporting CTAs on the same page:

| Event | Meaning |
|-------|---------|
| **`pricing_custom_quote_clicked`** | “Get Custom Quote” → scrolls to inquiries. |
| **`booking_quick_package_clicked`** | Quick package buttons on the booking block (property: **`package`**). |

---

## Custom events — full list

| Event name | Typical properties |
|------------|-------------------|
| **`studio_pricing_book_session_click`** | **`location`**: `services-pricing` or `the-space`; optional **`package_name`**, **`price_cents`**, **`highlighted`** (pricing cards only). |
| **`pricing_custom_quote_clicked`** | — |
| **`contact_inquiry_submitted`** | **`has_phone`**: boolean. |
| **`contact_inquiry_failed`** | **`reason`**: message string. |
| **`inquiry_saved`** | **`artist_name`**, **`has_phone`**: boolean (server-side). |
| **`booking_date_selected`** | **`date`**, **`month`**, **`availability_type`**. |
| **`booking_quick_package_clicked`** | **`package`**: string. |
| **`streaming_link_clicked`** | **`platform`**: `spotify` \| `apple_music`; **`track_title`**, **`track_artist`**. |
| **`recording_played`** | **`track_title`**, **`track_artist`**, **`track_genre`**, **`track_year`**. |
| **`gallery_filter_selected`** | **`filter`**. |
| **`gallery_item_opened`** | **`item_kind`**, **`item_alt`**, **`item_index`**, **`active_filter`**. |

---

## Saved insight: “Pricing effectiveness” funnel (PostHog UI)

Use this so stakeholders can open one saved insight without using the CMS.

1. In PostHog go to **Product analytics** → **New insight** → **Funnel**.
2. **Conversion window:** e.g. **7 days** (adjust to your sales cycle).
3. **Step 1 — Traffic:** Event **`$pageview`**, filter **`$pathname` = `/`** (or your homepage path).
4. **Step 2 — Pricing CTA:** Event **`studio_pricing_book_session_click`**  
   - Optional breakdown: property **`location`** (`services-pricing` vs `the-space`).
5. **Step 3 — Inquiry completed:** Prefer **`inquiry_saved`** (server-confirmed) **or** **`contact_inquiry_submitted`** (client-confirmed).  
   - Use **`inquiry_saved`** for “saved + emailed”; use **`contact_inquiry_submitted`** if you only care about the optimistic client success path.
6. Click **Save**, name it e.g. **“Pricing → inquiry funnel”**, and add it to a **dashboard** (e.g. “Marketing — Lula Lake Sound”).

**Optional second insight (trends):** New insight → **Trends** → **`studio_pricing_book_session_click`** counted **unique users**, interval **week**, breakdown **`location`** — quick read on which module drives more booking intent.

---

## Technical note (funnel correlation)

The contact API forwards **`X-POSTHOG-DISTINCT-ID`** from the browser so server **`inquiry_saved`** events attach to the **same person** as earlier clicks in that session. Without that, `inquiry_saved` used only the submitter’s email as the distinct ID and would not stitch to anonymous **`$pageview`** / CTA events in a funnel.
