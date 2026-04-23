import {
  ServicesAndPricing,
  ServicesAndPricingSkeleton,
} from "@/components/services-pricing";
import {
  type MarketingFeatureFlags,
  type PricingFlags,
  isHomepagePricingSectionEnabled,
  previewHasActivePricingPackages,
} from "@/lib/site-settings";

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
  /** When true (owner `/preview`), show block if draft has active packages. */
  readonly isPreviewRoute?: boolean;
}

/**
 * Marketing-site pricing block. Visibility uses `marketingFeatureFlags.pricingSection`
 * when provided; otherwise `flags.priceTabEnabled`.
 */
export function MarketingPricingSection({
  pricingFlags,
  marketingFeatureFlags,
  isPreviewRoute = false,
}: MarketingPricingSectionProps) {
  const loading = pricingFlags === undefined;
  const previewCatalogOn =
    isPreviewRoute && previewHasActivePricingPackages(pricingFlags);
  const sectionOn =
    marketingFeatureFlags != null
      ? isHomepagePricingSectionEnabled(marketingFeatureFlags) ||
          previewCatalogOn
      : (pricingFlags != null &&
          pricingFlags.flags.priceTabEnabled === true) ||
          previewCatalogOn;
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
