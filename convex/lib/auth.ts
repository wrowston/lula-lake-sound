import type { QueryCtx, MutationCtx } from "../_generated/server";
import { cmsUnauthorized } from "../errors";

function parseCommaSeparatedEnvList(envKey: string): string[] | null {
  const raw = process.env[envKey];
  if (raw === undefined || raw.trim() === "") {
    return null;
  }
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return ids.length > 0 ? ids : null;
}

function parseCmsOwnerTokenIdentifiers(): string[] | null {
  return parseCommaSeparatedEnvList("CMS_OWNER_TOKEN_IDENTIFIERS");
}

function parseInferencePartnersTokenIdentifiers(): string[] | null {
  return parseCommaSeparatedEnvList("INFERENCE_PARTNERS_TOKEN_IDENTIFIERS");
}

/**
 * CMS functions require a valid Convex identity (Clerk JWT). Any signed-in Clerk user may read/edit.
 */
export async function requireAuthenticatedIdentity(
  ctx: QueryCtx | MutationCtx,
  signInMessage = "Sign in required to access the CMS.",
) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    cmsUnauthorized(signInMessage, "sign_in_required");
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

/**
 * Resolves whether the caller may use Inference Partners dashboard Convex APIs.
 * When `INFERENCE_PARTNERS_TOKEN_IDENTIFIERS` is unset, any authenticated identity passes.
 */
export async function resolveInferencePartnersDashboardIdentity(
  ctx: QueryCtx | MutationCtx,
) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return { kind: "signed_out" as const };
  }
  const allowlist = parseInferencePartnersTokenIdentifiers();
  if (allowlist !== null && !allowlist.includes(identity.tokenIdentifier)) {
    return { kind: "forbidden" as const };
  }
  return { kind: "ok" as const, identity };
}

/**
 * Inference Partners dashboard — Convex-side gate (JWT from Clerk).
 * When `INFERENCE_PARTNERS_TOKEN_IDENTIFIERS` is set on the deployment, only those
 * `identity.tokenIdentifier` values are allowed; when unset, any authenticated user passes.
 */
export async function requireInferencePartnersUser(
  ctx: QueryCtx | MutationCtx,
) {
  const resolved = await resolveInferencePartnersDashboardIdentity(ctx);
  if (resolved.kind === "signed_out") {
    cmsUnauthorized(
      "Sign in required to access the Inference Partners dashboard.",
      "sign_in_required",
    );
  }
  if (resolved.kind === "forbidden") {
    cmsUnauthorized(
      "You do not have permission to access the Inference Partners dashboard.",
      "forbidden",
    );
  }
  const { identity } = resolved;
  return {
    identity,
    userId: identity.subject,
    updatedBy: identity.tokenIdentifier,
  };
}
