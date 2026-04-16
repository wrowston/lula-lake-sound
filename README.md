This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Convex, Resend, and environment variables

The contact form (`POST /api/contact`) saves inquiries to **Convex** and sends email with **Resend**.

1. Copy [`.env.example`](./.env.example) to `.env.local` and fill in values.
2. Create a Convex project and deploy functions: run `bun run convex:dev` once, then use `bun run convex:deploy` for production.
3. Set `NEXT_PUBLIC_CONVEX_URL` from the [Convex dashboard](https://dashboard.convex.dev).
4. Add a [Resend](https://resend.com) API key and a verified `RESEND_FROM_EMAIL` address.

## Sentry

This app uses `@sentry/nextjs` for App Router error monitoring and tracing across the browser, Node.js routes, and Edge runtime.

- Set `SENTRY_DSN` for server and edge events. If `NEXT_PUBLIC_SENTRY_DSN` is unset, the same DSN is exposed to the browser build automatically.
- Local development stays quiet by default. Set `SENTRY_ENABLED=true` if you want to test Sentry locally.
- Sentry environment defaults to `VERCEL_ENV`, then `NODE_ENV`. Override with `SENTRY_ENVIRONMENT` if needed.
- Release defaults to `VERCEL_GIT_COMMIT_SHA`, then `VERCEL_DEPLOYMENT_ID`. Override with `SENTRY_RELEASE` if your CI uses a different build identifier.
- For CI source map uploads, set `SENTRY_AUTH_TOKEN`, plus `SENTRY_ORG` and `SENTRY_PROJECT`.

For a quick non-production verification, hit these routes and confirm the returned `eventId` shows up in Sentry with the expected environment and release:

- `/api/dev/sentry/node`
- `/api/dev/sentry/edge`

### Convex backend

Uncaught and selected handled errors can be forwarded from Convex using an internal Node action (`convex/sentryNodeReport.ts`) that calls `@sentry/node` with tags `convex_function`, `convex_deployment` (derived from `CONVEX_CLOUD_URL`), and a SHA-256 prefix of the Clerk `tokenIdentifier` as the Sentry user id. Set `SENTRY_DSN` on the Convex deployment (dashboard → Deployment Settings → Environment Variables). Optional: `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`. From mutations, call `scheduleConvexSentryException` from `convex/lib/sentryConvex.ts` (or `internal.observability.reportHandledFailure` for handled-only paths).

**Built-in alternative:** Convex Pro can send exceptions to Sentry automatically from the dashboard (see [Exception reporting](https://docs.convex.dev/production/integrations/exception-reporting)); that path does not run the full Sentry SDK in your function bundle. This repository’s Node action is a code-level supplement with explicit context control.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
