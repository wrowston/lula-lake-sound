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
    | "flat";
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

/** Default display label for each billing cadence. */
export function billingCadenceLabel(
  cadence: PricingPackage["billingCadence"],
): string {
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
  }
}

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
