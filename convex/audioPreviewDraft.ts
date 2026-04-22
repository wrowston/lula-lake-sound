import { query } from "./_generated/server";
import { loadAudioTracks, materializeAudioTracks } from "./audioTracks";
import { requireCmsOwner } from "./lib/auth";

/**
 * Owner-only preview of audio portfolio. Returns draft rows when there are
 * unpublished changes, otherwise published. Returns `null` for non-owners.
 */
export const getPreviewAudioTracks = query({
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
      .query("audioTrackMeta")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();

    const hasDraftChanges = meta?.hasDraftChanges ?? false;
    const rows = await loadAudioTracks(
      ctx,
      hasDraftChanges ? "draft" : "published",
    );
    const tracks = await materializeAudioTracks(ctx, rows);

    return {
      tracks: tracks.filter((track) => track.url !== null),
      hasDraftChanges,
    };
  },
});
