import { v } from "convex/values";

/**
 * Shared validators imported by `schema.ts` and mutations so args stay in sync.
 * See `docs/cms-publish.md` for how to add a new section.
 */
export const siteFlagsValidator = v.object({
  priceTabEnabled: v.boolean(),
});

export const siteMetadataValidator = v.object({
  /** Shared site copy / SEO-style fields; extend as CMS grows. */
  title: v.optional(v.string()),
  description: v.optional(v.string()),
});

/** One "slice" of site settings (used as both draft and published snapshot). */
export const settingsContentValidator = v.object({
  flags: siteFlagsValidator,
  metadata: v.optional(siteMetadataValidator),
});

export const cmsSectionValidator = v.literal("settings");
