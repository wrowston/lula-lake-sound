import { v } from "convex/values";

/**
 * Shared validators imported by `schema.ts` and mutations so args stay in sync.
 * See `docs/cms-publish.md` for how to add a new section.
 *
 * Sections today:
 * - `settings`   — site metadata (title, description; extend as CMS grows).
 * - `pricing`    — pricing package catalogue that drives the public pricing block.
 * - `about`      — About page hero copy, body block array, optional highlights, SEO meta, optional team headshots.
 * - `recordings` — public recordings page visibility flag; audio content lives in `audioTracks`.
 * - `faq`        — homepage FAQ (categories → questions → answers); scoped rows in `faqCategories` / `faqQuestions`.
 * - `amenitiesNearby` — homepage "Local Favorites" cards (`amenitiesNearbyCopy` + `amenitiesNearbyItems`).
 *
 * Content for each section (when any) lives in dedicated scoped tables using the
 * gear/photos pattern (`scope: "draft" | "published"` column); `cmsSections`
 * itself now only holds per-section metadata — publish bookkeeping and the
 * `isEnabled` visibility flag.
 */

/**
 * @deprecated Legacy flags object kept until the migration strips it from
 * existing `pricing` snapshots. New code reads visibility from
 * `cmsSections.isEnabled`; `priceTabEnabled` is no longer authored.
 */
export const siteFlagsValidator = v.object({
  priceTabEnabled: v.boolean(),
  recordingsPageEnabled: v.optional(v.boolean()),
});

/**
 * @deprecated Pre-split marketing flags snapshot; kept so the legacy
 * `marketingFeatureFlags` table continues to validate until the migration
 * removes it. New code reads per-section flags from `cmsSections.isEnabled`.
 */
export const marketingFeatureFlagsSnapshotValidator = v.object({
  aboutPage: v.boolean(),
  recordingsPage: v.boolean(),
  pricingSection: v.boolean(),
});

