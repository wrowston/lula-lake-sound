import { v } from "convex/values";

/**
 * Shared validators imported by `schema.ts` and mutations so args stay in sync.
 * See `docs/cms-publish.md` for how to add a new section.
 *
 * Sections today:
 * - `settings`  — site metadata (title, description; extend as CMS grows).
 * - `pricing`   — feature flags and package/rate catalog that govern pricing surfaces.
 * - `about`     — About page hero copy, body block array, optional highlights, SEO meta, optional team headshots.
 */
/** Pricing section flags (packages + homepage pricing block visibility). */
export const siteFlagsValidator = v.object({
  priceTabEnabled: v.boolean(),
  /**
   * Legacy (pre–`marketingFeatureFlags`). Still allowed on old rows; stripped by
   * `lib/legacyCmsFieldStrip` (see `ensureMarketingFeatureFlagsSeededHandler`).
   */
  recordingsPageEnabled: v.optional(v.boolean()),
});

/**
 * Published marketing page/section visibility. Lives on `marketingFeatureFlags` singleton.
 * Not stored on `about` or `pricing` section snapshots.
 */
export const marketingFeatureFlagsSnapshotValidator = v.object({
  aboutPage: v.boolean(),
  recordingsPage: v.boolean(),
  /** Homepage pricing / services section (formerly `flags.priceTabEnabled` on `pricing`). */
  pricingSection: v.boolean(),
});

/**
 * Optional legacy `flags` on the `settings` row (pre–pricing split). Only
 * `priceTabEnabled` — feature visibility for About/Recordings uses `marketingFeatureFlags`.
 */
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
  flags: v.optional(legacySiteFlagsValidator),
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
  /** Required to publish; optional while drafting so rows can be added before upload. */
  storageId: v.optional(v.id("_storage")),
});

/**
 * "about" section snapshot — About page copy (INF-70 / INF-98 / INF-46).
 *
 * Visibility for `/about` is on `marketingFeatureFlags` (`aboutPage`), not this snapshot.
 * - `heroImageStorageId` — optional Convex storage id of the cinematic hero
 *   image shown at the top of the public About page. The owner picks an
 *   already-uploaded photo from the studio gallery (INF-46 follow-up); the
 *   public renderer falls back to a baked-in image when this is absent or
 *   when the storage blob has been deleted (`storage.getUrl` → `null`).
 * - `heroTitle` — required display heading above the fold.
 * - `heroSubtitle` — optional supporting line.
 * - `bodyHtml` — rich-text body authored in the admin editor (Tiptap HTML
 *   serialization). Preferred over the legacy `body` blocks when present.
 *   Because Tiptap only emits nodes/marks from its fixed schema, the HTML is
 *   safe to render by construction, BUT the public renderer should still
 *   parse it into React elements through Tiptap's schema (never
 *   `dangerouslySetInnerHTML` with attacker-controlled `href="javascript:"`
 *   values — sanitize links there).
 * - `body` — legacy ordered paragraph / heading blocks (see
 *   `aboutBlockValidator`). Kept for back-compat so pre-INF-98 rows keep
 *   validating; new writes populate `bodyHtml` instead.
 * - `pullQuote` — INF-46 editorial pull quote rendered **below** the
 *   owner / studio-designer headshots on the Variant A layout.
 * - `highlights` — optional short bulleted callouts (e.g. key studio facts).
 * - `seoTitle` / `seoDescription` — optional overrides for page metadata;
 *   when blank the route should fall back to the `settings` section.
 * - `teamMembers` — optional ordered list of people (image, name, title).
 *   The public page renders the first two entries as owner / studio
 *   designer headshots in the Variant A layout.
 */
export const aboutContentValidator = v.object({
  /**
   * Legacy (pre–`marketingFeatureFlags.aboutPage`). Still allowed on old rows;
   * stripped by `lib/legacyCmsFieldStrip` (see `ensureMarketingFeatureFlagsSeededHandler`).
   */
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

/** Any section's snapshot payload — discriminated at runtime by the row's `section`. */
export const cmsSnapshotValidator = v.union(
  settingsContentValidator,
  pricingContentValidator,
  aboutContentValidator,
);

export const cmsSectionValidator = v.union(
  v.literal("settings"),
  v.literal("pricing"),
  v.literal("about"),
);

/** Draft vs published rows in `gearCategories` / `gearItems` (INF-86). */
export const gearScopeValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
);

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
