# Linear issues — PostHog & CMS analytics

Copy titles and descriptions into Linear. Adjust team/project labels as needed.

---

## 1. [Done in repo] CMS dashboard: PostHog metrics via Personal API key

**Title:** `CMS: PostHog analytics summary on admin dashboard`

**Description:**

Ship a server-rendered analytics block on `/admin` that queries PostHog using the **Personal API key** (HogQL `query:read` scope). No API key is exposed to the browser.

**Acceptance criteria (implemented):**

- [x] Env: `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, optional `POSTHOG_HOST` (EU: `https://eu.posthog.com`) documented in `.env.example`.
- [x] Dashboard shows cached metrics (~5 min): site `$pageview` counts (7d/30d), home `$pageview` (7d), and counts for custom event `studio_pricing_book_session_click` (7d/30d).
- [x] When env is unset, show setup instructions instead of errors.
- [x] Canonical event name exported from `src/lib/analytics-events.ts` for future instrumentation.

**Links:**

- Code: `src/lib/posthog-server.ts`, `src/components/admin/posthog-analytics-section.tsx`, `src/app/admin/page.tsx`

---

## 2. [Ops] Configure PostHog secrets in hosting

**Title:** `Ops: Add PostHog env vars to Vercel (staging + production)`

**Description:**

Add PostHog credentials so the CMS dashboard can query metrics in deployed environments.

**Tasks:**

- Create a PostHog **Personal API key** with scope **`query:read`** (Project settings → API).
- Set `POSTHOG_PROJECT_ID` (numeric project id from PostHog URL/settings).
- Set `POSTHOG_HOST` to `https://us.posthog.com` or `https://eu.posthog.com` to match the project region.
- Add the same vars to Convex if any future server job needs PostHog (not required for current dashboard).

**Acceptance criteria:**

- [ ] `/admin` dashboard shows numeric tiles (not “not configured”) in staging and production after deploy.
- [ ] Key stored only in server env, never `NEXT_PUBLIC_*`.

---

## 3. [Product] Instrument “Book your session” for pricing effectiveness

**Title:** `Analytics: capture pricing CTA clicks in PostHog`

**Description:**

The CMS already queries event `studio_pricing_book_session_click` (see `POSTHOG_EVENTS.PRICING_BOOK_SESSION_CLICK`). Wire the marketing site so that click fires from every pricing “Book your session” CTA (and variants if duplicated).

**Tasks:**

- Add `posthog-js` (or `posthog-react`) and `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` for the **public** site only.
- Initialize PostHog in the app layout or a provider; respect cookie/consent if applicable.
- On CTA click (and keyboard activation where relevant), call `posthog.capture(POSTHOG_EVENTS.PRICING_BOOK_SESSION_CLICK, { location: 'services-pricing' | 'the-space' | … })`.

**Acceptance criteria:**

- [ ] Events appear in PostHog within minutes of testing.
- [ ] CMS dashboard “Pricing — Book session clicks” tiles show non-zero counts after real traffic.

---

## 4. [Optional] Hardening & product analytics hygiene

**Title:** `Analytics: naming doc + funnel in PostHog`

**Description:**

- Document the event taxonomy (CTA events, optional `$pageview` filters) in the team wiki or README section the client can read.
- In PostHog, create a saved insight or funnel: `$pageview` on `/` → `studio_pricing_book_session_click` → (future) form submitted, for client reporting.

**Acceptance criteria:**

- [ ] Client can self-serve primary “pricing effectiveness” view in PostHog without the CMS.
