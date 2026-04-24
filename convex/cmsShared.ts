import type { Infer } from "convex/values";
import type {
  aboutBlockValidator,
  aboutContentValidator,
  aboutTeamMemberValidator,
  cmsSectionValidator,
  marketingFeatureFlagsSnapshotValidator,
  pricingBillingCadenceValidator,
  pricingContentValidator,
  pricingPackageValidator,
  settingsContentValidator,
} from "./schema.shared";

export type CmsSection = Infer<typeof cmsSectionValidator>;

/**
 * @deprecated Represents the pre-refactor `publishedSnapshot`/`draftSnapshot`
 * JSON blob on `cmsSections`. Kept so the one-shot migration can type the
 * legacy payloads it unpacks. New code reads content from the per-section
 * scoped tables.
 */
export type CmsSnapshot =
  | Infer<typeof settingsContentValidator>
  | Infer<typeof pricingContentValidator>
  | Infer<typeof aboutContentValidator>;

export type SettingsSnapshot = Infer<typeof settingsContentValidator>;
export type PricingSnapshot = Infer<typeof pricingContentValidator>;
export type PricingPackage = Infer<typeof pricingPackageValidator>;
export type PricingBillingCadence = Infer<typeof pricingBillingCadenceValidator>;
export type AboutSnapshot = Infer<typeof aboutContentValidator>;
export type AboutBlock = Infer<typeof aboutBlockValidator>;
export type AboutTeamMember = Infer<typeof aboutTeamMemberValidator>;
export type MarketingFeatureFlagsSnapshot = Infer<
  typeof marketingFeatureFlagsSnapshotValidator
>;

/** Team row as returned to anonymous public callers (no raw storage id). */
export type PublicAboutTeamMember = {
  id: string;
  name: string;
  title: string;
  imageUrl: string | null;
};

/**
 * Published About payload for marketing routes (sanitized + image URLs).
 *
 * `heroImageStorageId` is stripped (we never leak storage ids to anonymous
 * callers); the resolved signed URL lives on `heroImageUrl` instead. When
 * the storage blob has been deleted or was never set, `heroImageUrl` is
 * `null` — the public renderer should fall back to a baked-in default.
 */
export type PublicAboutSnapshot = Omit<
  AboutSnapshot,
  "teamMembers" | "heroImageStorageId"
> & {
  teamMembers?: PublicAboutTeamMember[];
  heroImageUrl?: string | null;
};

/** Default site metadata for brand-new deployments (seed + fallback reads). */
export const SETTINGS_DEFAULTS: SettingsSnapshot = {
  metadata: {
    title: "Lula Lake Sound",
    description: "Music Production and Recording Services",
  },
};

/**
 * Default catalogue shipped with a brand-new deployment. Seeded onto the
 * published scope of `pricingPackages` so the marketing site renders
 * familiar rates before the first admin publish.
 */
export const DEFAULT_PRICING_PACKAGES: PricingPackage[] = [
  {
    id: "pkg_recording_hourly",
    name: "Recording — Hourly",
    description: "Pay-as-you-go tracking time with an engineer included.",
    priceCents: 6000,
    currency: "USD",
    billingCadence: "hourly",
    highlight: false,
    sortOrder: 0,
    isActive: true,
    features: [
      "Experienced engineer included",
      "Full analog and digital signal chain",
      "Comfortable lounge and kitchen",
    ],
  },
  {
    id: "pkg_recording_six_hour",
    name: "Recording — 6 Hour Block",
    description: "Half-day recording session at a discounted block rate.",
    priceCents: 30000,
    currency: "USD",
    billingCadence: "six_hour_block",
    unitLabel: "per 6-hour block",
    highlight: true,
    sortOrder: 1,
    isActive: true,
    features: [
      "Six continuous hours in the live room",
      "Engineer + setup included",
      "Ideal for EP / single tracking days",
    ],
  },
  {
    id: "pkg_mixing",
    name: "Mixing & Mastering",
    description: "Polish tracked material into a release-ready mix + master.",
    priceCents: 15000,
    currency: "USD",
    billingCadence: "per_song",
    highlight: false,
    sortOrder: 2,
    isActive: true,
    features: [
      "Professional mixing per song",
      "Mastering included",
      "Stems provided on delivery",
    ],
  },
];

