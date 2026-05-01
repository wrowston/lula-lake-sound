# CMS preview (owner session + cache safety)

This file combines the **ADR for preview delivery** (INF-68) with **operational
notes for caching and Vercel** (INF-107).

---

## Caching, CDN, and draft leakage (INF-107)

### Goal

Preview HTML and RSC payloads must **never** be treated as publicly cacheable at
the edge. If they were, a shared cache could theoretically serve one owner’s
draft HTML to another visitor.

### What the app does

| Layer | Behavior |
|-------|----------|
| **`src/app/preview/layout.tsx`** | `export const dynamic = "force-dynamic"` so the segment opts out of static rendering and full route cache. |
| **`next.config.ts` → `headers()`** | For `/preview` and `/preview/:path*`, sets `Cache-Control`, `CDN-Cache-Control`, and `Vercel-CDN-Cache-Control` to the value in `src/lib/preview-cache-headers.ts` (`private, no-cache, no-store, max-age=0, must-revalidate`). This applies to **every** response on those paths, including Clerk **`auth.protect()` redirects** from `src/middleware.ts`, which would not inherit layout segment cache rules. |
| **Convex** | Draft reads stay owner-gated in preview queries; published site uses separate published-scope reads. |

### `VERCEL_ENV` on Vercel

| Value | Typical URL | Meaning |
|-------|-------------|---------|
| `production` | Production domain (e.g. custom domain or `*.vercel.app` production alias) | Production deployment. |
| `preview` | Git branch / PR preview URLs (`*.vercel.app` without production assignment) | Preview deployment — **not** the same as the `/preview` **route** in this app. |
| `development` | `next dev` locally | Local only. |

`VERCEL_ENV === "preview"` means “this **deployment** is a Vercel preview,” not
“the request path is `/preview`.” The CMS owner preview **route** is always
under `/preview` on whichever deployment you open.

**Gotcha:** Do not rely on `VERCEL_ENV` alone to decide whether to serve draft
content. Draft vs published is enforced by **Clerk + Convex** on `/preview/*`.
Use cache headers + dynamic rendering so draft HTML is not CDN-cached as
public static assets.

### Manual verification (production or any deployment)

After signing in as the owner and loading a draft preview, anonymous users
should still see **published** content on `/`, `/about`, etc. Verify cache
headers on preview paths (no auth needed to see redirect/sign-in responses;
headers should still be `no-store`):

```bash
curl -sI "https://<your-host>/preview" | grep -i cache-control
curl -sI "https://<your-host>/preview/about" | grep -i cache-control
```

Expect `Cache-Control` (and Vercel-specific headers if present) to include
`no-store` and `private`. Automated coverage: `src/lib/preview-cache-headers.test.ts`.

---

# ADR: CMS Preview Delivery Mechanism

**Status:** Proposed  
**Date:** 2026-04-14  
**Ticket:** INF-68

## Context

Lula Lake Sound is a Next.js 15 (App Router) + Convex + Clerk site that currently
serves all page content as hard-coded React components. As the CMS layer is built
out, studio owners will need to preview draft content before publishing. This ADR
selects the preview delivery mechanism and defines the routing and data-access
contracts implementers will follow.

### Current state of the repo

| Concern | Status |
|---------|--------|
| Next.js routes | Single page (`/`) + one API route (`POST /api/contact`). All static. |
| Convex tables | `inquiries` only — no content/pages/posts tables yet. |
| Auth | **Not yet integrated.** No Clerk dependencies, no middleware, no `auth.config.ts`. |
| Hosting | Vercel (inferred from `@vercel/analytics` + `@vercel/speed-insights`). |

## Decision

**Owner-session preview** — draft content is visible only when the request
carries a valid Clerk session belonging to the studio owner.

### Why this option

| Criterion | Owner session | Signed URL | Separate deployment |
|-----------|:---:|:---:|:---:|
| Simplicity for a single-owner studio | ✅ | ⚠️ token minting adds surface | ❌ infra overhead |
| No accidental public leakage | ✅ session-scoped | ⚠️ URL can be forwarded/logged | ✅ network-isolated |
| CDN compatibility | Compatible via `no-store` on preview routes | Compatible | N/A |
| Clerk already planned for the stack | ✅ reuses existing auth | Needs extra signing key management | N/A |
| Collaborative sharing | ⚠️ limited to logged-in owners | ✅ link-shareable | ❌ |

For a single-owner studio site, session-based preview is the simplest approach
with the smallest attack surface. Signed URLs can be added later as an
incremental enhancement if external collaborators need link-based preview access
(see Non-goals).

### How it works

