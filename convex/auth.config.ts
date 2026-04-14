import type { AuthConfig } from "convex/server";

/**
 * Clerk JWT issuer for `ctx.auth.getUserIdentity()`.
 * Convex expects `CLERK_JWT_ISSUER_DOMAIN` on this deployment (same value as Clerk’s Frontend API URL,
 * e.g. `https://verb-noun-00.clerk.accounts.dev`). `CLERK_FRONTEND_API_URL` is a common alias — set either
 * in the Convex dashboard, then run `bunx convex dev --once` so the backend picks up providers.
 * @see https://docs.convex.dev/auth/clerk
 */
const clerkIssuerDomain =
  process.env.CLERK_JWT_ISSUER_DOMAIN ?? process.env.CLERK_FRONTEND_API_URL;

export default {
  providers: [
    {
      domain: clerkIssuerDomain!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
