import { v } from "convex/values";
import { query } from "../_generated/server";
import { resolveOutreachWorkspace } from "../lib/outreachAuth";

const LIST_LIMIT = 100;

export const listRecent = query({
  args: {
    workspaceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { workspaceId } = await resolveOutreachWorkspace(ctx, args.workspaceId);

    return await ctx.db
      .query("outreachAuditLog")
      .withIndex("by_workspaceId_and_createdAt", (q) =>
        q.eq("workspaceId", workspaceId),
      )
      .order("desc")
      .take(LIST_LIMIT);
  },
});
