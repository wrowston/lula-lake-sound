import type { MutationCtx, QueryCtx } from "../_generated/server";
import { cmsUnauthorized } from "../errors";

export async function requireOutreachIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    cmsUnauthorized("Sign in required.", "sign_in_required");
  }
  return identity;
}

async function assertMemberOfOutreachWorkspace(
  ctx: QueryCtx | MutationCtx,
  workspaceId: string,
  memberTokenIdentifier: string,
) {
  if (workspaceId === memberTokenIdentifier) {
    return;
  }
  const membership = await ctx.db
    .query("outreachWorkspaceMembers")
    .withIndex("by_workspaceId_and_memberTokenIdentifier", (q) =>
      q
        .eq("workspaceId", workspaceId)
        .eq("memberTokenIdentifier", memberTokenIdentifier),
    )
    .unique();
  if (membership === null) {
    cmsUnauthorized(
      "You do not have access to this workspace.",
      "forbidden",
    );
  }
}

/** Verifies the signed-in identity may access rows keyed by `workspaceId`. */
export async function assertOutreachWorkspaceAccess(
  ctx: QueryCtx | MutationCtx,
  workspaceId: string,
) {
  const identity = await requireOutreachIdentity(ctx);
  await assertMemberOfOutreachWorkspace(
    ctx,
    workspaceId,
    identity.tokenIdentifier,
  );
  return identity;
}

/**
 * Resolves the tenant key for outreach data. Callers must scope every read/write
 * with the returned `workspaceId`. Personal workspaces default to
 * `identity.tokenIdentifier`; shared workspaces use rows in `outreachWorkspaceMembers`.
 */
export async function resolveOutreachWorkspace(
  ctx: QueryCtx | MutationCtx,
  workspaceIdArg: string | undefined,
) {
  const identity = await requireOutreachIdentity(ctx);
  const workspaceId = workspaceIdArg ?? identity.tokenIdentifier;
  await assertMemberOfOutreachWorkspace(
    ctx,
    workspaceId,
    identity.tokenIdentifier,
  );
  return { identity, workspaceId };
}
