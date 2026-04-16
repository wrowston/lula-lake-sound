import type { QueryCtx, MutationCtx } from "../_generated/server";
import { cmsUnauthorized } from "../errors";

function parseCmsOwnerTokenIdentifiers(): string[] | null {
  const raw = process.env.CMS_OWNER_TOKEN_IDENTIFIERS;
  if (raw === undefined || raw.trim() === "") {
    return null;
  }
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return ids.length > 0 ? ids : null;
}

/**
 * CMS functions require a valid Convex identity (Clerk JWT). Any signed-in Clerk user may read/edit.
 */
export async function requireAuthenticatedIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    cmsUnauthorized("Sign in required to access the CMS.", "sign_in_required");
  }
  return {
    identity,
    userId: identity.subject,
    updatedBy: identity.tokenIdentifier,
  };
}

/**
 * Restricts mutations to the studio owner when `CMS_OWNER_TOKEN_IDENTIFIERS` is set on the Convex
 * deployment (comma-separated `identity.tokenIdentifier` values from Clerk). If unset, falls back
 * to any authenticated user so local dev keeps working.
 */
export async function requireCmsOwner(ctx: QueryCtx | MutationCtx) {
  const base = await requireAuthenticatedIdentity(ctx);
  const allowlist = parseCmsOwnerTokenIdentifiers();
  if (allowlist === null) {
    return base;
  }
  if (!allowlist.includes(base.identity.tokenIdentifier)) {
    cmsUnauthorized(
      "You do not have permission to perform this action.",
      "forbidden",
    );
  }
  return base;
}
