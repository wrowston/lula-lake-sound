import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireCmsOwner } from "../lib/auth";

/**
 * Owner-only: resolve signed URLs for About team headshots in the admin editor.
 */
export const getTeamHeadshotUrls = query({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, args) => {
    await requireCmsOwner(ctx);
    return await Promise.all(
      args.storageIds.map(async (storageId) => ({
        storageId,
        url: await ctx.storage.getUrl(storageId),
      })),
    );
  },
});
