/**
 * Published pricing data surfaced to the public marketing site.
 *
 * - Homepage pricing **block** visibility is governed by
 *   `getPublishedMarketingFeatureFlags` (`pricingSection`), not `priceTabEnabled`.
 * - `flags.priceTabEnabled` is retained on the `pricing` CMS row for legacy reads.
 * - `packages` is the catalog authored in the CMS.
 */
export type PricingPackage = {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  billingCadence:
    | "hourly"
    | "six_hour_block"
    | "daily"
    | "per_song"
    | "per_album"
    | "per_project"
    | "flat"
    | "custom";
  unitLabel?: string;
  highlight: boolean;
  sortOrder: number;
  isActive: boolean;
  features?: string[];
};

export type PricingFlags = {
  flags: { priceTabEnabled: boolean };
  packages?: PricingPackage[];
};

/** Published marketing page/section visibility (Convex `cmsSections` rows). */
export type MarketingFeatureFlags = {
  aboutPage: boolean;
  recordingsPage: boolean;
  pricingSection: boolean;
  /** Public `/gallery` page + "Gallery" nav; distinct from per-photo `showInGallery`. */
  galleryPage: boolean;
};

/** Conservative defaults when Convex marketing flags are unavailable (error UI). */
export const DEFAULT_MARKETING_FEATURE_FLAGS: MarketingFeatureFlags = {
  aboutPage: false,
  recordingsPage: true,
  pricingSection: true,
  galleryPage: true,
};

/**
 * When `false`, `/gallery` 404s and the Gallery nav item is hidden.
 * Missing `galleryPage` is treated as on (matches `DEFAULT_IS_ENABLED.photos`).
 */
export function isGalleryPageEnabled(
  flags: MarketingFeatureFlags | null | undefined,
): boolean {
  if (flags == null) return false;
  return flags.galleryPage !== false;
}

/**
 * Homepage pricing block + primary-nav "Pricing" link.
 * Missing `pricingSection` is treated as on — matches Convex defaults and avoids
 * `undefined === true` when query payloads omit keys that were undefined.
 */
export function isHomepagePricingSectionEnabled(
  flags: MarketingFeatureFlags | null | undefined,
): boolean {
  if (flags == null) return false;
  return flags.pricingSection !== false;
}

/** Owner `/preview` — show pricing block if draft catalog has any active package. */
export function previewHasActivePricingPackages(
  pricingFlags: PricingFlags | null | undefined,
): boolean {
  return (
    pricingFlags != null &&
    (pricingFlags.packages?.some((p) => p.isActive) ?? false)
  );
}

/**
 * Default display label for each billing cadence.
 *
 * Re-exported from `convex/cmsShared.ts` so the convex backend tests and the
 * Next.js frontend share a single source of truth for cadence labels.
 */
export { billingCadenceLabel } from "@convex/cmsShared";

/** Format a package's price as a short display string (`$60`, `$400.00`). */
export function formatPrice(
  priceCents: number,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
      minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
    }).format(priceCents / 100);
  } catch {
    return `${currency} ${(priceCents / 100).toFixed(2)}`;
  }
}
