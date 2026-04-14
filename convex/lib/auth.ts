import type { MutationCtx, QueryCtx } from "../_generated/server";

function parseAdminUserIds(): string[] {
  const raw = process.env.CLERK_ADMIN_USER_IDS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Clerk user ids (`UserIdentity.subject`) allowed to run admin mutations / queries.
 * Configure on the Convex deployment as `CLERK_ADMIN_USER_IDS` (comma-separated).
 */
export function isAdminClerkUserId(userId: string): boolean {
  return parseAdminUserIds().includes(userId);
}

export async function requireAdminIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Not authenticated");
  }
  const allowed = parseAdminUserIds();
  if (allowed.length === 0) {
    throw new Error("Server misconfiguration: CLERK_ADMIN_USER_IDS is empty");
  }
  if (!isAdminClerkUserId(identity.subject)) {
    throw new Error("Forbidden");
  }
  return identity;
}
