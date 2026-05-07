import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireCmsOwner } from "../lib/auth";

/**
 * Grants another identity access to a shared outreach workspace. Restricted to
 * CMS owners when `CMS_OWNER_TOKEN_IDENTIFIERS` is configured; otherwise any
 * authenticated user (matches local-dev behavior elsewhere in this backend).
 */
export const grantMemberAccess = mutation({
  args: {
    workspaceId: v.string(),
    memberTokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCmsOwner(ctx);
    const now = Date.now();
    await ctx.db.insert("outreachWorkspaceMembers", {
      workspaceId: args.workspaceId,
      memberTokenIdentifier: args.memberTokenIdentifier,
      createdAt: now,
    });
    return null;
  },
});
