"use client";

import { usePathname } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { usePublicConvexQuery } from "@/lib/use-public-convex-query";
import { AmenitiesNearby } from "@/components/amenities-nearby";
import { ArtistInquiries } from "@/components/artist-inquiries";
import { MarketingPricingSection } from "@/components/dynamic-pricing";
import { EquipmentSpecs, type GearPayload } from "@/components/equipment-specs";
import { FAQ, type FaqCategoryProps } from "@/components/faq";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
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

function calculateLogoScale(scrollY: number): number {
  return Math.max(0.7, 1 - scrollY * 0.0006);
}

interface HomepageShellProps {
  /** `undefined` while the client is still subscribing (preview only if not preloaded). */
  readonly pricingFlags: PricingFlags | null | undefined;
  /**
   * `undefined` when not preloaded: live-subscribe. `null` on error. Pass from
   * `getPublishedMarketingFeatureFlags` or `getPreviewMarketingFeatureFlags`.
   */
  readonly marketingFeatureFlags?: MarketingFeatureFlags | null | undefined;
  /**
   * Published (or preview) gear payload. `undefined` renders the skeleton;
   * `null` renders the graceful empty state.
   */
  readonly gear: GearPayload | null | undefined;
  /** Published (or preview) gallery payload. */
  readonly photos: GalleryPhoto[] | null | undefined;
  /** FAQ categories from Convex; `undefined` renders the loading state. */
  readonly faqCategories?: readonly FaqCategoryProps[] | null | undefined;
  /** Amenities payload from Convex; `undefined` renders the loading state. */
  readonly amenities?: PublishedAmenitiesNearby | null | undefined;
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
      skip: marketingFromProps !== undefined,
    },
  );
  const marketing =
    marketingFromProps === undefined ? liveMarketing : marketingFromProps;

  const logoScale = calculateLogoScale(scrollY);
  // Nav-link visibility intentionally defaults to OFF while the marketing
  // flags are still loading. Otherwise a fresh page load briefly renders the
  // "Pricing" / "Recordings" / "About" tabs before Convex resolves and any
  // disabled tabs disappear — the visible flicker reported on the homepage.
  const showPricing =
    (marketing != null && isHomepagePricingSectionEnabled(marketing)) ||
    (isPreview &&
      marketing == null &&
      previewHasActivePricingPackages(pricingFlags));
  const showAbout = marketing != null && marketing.aboutPage === true;
  const showRecordings =
    marketing != null && marketing.recordingsPage === true;
  const showGallery = marketing != null && isGalleryPageEnabled(marketing);

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
      <Hero logoScale={logoScale} />

      <main className="relative z-10">
        <TheSpace photos={photos} />
        <EquipmentSpecs gear={gear} />
        <MarketingPricingSection
          pricingFlags={pricingFlags}
          marketingFeatureFlags={marketing ?? null}
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
