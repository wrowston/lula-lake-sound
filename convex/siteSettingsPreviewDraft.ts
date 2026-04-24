import { query } from "./_generated/server";
import { requireCmsOwner } from "./lib/auth";
import { SETTINGS_DEFAULTS } from "./cmsShared";
import { loadSettingsContent } from "./settingsTree";
import { getSectionMetaRow } from "./cmsMeta";

/**
 * Preview site metadata for owner-only access. Resolves **draft** when
 * present, else published (same effective snapshot as the editor).
 *
 * Returns `null` for unauthenticated or non-owner callers — never leaks
 * drafts.
 */
export const getPreviewSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }

    const [metaRow, draft, published] = await Promise.all([
      getSectionMetaRow(ctx, "settings"),
      loadSettingsContent(ctx, "draft"),
      loadSettingsContent(ctx, "published"),
    ]);

    const source = draft ?? published;
    const defaults = SETTINGS_DEFAULTS.metadata ?? {
      title: "",
      description: "",
    };

    return {
      metadata: {
        title: source?.title ?? defaults.title,
        description: source?.description ?? defaults.description,
      },
      hasDraftChanges: metaRow?.hasDraftChanges ?? false,
    };
  },
});
