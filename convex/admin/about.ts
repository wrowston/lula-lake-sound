/**
 * Owner-only helpers for the About admin editor that aren't tied to
 * team headshots or the studio gallery.
 */
import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireCmsOwner } from "../lib/auth";

/**
 * Resolve a signed URL for the About hero image storage id.
 *
 * The hero image can point to either a gallery photo's storageId or a
 * bespoke upload made directly from the About editor (not added to the
 * public studio gallery). Both cases live in Convex `_storage`, so a
 * simple URL lookup is enough — we just need an owner-gated query so
 * the admin surface can render a preview for uploads that don't appear
 * in the gallery picker. Returns `null` if the blob was deleted.
 */
export const getHeroImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireCmsOwner(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});
