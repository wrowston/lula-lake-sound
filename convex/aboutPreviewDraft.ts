import { query } from "./_generated/server";
import { requireCmsOwner } from "./lib/auth";
import {
  materializePublicAbout,
  previewAboutFromScoped,
} from "./publicSettingsSnapshot";
import { getSectionMetaRow } from "./cmsMeta";

/**
 * Preview About copy for owner-only access. Resolves **draft** when present,
 * else published (same effective snapshot as the editor).
 *
 * Returns `null` for unauthenticated or non-owner callers — never leaks drafts.
 */
export const getPreviewAbout = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }

    const [snapshot, row] = await Promise.all([
      previewAboutFromScoped(ctx),
      getSectionMetaRow(ctx, "about"),
    ]);
    const materialized = await materializePublicAbout(ctx, snapshot);

    return {
      ...materialized,
      hasDraftChanges: row?.hasDraftChanges ?? false,
    };
  },
});
