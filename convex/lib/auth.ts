import type { QueryCtx, MutationCtx } from "../_generated/server";

/** Map to Effect tagged errors (INF-73). */
export const AUTH_ERROR_NOT_AUTHENTICATED = "ConvexAuth:NotAuthenticated" as const;

/**
 * CMS functions require a valid Convex identity (Clerk JWT). Any signed-in Clerk user may read/edit.
 */
export async function requireAuthenticatedIdentity(ctx: QueryCtx | MutationCtx) {
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
