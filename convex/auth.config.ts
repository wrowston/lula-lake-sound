import type { AuthConfig } from "convex/server";

/**
 * Clerk JWT validation for Convex. Set `CLERK_FRONTEND_API_URL` on the Convex
 * deployment (Clerk Dashboard → Integrations → Convex, or your Frontend API URL).
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_FRONTEND_API_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
