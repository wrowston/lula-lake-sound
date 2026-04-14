import type { AuthConfig } from "convex/server";

/**
 * JWT issuers for Convex `ctx.auth.getUserIdentity()`.
 * Add Clerk (or another OIDC provider) here when integrated; until then, identity is null unless using custom JWT.
 */
export default {
  providers: [],
} satisfies AuthConfig;
