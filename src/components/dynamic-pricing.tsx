import {
  ServicesAndPricing,
  ServicesAndPricingSkeleton,
} from "@/components/services-pricing";
import type { PricingFlags } from "@/lib/site-settings";

interface MarketingPricingSectionProps {
  /**
   * Published or preview pricing payload. `undefined` means still loading (show
   * skeleton). `null` means unavailable (hide section). Loaded data respects
   * `flags.priceTabEnabled` for visibility.
   */
  readonly pricingFlags: PricingFlags | null | undefined;
}

/**
 * Marketing-site pricing block: respects `priceTabEnabled`, loading skeletons,
 * and empty package state. Uses a single Convex-shaped payload (flags +
 * packages) from `getPublishedPricingFlags` or `getPreviewPricingFlags`.
 */
export function MarketingPricingSection({
  pricingFlags,
}: MarketingPricingSectionProps) {
  const loading = pricingFlags === undefined;
  const visible =
    loading ||
    (pricingFlags !== null && pricingFlags.flags.priceTabEnabled === true);

  if (!visible) {
    return null;
  }

  if (loading) {
    return <ServicesAndPricingSkeleton />;
  }

  const packages = pricingFlags.packages ?? [];

  return <ServicesAndPricing packages={packages} />;
}
