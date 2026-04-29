import { query } from "./_generated/server";
import { loadVideos, materializeVideos } from "./videos";
import { requireCmsOwner } from "./lib/auth";

/**
 * Owner-only preview of CMS videos. Resolves draft rows when unpublished video
 * changes exist; otherwise mirrors the published marketing-site payload.
 */
export const getPreviewVideos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }

    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }

    const meta = await ctx.db
      .query("videoMeta")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();

    const hasDraftChanges = meta?.hasDraftChanges ?? false;
    const rows = await loadVideos(
      ctx,
      hasDraftChanges ? "draft" : "published",
    );

    return {
      videos: await materializeVideos(ctx, rows),
      hasDraftChanges,
    };
  },
});