1. Studio owner signs in via Clerk.
2. Owner navigates to a preview URL (e.g. `/preview/pages/[slug]`).
3. Next.js middleware (or the route's server component) verifies the Clerk
   session and extracts the `userId`.
4. The route calls a Convex `preview` query that checks ownership server-side
   via `ctx.auth.getUserIdentity()` and returns the draft document.
5. If the session is missing or the user is not the owner, the route returns
   404 (not 403 — to avoid confirming that a draft exists).

## Threat Model

| Threat | Mitigation |
|--------|------------|
| **Draft leakage via URL guessing** | Preview routes require a valid Clerk session; unauthenticated requests get 404. |
| **Draft leakage via CDN cache** | Preview segment uses `force-dynamic` plus `next.config.ts` `headers()` on `/preview` paths (`no-store`, `private`, Vercel CDN override headers). See the INF-107 section at the top of this file. |
| **Session hijacking** | Delegated to Clerk's session management (HttpOnly cookies, short-lived JWTs, rotation). No custom token handling. |
| **Privilege escalation (non-owner sees drafts)** | Convex `preview` query checks `tokenIdentifier` against an owner allowlist stored in the DB or env. Returns `null` for non-owners. |
| **Referrer leakage** | Preview URLs contain no secret tokens, so referrer headers are benign. Add `<meta name="referrer" content="no-referrer">` on preview pages as defense-in-depth. |
| **Stale preview after publish** | Published content is served by a separate `published` query that reads only `status === "published"` rows. Preview always reads latest draft. No cross-contamination. |

## Non-goals

These are explicitly **out of scope** for this decision and the initial
implementation:

- **Signed / shareable preview URLs** — Deferred until there is a concrete need
  for external collaborators who cannot sign in with Clerk. Can be added as a
  thin layer on top (mint a short-lived HMAC token, verify in middleware).
- **Separate preview deployment / staging split** — Not required when preview is
  gated by auth on the same deployment.
- **Real-time collaborative editing preview** — The preview route shows the
  latest saved draft, not a live-editing cursor view.
- **Preview for unauthenticated visitors** — All preview is owner-only.
- **A/B testing or feature-flag based preview** — Orthogonal concern.
- **ISR / on-demand revalidation for preview** — Preview is always dynamic.
  On-demand revalidation applies only to published routes and is a separate
  ticket.

## Next.js Route Plan

All routes live under `src/app/` (App Router, `src/` directory).

| Route | Rendering | Cache | Auth | Purpose |
|-------|-----------|-------|------|---------|
| `/` | Static (current) | Default (static) | None | Public marketing home |
| `/pages/[slug]` | Static + ISR | `revalidate` / on-demand | None | Published CMS page (public) |
| `/preview/pages/[slug]` | Dynamic | `force-dynamic` (`no-store`) | Clerk session required | Draft CMS page (owner only) |
| `POST /api/contact` | Dynamic (route handler) | N/A | None | Contact form submission |
| `/studio/[...path]` *(future)* | Dynamic | `force-dynamic` | Clerk session required | CMS editing UI |

### Key implementation notes

- **Middleware:** Add `src/middleware.ts` using `clerkMiddleware()`. Protect
  `/preview/*` and `/studio/*` routes. Public routes (`/`, `/pages/*`,
  `/api/contact`) remain unprotected.
- **Static published pages** should use `generateStaticParams` and on-demand
  revalidation via a Convex webhook or mutation-triggered `revalidatePath`.
- **Preview pages** must never be statically generated. Use
  `export const dynamic = "force-dynamic"` in the route segment.

## Convex Data-Access Contract

Two query entry points per content table, enforcing a clear published/preview
boundary.

### Schema additions (illustrative)

```typescript
// convex/schema.ts — additions for CMS content
pages: defineTable({
  slug: v.string(),
  title: v.string(),
  body: v.string(),
  status: v.union(v.literal("draft"), v.literal("published")),
  ownerTokenIdentifier: v.string(),
  publishedAt: v.optional(v.number()),
  updatedAt: v.number(),
})
  .index("by_slug_and_status", ["slug", "status"])
  .index("by_owner", ["ownerTokenIdentifier"]),
```

### Query entry points

```typescript
// convex/pages.ts

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Public query — returns only published content.
 * No authentication required. Safe to call from static/ISR pages.
 */
export const published = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pages")
      .withIndex("by_slug_and_status", (q) =>
        q.eq("slug", args.slug).eq("status", "published"),
      )
      .unique();
  },
});

/**
 * Authorized query — returns the latest draft for preview.
 * Requires a valid Clerk session. Verifies ownership server-side.
 * Returns null (not an error) for unauthorized callers to avoid
 * leaking draft existence.
 */
export const preview = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const page = await ctx.db
      .query("pages")
      .withIndex("by_slug_and_status", (q) =>
        q.eq("slug", args.slug).eq("status", "draft"),
      )
      .unique();

    if (!page) return null;
    if (page.ownerTokenIdentifier !== identity.tokenIdentifier) return null;

    return page;
  },
});
```

### Rules for implementers

1. **Never accept a `userId` argument** for authorization — always derive
   identity from `ctx.auth.getUserIdentity()`.
2. **Use `tokenIdentifier`** (not `subject`) for ownership checks, per Convex
   guidelines.
3. The `published` query is the **only** query called from public routes. It
   must never return draft content.
4. The `preview` query is the **only** query called from `/preview/*` routes.
   It must verify ownership before returning data.
5. Both queries return `null` for missing content — the calling route converts
   this to a Next.js `notFound()`.
6. **No internal/private queries needed** at this layer. Both are public Convex
   queries; access control is enforced inside the handler.

## Migration Path to Signed URLs (if needed later)

If external collaborators need link-based preview without a Clerk account:

1. Add a `previewTokens` table to Convex (`slug`, `token`, `expiresAt`,
   `createdBy`).
2. Create a mutation to mint a short-lived token (e.g. 24h HMAC or random
   UUID).
3. Add a third query `previewByToken` that validates the token and expiry
   instead of checking `ctx.auth`.
4. Expose it at `/preview/pages/[slug]?token=<value>` — middleware allows
   the request through if the query string contains a `token` param.
5. Document referrer/logging risks: the token appears in the URL and may
   be captured by analytics, browser history, or shared screenshots.

## References

- [Convex Auth docs](https://docs.convex.dev/auth)
- [Clerk + Next.js middleware](https://clerk.com/docs/references/nextjs/clerk-middleware)
- [Next.js App Router caching](https://nextjs.org/docs/app/building-your-application/caching)
- Repo: `lula-lake-sound` — Next.js 15 + Convex + Clerk
