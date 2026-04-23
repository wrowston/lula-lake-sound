import {
  ServicesAndPricing,
  ServicesAndPricingSkeleton,
} from "@/components/services-pricing";
import type { MarketingFeatureFlags, PricingFlags } from "@/lib/site-settings";

interface MarketingPricingSectionProps {
  /**
   * Published or preview pricing payload. `undefined` means still loading (show
   * skeleton). `null` means unavailable (hide section).
   */
  readonly pricingFlags: PricingFlags | null | undefined;
  /**
   * When set, gates the block (from `getPublishedMarketingFeatureFlags` or preview).
   * If omitted, falls back to `flags.priceTabEnabled` for back-compat.
   */
  readonly marketingFeatureFlags?: MarketingFeatureFlags | null;
}

/**
 * Marketing-site pricing block. Visibility uses `marketingFeatureFlags.pricingSection`
 * when provided; otherwise `flags.priceTabEnabled`.
 */
export function MarketingPricingSection({
  pricingFlags,
  marketingFeatureFlags,
}: MarketingPricingSectionProps) {
  const loading = pricingFlags === undefined;
  const sectionOn =
    marketingFeatureFlags != null
      ? marketingFeatureFlags.pricingSection === true
      : pricingFlags != null && pricingFlags.flags.priceTabEnabled === true;
  const visible = loading || (pricingFlags !== null && sectionOn);

  if (!visible) {
    return null;
  }

  if (loading) {
    return <ServicesAndPricingSkeleton />;
  }

  const packages = pricingFlags.packages ?? [];

  return <ServicesAndPricing packages={packages} />;
}