/**
 * @deprecated Pre-split default — `flags.priceTabEnabled` is no longer read.
 * Kept so older callers that import `PRICING_DEFAULTS` keep compiling; the
 * packages array is still the default catalogue.
 */
export const PRICING_DEFAULTS: PricingSnapshot = {
  flags: { priceTabEnabled: true },
  packages: DEFAULT_PRICING_PACKAGES,
};

/**
 * @deprecated Kept for legacy-format migration code. New code reads each
 * flag from its owning `cmsSections.isEnabled` row (see `DEFAULT_IS_ENABLED`
 * in `cmsMeta.ts`).
 */
export const MARKETING_FEATURE_FLAGS_DEFAULTS: MarketingFeatureFlagsSnapshot = {
  aboutPage: false,
  recordingsPage: false,
  pricingSection: true,
};

/**
 * Default About page copy shipped with a brand-new deployment. Seeded onto
 * the published scope of `aboutContent` + `aboutHighlights` + `aboutTeamMembers`
 * so the public route renders before the owner has published.
 */
export const ABOUT_DEFAULTS: AboutSnapshot = {
  heroTitle: "About Lula Lake Sound",
  heroSubtitle: "A creative space for music production and recording.",
  body: [
    {
      type: "paragraph",
      text: "Lula Lake Sound is a studio focused on helping artists capture the sound they hear in their heads.",
    },
  ],
  pullQuote: "The mountain doesn't rush. Neither should the music.",
  highlights: [],
  seoTitle: "",
  seoDescription: "",
  teamMembers: [],
};

/**
 * @deprecated Default snapshot shape per section — used only by the legacy
 * `saveDraft` compatibility shim to synthesise defaults for brand-new rows.
 */
export function defaultSnapshotForSection(section: CmsSection): CmsSnapshot {
  switch (section) {
    case "settings":
      return SETTINGS_DEFAULTS;
    case "pricing":
      return PRICING_DEFAULTS;
    case "about":
      return ABOUT_DEFAULTS;
    case "recordings":
      // `recordings` has no content table; return an empty about-shaped
      // placeholder so the union typechecks. Nothing reads this branch.
      return { ...ABOUT_DEFAULTS };
  }
}

/**
 * Default user-facing label for each billing cadence.
 *
 * For the `"custom"` variant, callers should pass the package's `unitLabel`
 * directly — this helper returns an empty string as a sentinel so ignoring
 * the custom case is visible (never a plausible-but-wrong label).
 */
export function billingCadenceLabel(cadence: PricingBillingCadence): string {
  switch (cadence) {
    case "hourly":
      return "per hour";
    case "six_hour_block":
      return "per 6-hour block";
    case "daily":
      return "per day";
    case "per_song":
      return "per song";
    case "per_album":
      return "per album";
    case "per_project":
      return "per project";
    case "flat":
      return "flat rate";
    case "custom":
      return "";
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (a === null || b === null) {
    return a === b;
  }
  if (typeof a !== "object") {
    return false;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  if (Array.isArray(b)) {
    return false;
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
  for (const k of keys) {
    if (!deepEqual(ao[k], bo[k])) {
      return false;
    }
  }
  return true;
}

/** Deep equality for section snapshots without relying on `JSON.stringify` key order. */
export function cmsSnapshotsEqual(
  a: CmsSnapshot | undefined,
  b: CmsSnapshot | undefined,
): boolean {
  return deepEqual(a, b);
}

/**
 * Legacy alias kept so existing imports keep working.
 * @deprecated Use {@link cmsSnapshotsEqual}.
 */
export const settingsSnapshotsEqual = cmsSnapshotsEqual;
