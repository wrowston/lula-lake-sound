import type { QueryCtx, MutationCtx } from "../_generated/server";

/** Map to Effect tagged errors (INF-73). */
const AUTH_ERROR_NOT_AUTHENTICATED = "ConvexAuth:NotAuthenticated" as const;

/**
 * CMS functions require admin to be enabled on this Convex deployment (`ADMIN_ENABLED === "true"`)
 * and a valid Convex identity (Clerk JWT). Any signed-in Clerk user may read/edit when admin is on.
 */
export async function requireAuthenticatedIdentity(ctx: QueryCtx | MutationCtx) {
  if (process.env.ADMIN_ENABLED !== "true") {
    throw new Error("ConvexAuth:AdminDisabled");
  }
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error(AUTH_ERROR_NOT_AUTHENTICATED);
  }
  return {
    identity,
    userId: identity.subject,
    updatedBy: identity.tokenIdentifier,
  };
}
