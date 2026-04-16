import { v } from "convex/values";

/**
 * Shared validators imported by `schema.ts` and mutations so args stay in sync.
 * See `docs/cms-publish.md` for how to add a new section.
 *
 * Sections today:
 * - `settings`  — site metadata (title, description; extend as CMS grows).
 * - `pricing`   — feature flags that govern pricing surfaces on the marketing site.
 */
export const siteFlagsValidator = v.object({
  priceTabEnabled: v.boolean(),
});

export const siteMetadataValidator = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
});

/**
 * "settings" section snapshot — site-wide metadata.
 *
 * `flags` is retained as optional purely to keep legacy rows (pre-split)
 * schema-valid. New writes from the settings editor never populate it;
 * pricing flags live in the `pricing` section. Remove after legacy rows
 * have been migrated.
 */
export const settingsContentValidator = v.object({
  metadata: v.optional(siteMetadataValidator),
  /** @deprecated Moved to the `pricing` section. Kept optional for legacy rows. */
  flags: v.optional(siteFlagsValidator),
});

/** "pricing" section snapshot — flags only. */
export const pricingContentValidator = v.object({
  flags: siteFlagsValidator,
});

/** Any section's snapshot payload — discriminated at runtime by the row's `section`. */
export const cmsSnapshotValidator = v.union(
  settingsContentValidator,
  pricingContentValidator,
);

export const cmsSectionValidator = v.union(
  v.literal("settings"),
  v.literal("pricing"),
);
