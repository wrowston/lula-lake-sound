import { query } from "./_generated/server";
import { requireCmsOwner } from "./lib/auth";
import { FAQ_DEFAULTS } from "./cmsShared";
import { getSectionMetaRow } from "./cmsMeta";
import { loadFaqTree, materializeFaqCategories } from "./faqTree";

/**
 * Owner-only homepage FAQ preview: draft scope when it has content, else
 * published (same effective tree as the admin editor).
 */
export const getPreviewFaq = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }

    const draft = await loadFaqTree(ctx, "draft");
    const published = await loadFaqTree(ctx, "published");
    const tree =
      draft.categories.length > 0 ? draft : published;
    const categories =
      tree.categories.length > 0
        ? materializeFaqCategories(tree)
        : FAQ_DEFAULTS.categories;

    const row = await getSectionMetaRow(ctx, "faq");

    return {
      categories,
      hasDraftChanges: row?.hasDraftChanges ?? false,
    };
  },
});
