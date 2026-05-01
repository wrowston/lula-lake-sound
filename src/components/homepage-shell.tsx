"use client";

import { usePathname } from "next/navigation";
import { api } from "../../convex/_generated/api";
import {
  PUBLIC_CONVEX_QUERY_FAILED,
  usePublicConvexQuery,
} from "@/lib/use-public-convex-query";
import { AmenitiesNearby } from "@/components/amenities-nearby";
import { ArtistInquiries } from "@/components/artist-inquiries";
import { MarketingPricingSection } from "@/components/dynamic-pricing";
import { EquipmentSpecs, type GearPayload } from "@/components/equipment-specs";
import { FAQ, type FaqCategoryProps } from "@/components/faq";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { SectionRail } from "@/components/section-rail";
import { SiteFooter } from "@/components/site-footer";
import type { PublishedAmenitiesNearby } from "@/components/amenities-nearby";
import { TheSpace, type GalleryPhoto } from "@/components/the-space";
import { useScrollAndReveal } from "@/hooks/use-scroll-and-reveal";
import {
  type MarketingFeatureFlags,
  type PricingFlags,
  isHomepagePricingSectionEnabled,
  isGalleryPageEnabled,
  previewHasActivePricingPackages,
} from "@/lib/site-settings";

interface HomepageShellProps {
  /** `undefined` while the client is still subscribing (preview only if not preloaded). */
  readonly pricingFlags:
    | PricingFlags
    | null
    | undefined
    | typeof PUBLIC_CONVEX_QUERY_FAILED;
  /**
   * `undefined` when not preloaded: live-subscribe. Pass from
   * `getPublishedMarketingFeatureFlags` or `getPreviewMarketingFeatureFlags`.
   */
  readonly marketingFeatureFlags?:
    | MarketingFeatureFlags
    | null
    | undefined
    | typeof PUBLIC_CONVEX_QUERY_FAILED;
  /**
   * Published (or preview) gear payload. `undefined` renders the skeleton;
   * `null` renders the graceful empty state.
   */
  readonly gear:
    | GearPayload
    | null
    | undefined
    | typeof PUBLIC_CONVEX_QUERY_FAILED;
  /** Published (or preview) gallery payload. */
  readonly photos:
    | GalleryPhoto[]
    | null
    | undefined
    | typeof PUBLIC_CONVEX_QUERY_FAILED;
  /** FAQ categories from Convex; `undefined` renders the loading state. */
  readonly faqCategories?:
    | readonly FaqCategoryProps[]
    | null
    | undefined
    | typeof PUBLIC_CONVEX_QUERY_FAILED;
  /** Amenities payload from Convex; `undefined` renders the loading state. */
  readonly amenities?:
    | PublishedAmenitiesNearby
    | null
    | undefined
    | typeof PUBLIC_CONVEX_QUERY_FAILED;
  readonly banner?: React.ReactNode;
}

export function HomepageShell({
  pricingFlags,
  marketingFeatureFlags: marketingFromProps,
  gear,
  photos,
  faqCategories,
  amenities,
  banner,
}: HomepageShellProps) {
  const { scrollY, containerRef } = useScrollAndReveal();
  const pathname = usePathname();
  const marketingFromPropsResolved =
    marketingFromProps === PUBLIC_CONVEX_QUERY_FAILED
      ? undefined
      : marketingFromProps;
  const isPreview =
    pathname === "/preview" || pathname.startsWith("/preview/");
  const aboutHref = isPreview ? "/preview/about" : "/about";
  const homeSectionBase = isPreview ? "/preview" : "/";
  const recordingsNavHref = isPreview ? "/preview/recordings" : "/recordings";

  const liveMarketing = usePublicConvexQuery(
    api.public.getPublishedMarketingFeatureFlags,
    {},
    {
      section: "home_marketing_flags",
      skip: marketingFromPropsResolved !== undefined,
    },
  );
  const marketing =
    marketingFromPropsResolved === undefined
      ? liveMarketing
      : marketingFromPropsResolved;
  const marketingForUi =
    marketing === PUBLIC_CONVEX_QUERY_FAILED ? undefined : marketing;

  // Nav-link visibility intentionally defaults to OFF while the marketing
  // flags are still loading. Otherwise a fresh page load briefly renders the
  // "Pricing" / "Recordings" / "About" tabs before Convex resolves and any
  // disabled tabs disappear — the visible flicker reported on the homepage.
  const showPricing =
    (marketingForUi != null &&
      isHomepagePricingSectionEnabled(marketingForUi)) ||
    (isPreview &&
      marketingForUi == null &&
      previewHasActivePricingPackages(
        pricingFlags === PUBLIC_CONVEX_QUERY_FAILED
          ? undefined
          : pricingFlags,
      ));
  const showAbout =
    marketingForUi != null && marketingForUi.aboutPage === true;
  const showRecordings =
    marketingForUi != null && marketingForUi.recordingsPage === true;
  const showGallery =
    marketingForUi != null && isGalleryPageEnabled(marketingForUi);

  return (
    <div
      ref={containerRef}
      className="dark relative min-h-screen bg-washed-black text-ivory grain-overlay"
    >
      {banner}
      <Header
        scrollY={scrollY}
        showPricing={showPricing}
        showAbout={showAbout}
        aboutHref={aboutHref}
        showRecordings={showRecordings}
        showGallery={showGallery}
        homeSectionBase={homeSectionBase}
        recordingsHref={recordingsNavHref}
      />
      <Hero />
      <SectionRail />

      <main className="relative z-10">
        <TheSpace photos={photos} />
        <EquipmentSpecs gear={gear} />
        <MarketingPricingSection
          pricingFlags={pricingFlags}
          marketingFeatureFlags={marketingForUi ?? null}
          isPreviewRoute={isPreview}
        />
        <AmenitiesNearby amenities={amenities} />
        <FAQ categories={faqCategories} />
        <ArtistInquiries />
      </main>

      <SiteFooter />
    </div>
  );
}