/** @deprecated Same idea as `siteFlagsValidator`; only tolerates legacy rows. */
export const legacySiteFlagsValidator = v.object({
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
 * Pricing package / rate row authored in the CMS. Kept as a shape validator
 * (no Convex table) so admin mutations that still accept a whole-snapshot
 * payload can decompose it into `pricingPackages` rows. Storage uses
 * `pricingPackageRowValidator` with an explicit `scope` column.
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
 * @deprecated `settings` content now lives in the `settingsContent` scoped table.
 * Kept so pre-migration `publishedSnapshot`/`draftSnapshot` blobs still validate.
 */
export const settingsContentValidator = v.object({
  metadata: v.optional(siteMetadataValidator),
  flags: v.optional(legacySiteFlagsValidator),
});

/**
 * @deprecated `pricing` content now lives in the `pricingPackages` scoped table;
 * the visibility flag now lives on `cmsSections.isEnabled`.
 */
export const pricingContentValidator = v.object({
  flags: siteFlagsValidator,
  packages: v.optional(v.array(pricingPackageValidator)),
});

/**
 * Ordered block that makes up the About page body.
 *
 * We intentionally pick a **block array of plain text** over a raw markdown
 * string so public renderers never have to parse or sanitize HTML — each
 * block's `text` goes into a React text node (which auto-escapes) inside a
 * fixed element chosen by `type`. This satisfies the "no script injection"
 * acceptance criteria without a sanitization pipeline.
 *
 * If richer formatting is needed later, switch to a markdown string field
 * and run it through `rehype-sanitize` in the public loader.
 */
export const aboutBlockValidator = v.object({
  type: v.union(v.literal("paragraph"), v.literal("heading")),
  text: v.string(),
});

/** Team / staff row for the About page (headshot in Convex file storage). */
export const aboutTeamMemberValidator = v.object({
  id: v.string(),
  name: v.string(),
  title: v.string(),
  bio: v.optional(v.string()),
  /** Required to publish; optional while drafting so rows can be added before upload. */
  storageId: v.optional(v.id("_storage")),
});

/** One FAQ answer row as authored in admin / snapshot payloads (plain text). */
export const faqQuestionValidator = v.object({
  stableId: v.string(),
  question: v.string(),
  answer: v.string(),
});

/** One FAQ category with ordered questions. */
export const faqCategoryValidator = v.object({
  stableId: v.string(),
  title: v.string(),
  questions: v.array(faqQuestionValidator),
});

/**
 * Homepage FAQ snapshot shape (admin `saveDraft` + `getSection` overlay).
 */
export const faqContentValidator = v.object({
  categories: v.array(faqCategoryValidator),
});

/**
 * @deprecated `about` content now lives in `aboutContent` + `aboutHighlights`
 * + `aboutTeamMembers` scoped tables. This validator remains only so that
 * pre-migration `cmsSections.publishedSnapshot` blobs keep validating.
 */
export const aboutContentValidator = v.object({
  published: v.optional(v.boolean()),
  heroImageStorageId: v.optional(v.id("_storage")),
  heroTitle: v.string(),
  heroSubtitle: v.optional(v.string()),
  bodyHtml: v.optional(v.string()),
  body: v.array(aboutBlockValidator),
  pullQuote: v.optional(v.string()),
  highlights: v.optional(v.array(v.string())),
  seoTitle: v.optional(v.string()),
  seoDescription: v.optional(v.string()),
  teamMembers: v.optional(v.array(aboutTeamMemberValidator)),
});

export const amenitiesNearbyEntryValidator = v.object({
  stableId: v.string(),
  name: v.string(),
  type: v.string(),
  description: v.string(),
  website: v.string(),
});

export const amenitiesNearbySnapshotValidator = v.object({
  eyebrow: v.optional(v.string()),
  heading: v.optional(v.string()),
  intro: v.optional(v.string()),
  rows: v.array(amenitiesNearbyEntryValidator),
});

/**
 * Union of section snapshot payloads (admin `saveDraft` / `getSection` content).
 */
export const cmsSnapshotValidator = v.union(
  settingsContentValidator,
  pricingContentValidator,
  aboutContentValidator,
  faqContentValidator,
  amenitiesNearbySnapshotValidator,
);

/**
 * The set of active sections tracked in `cmsSections`. `recordings` was added
 * when flags moved off the `marketingFeatureFlags` singleton and onto
 * `cmsSections` rows; its visibility is flag-only while audio content is stored
 * separately.
 */
export const cmsSectionValidator = v.union(
  v.literal("settings"),
  v.literal("pricing"),
  v.literal("about"),
  v.literal("recordings"),
  v.literal("faq"),
  v.literal("amenitiesNearby"),
  v.literal("photos"),
);

/**
 * Table-level validator for `cmsSections.section`.
 *
 * Some deployments have a stale `"photos"` row from before gallery publishing
 * moved fully to `galleryPhotoMeta`. Keep the row schema tolerant so Convex can
 * validate existing data, but keep public/admin function args on
 * `cmsSectionValidator` so new CMS section mutations cannot target it.
 */
export const cmsSectionRowValidator = v.union(
  cmsSectionValidator,
  v.literal("photos"),
);

/**
 * Scope discriminator shared across all CMS content tables (and the existing
 * gear / gallery tables). Publish copies the tree from `"draft"` → `"published"`
 * inside a single mutation; discard copies the other direction.
 */
export const cmsScopeValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
);

/** About page scalar fields — one row per scope (two rows total). */
export const aboutContentRowValidator = {
  scope: cmsScopeValidator,
  heroImageStorageId: v.optional(v.id("_storage")),
  heroTitle: v.string(),
  heroSubtitle: v.optional(v.string()),
  bodyHtml: v.optional(v.string()),
  bodyBlocks: v.optional(v.array(aboutBlockValidator)),
  pullQuote: v.optional(v.string()),
  seoTitle: v.optional(v.string()),
  seoDescription: v.optional(v.string()),
} as const;

/** About page highlight bullets — one row per bullet. */
export const aboutHighlightRowValidator = {
  scope: cmsScopeValidator,
  stableId: v.string(),
  text: v.string(),
  sort: v.number(),
} as const;

/** About page team-member headshots — one row per person. */
export const aboutTeamMemberRowValidator = {
  scope: cmsScopeValidator,
  stableId: v.string(),
  name: v.string(),
  title: v.string(),
  bio: v.optional(v.string()),
  storageId: v.optional(v.id("_storage")),
  sort: v.number(),
} as const;

/** Pricing package — one row per package catalogue entry. */
export const pricingPackageRowValidator = {
  scope: cmsScopeValidator,
  stableId: v.string(),
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
} as const;

/** Site-wide metadata — one row per scope (two rows total). */
export const settingsContentRowValidator = {
  scope: cmsScopeValidator,
  title: v.optional(v.string()),
  description: v.optional(v.string()),
} as const;

/** FAQ category heading — one row per category per scope. */
export const faqCategoryRowValidator = {
  scope: cmsScopeValidator,
  stableId: v.string(),
  title: v.string(),
  sort: v.number(),
} as const;

/** FAQ Q&A — one row per question per scope. */
export const faqQuestionRowValidator = {
  scope: cmsScopeValidator,
  stableId: v.string(),
  categoryStableId: v.string(),
  sort: v.number(),
  question: v.string(),
  answer: v.string(),
} as const;

/** Optional section chrome for homepage amenities block — one row per scope. */
export const amenitiesNearbyCopyRowValidator = {
  scope: cmsScopeValidator,
  eyebrow: v.optional(v.string()),
  heading: v.optional(v.string()),
  intro: v.optional(v.string()),
} as const;

/** One amenity card per row; ordered by `sort`. */
export const amenitiesNearbyItemRowValidator = {
  scope: cmsScopeValidator,
  stableId: v.string(),
  name: v.string(),
  type: v.string(),
  description: v.string(),
  website: v.string(),
  sort: v.number(),
} as const;

/** Draft vs published rows in `gearCategories` / `gearItems` (INF-86). */
export const gearScopeValidator = cmsScopeValidator;

/**
 * CMS video embed/upload providers (INF-92). Only these values may drive embed UI;
 * arbitrary iframe URLs are rejected — see `videoUrls.ts` and `docs/cms-videos.md`.
 */
export const videoProviderValidator = v.union(
  v.literal("youtube"),
  v.literal("vimeo"),
  v.literal("mux"),
  v.literal("upload"),
);

/**
 * One row per studio video in draft or published scope (same pattern as `galleryPhotos`).
 */
export const videoRowValidator = {
  scope: cmsScopeValidator,
  stableId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  sortOrder: v.number(),
  provider: videoProviderValidator,
  /** Provider-native id when applicable (e.g. YouTube video id, Vimeo numeric id). */
  externalId: v.optional(v.string()),
  /**
   * HTTPS playback URL when stored explicitly (e.g. Mux `.m3u8`); upload rows may omit and use `videoStorageId` only.
   */
  playbackUrl: v.optional(v.string()),
  /** Uploaded video blob (`provider === "upload"`). */
  videoStorageId: v.optional(v.id("_storage")),
  thumbnailStorageId: v.optional(v.id("_storage")),
  thumbnailUrl: v.optional(v.string()),
  durationSec: v.optional(v.number()),
} as const;

/**
 * Item specs: markdown string or structured key/value pairs.
 */
export const gearSpecsValidator = v.union(
  v.object({ kind: v.literal("markdown"), text: v.string() }),
  v.object({
    kind: v.literal("kv"),
    pairs: v.array(v.object({ key: v.string(), value: v.string() })),
  }),
);
