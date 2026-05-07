import type { MutationCtx } from "../_generated/server";

export async function insertOutreachAuditEntry(
  ctx: MutationCtx,
  args: {
    workspaceId: string;
    actorTokenIdentifier: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: Record<string, string>;
  },
) {
  const now = Date.now();
  await ctx.db.insert("outreachAuditLog", {
    workspaceId: args.workspaceId,
    actorTokenIdentifier: args.actorTokenIdentifier,
    action: args.action,
    entityType: args.entityType,
    entityId: args.entityId,
    ...(args.details !== undefined ? { details: args.details } : {}),
    createdAt: now,
  });
}
