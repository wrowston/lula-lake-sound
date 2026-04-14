import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdminIdentity } from "../lib/auth";
import { SITE_SETTINGS_KEY } from "../siteSettingsConstants";

const siteFlagsValidator = v.object({
  priceTabEnabled: v.boolean(),
});

const siteMetadataValidator = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
});

const draftSliceValidator = v.object({
  flags: siteFlagsValidator,
  metadata: v.optional(siteMetadataValidator),
});

/**
 * Full site settings row for the admin UI (includes optional draft).
 */
export const getForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdminIdentity(ctx);
    return await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", SITE_SETTINGS_KEY))
      .unique();
  },
});

/**
 * Replace or create the draft slice (admin only).
 */
export const setDraft = mutation({
  args: { draft: draftSliceValidator },
  handler: async (ctx, args) => {
    const identity = await requireAdminIdentity(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", SITE_SETTINGS_KEY))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        draft: args.draft,
        updatedAt: now,
        updatedBy: identity.subject,
      });
      return existing._id;
    }

    return await ctx.db.insert("siteSettings", {
      key: SITE_SETTINGS_KEY,
      updatedAt: now,
      updatedBy: identity.subject,
      published: args.draft,
      draft: args.draft,
    });
  },
});

/**
 * Copy current `draft` onto `published` and clear `draft` (admin only).
 */
export const publishDraft = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAdminIdentity(ctx);
    const row = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", SITE_SETTINGS_KEY))
      .unique();

    if (!row) {
      throw new Error("Site settings not found");
    }
    if (!row.draft) {
      throw new Error("No draft to publish");
    }

    await ctx.db.patch(row._id, {
      published: row.draft,
      draft: undefined,
      updatedAt: Date.now(),
      updatedBy: identity.subject,
    });
    return row._id;
  },
});
