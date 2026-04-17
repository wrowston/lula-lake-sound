import { v } from "convex/values";

/**
 * Shared validators imported by `schema.ts` and mutations so args stay in sync.
 * See `docs/cms-publish.md` for how to add a new section.
 *
 * Sections today:
 * - `settings`  — site metadata (title, description; extend as CMS grows).
 * - `pricing`   — feature flags and package/rate catalog that govern pricing surfaces.
 */
export const siteFlagsValidator = v.object({
  priceTabEnabled: v.boolean(),
});

export const siteMetadataValidator = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
});

/**
 * Allowed billing cadences for a pricing package. `hourly` and `six_hour_block`
 * cover the studio's most common rate shapes; additional presets are included
 * so mixing / mastering / production rows can describe their pricing naturally.
 *
 * The `"custom"` variant lets the owner author any cadence string via the
 * package's `unitLabel` field — the UI surfaces it as a "Custom…" option that
 * pairs with the free-form unit label input, and publish validation requires
 * `unitLabel` to be non-empty whenever `billingCadence === "custom"`.
 *
 * Consumers should render a human label via `billingCadenceLabel` in
 * `cmsShared.ts` (which returns the `unitLabel` for custom rows) or bypass it
 * entirely by reading `unitLabel` directly.
 */
export const pricingBillingCadenceValidator = v.union(
  v.literal("hourly"),
  v.literal("six_hour_block"),
  v.literal("daily"),
  v.literal("per_song"),
  v.literal("per_album"),
  v.literal("per_project"),
  v.literal("flat"),
  v.literal("custom"),
);

/**
 * Pricing package / rate row authored in the CMS. Stored inline on the
 * `pricing` section snapshot so publish remains a single atomic patch.
 *
 * - `id` is a stable client-generated identifier (e.g. `crypto.randomUUID()`)
 *   used so the editor can track rows across edits and reorders without
 *   depending on array position. It is NOT a Convex document id.
 * - `priceCents` is an integer so we never have to deal with floating-point
 *   rounding on the display side. Currency format is left to the client.
 * - `unitLabel` optionally overrides the cadence's default display label
 *   (e.g. "per mixed song").
 * - `features` is an ordered bullet list rendered in the public card UI.
 */
export const pricingPackageValidator = v.object({
  id: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  priceCents: v.number(),
  currency: v.string(),
  billingCadence: pricingBillingCadenceValidator,
  unitLabel: v.optional(v.string()),
  highlight: v.boolean(),
  sortOrder: v.number(),
  isActive: v.boolean(),
  features: v.optional(v.array(v.string())),
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

/**
 * "pricing" section snapshot.
 *
 * `packages` is optional for back-compat with legacy rows that only stored the
 * feature `flags`; consumers should treat `undefined` as an empty array.
 */
export const pricingContentValidator = v.object({
  flags: siteFlagsValidator,
  packages: v.optional(v.array(pricingPackageValidator)),
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
