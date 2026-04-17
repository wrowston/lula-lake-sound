/**
 * Published pricing data surfaced to the public marketing site.
 *
 * - `flags.priceTabEnabled` gates whether the pricing section renders.
 * - `packages` is the catalog authored in the CMS. Empty until the owner has
 *   done a first publish on a brand-new deployment.
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
