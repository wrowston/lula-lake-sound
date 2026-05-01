import {
  ServicesAndPricing,
  ServicesAndPricingSkeleton,
} from "@/components/services-pricing";
import { PublicSectionNotice } from "@/components/public-section-notice";
import {
  type MarketingFeatureFlags,
  type PricingFlags,
  isHomepagePricingSectionEnabled,
  previewHasActivePricingPackages,
} from "@/lib/site-settings";
import { PUBLIC_CONVEX_QUERY_FAILED } from "@/lib/use-public-convex-query";

interface MarketingPricingSectionProps {
  /**
   * Published or preview pricing payload. `undefined` means still loading (show
   * skeleton). `null` means unavailable (hide section).
   * {@link PUBLIC_CONVEX_QUERY_FAILED} means the live subscription failed.
   */
  readonly pricingFlags:
    | PricingFlags
    | null
    | undefined
    | typeof PUBLIC_CONVEX_QUERY_FAILED;
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
  const subscriptionFailed = pricingFlags === PUBLIC_CONVEX_QUERY_FAILED;
  const pricingPayload =
    loading || subscriptionFailed
      ? undefined
      : pricingFlags === null
        ? null
        : pricingFlags;
  const previewCatalogOn =
    isPreviewRoute && previewHasActivePricingPackages(pricingPayload);
  const sectionOn =
    marketingFeatureFlags != null
      ? isHomepagePricingSectionEnabled(marketingFeatureFlags)
      : (pricingPayload != null &&
          pricingPayload.flags.priceTabEnabled === true) ||
          previewCatalogOn;
  const visible =
    loading ||
    (sectionOn &&
      (subscriptionFailed || pricingFlags !== undefined));

  if (!visible) {
    return null;
  }

  if (loading) {
    return <ServicesAndPricingSkeleton />;
  }

  if (subscriptionFailed) {
    return (
      <section
        id="services-pricing"
        className="relative overflow-hidden bg-washed-black px-6 py-28 md:py-40"
      >
        <div className="absolute inset-0 bg-texture-ink-wash opacity-55" />
        <div className="absolute inset-0 bg-texture-stone opacity-20" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <PublicSectionNotice title="Unable to load rates">
            We couldn&rsquo;t reach our booking system just now. Pricing will
            appear again when the connection is restored. You can still reach
            out below &mdash; we&rsquo;ll reply with current rates.
          </PublicSectionNotice>
        </div>
      </section>
    );
  }

  if (pricingPayload == null) {
    return null;
  }

  const packages = pricingPayload.packages ?? [];

  return <ServicesAndPricing packages={packages} />;
}
