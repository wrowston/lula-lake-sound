<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `bunx convex ai-files install`.
<!-- convex-ai-end -->

## Project conventions

1. **Package manager:** Always use [Bun](https://bun.sh) instead of npm — use `bun install`, `bun run`, `bunx`, etc., not `npm`, `npx`, or `yarn`.
2. **React:** Do not use `useEffect()`. Prefer declarative data flow, event handlers, derived state, framework primitives (e.g. Server Components, loaders), or other patterns that avoid effect-based synchronization.

## Cursor Cloud specific instructions

### Services overview

| Service | Command | Port |
|---------|---------|------|
| Next.js dev server (Turbopack) | `bun run dev` | 3000 |
| Convex dev backend | `bun run convex:dev` | cloud-hosted |

### Running the app

- **Lint:** `bun run lint`
- **Build:** `bun run build`
- **Dev server:** `bun run dev` (Next.js 15 with Turbopack)
- The Convex backend is cloud-hosted; no local database is required. The `NEXT_PUBLIC_CONVEX_URL` env var points to the cloud deployment.
- Convex dev mode (`bun run convex:dev`) requires interactive login and is only needed when modifying Convex functions. For frontend-only work, the existing cloud deployment URL in `.env.local` is sufficient.

### Environment variables

Required secrets (must be in `.env.local` or injected as env vars):
- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL
- `RESEND_API_KEY` — Resend email API key
- `RESEND_FROM_EMAIL` — Verified sender address for Resend

Optional: `CONTACT_TO_EMAIL` (defaults to `info@lulalakesound.com`).

### Gotchas

- After `bun install`, three postinstall scripts are blocked by default (`@tailwindcss/oxide`, `@vercel/speed-insights`, `unrs-resolver`). Run `bun pm trust @tailwindcss/oxide @vercel/speed-insights unrs-resolver` to unblock them. Without `@tailwindcss/oxide`, Tailwind CSS will not work.
- The contact form (`POST /api/contact`) writes to Convex first, then sends email via Resend. If Resend credentials are invalid, the inquiry is still saved but the API returns 500 with a user-friendly fallback message.
- `next.config.ts` contains a workaround that strips a broken `globalThis.localStorage` in development mode. This is expected and should not be removed.
