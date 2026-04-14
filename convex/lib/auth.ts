import type { QueryCtx, MutationCtx } from "../_generated/server";
import { cmsUnauthorized } from "../errors";

/**
 * CMS functions require a valid Convex identity (Clerk JWT). Any signed-in Clerk user may read/edit.
 */
export async function requireAuthenticatedIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    cmsUnauthorized("Sign in required to access the CMS.");
  }
  return {
    identity,
    userId: identity.subject,
    updatedBy: identity.tokenIdentifier,
  };
}
