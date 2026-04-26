import { query } from "./_generated/server";
import { requireCmsOwner } from "./lib/auth";
import { FAQ_DEFAULTS } from "./cmsShared";
import { getSectionMetaRow } from "./cmsMeta";
import { loadFaqTree, materializeFaqCategories } from "./faqTree";

/**
 * Owner-only homepage FAQ preview: draft scope when it has categories, when
 * `hasDraftChanges` marks a pending delete-all over published content (mirrors
 * `pricingPreviewDraft`), else published.
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

    const [row, draft, published] = await Promise.all([
      getSectionMetaRow(ctx, "faq"),
      loadFaqTree(ctx, "draft"),
      loadFaqTree(ctx, "published"),
    ]);
    const tree =
      draft.categories.length > 0 ||
      ((row?.hasDraftChanges ?? false) && published.categories.length > 0)
        ? draft
        : published;
    const categories =
      tree.categories.length > 0
        ? materializeFaqCategories(tree)
        : FAQ_DEFAULTS.categories;

    return {
      categories,
      hasDraftChanges: row?.hasDraftChanges ?? false,
    };
  },
});
