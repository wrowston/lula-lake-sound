"use client";

import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { AmenitiesNearby } from "@/components/amenities-nearby";
import { ArtistInquiries } from "@/components/artist-inquiries";
import { MarketingPricingSection } from "@/components/dynamic-pricing";
import { EquipmentSpecs, type GearPayload } from "@/components/equipment-specs";
import { FAQ, type FaqCategoryProps } from "@/components/faq";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { SiteFooter } from "@/components/site-footer";
import {
  AudioPortfolio,
  type PublishedAudioTrack,
} from "@/components/audio-portfolio";
import type { PublishedAmenitiesNearby } from "@/components/amenities-nearby";
import { TheSpace, type GalleryPhoto } from "@/components/the-space";
import { useScrollAndReveal } from "@/hooks/use-scroll-and-reveal";
import {
  type MarketingFeatureFlags,
  type PricingFlags,
  isHomepagePricingSectionEnabled,
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
  /** Published (or preview) audio portfolio; empty array shows an empty state. */
  readonly audioTracks: PublishedAudioTrack[] | null | undefined;
  /** FAQ categories from Convex; omit to use client fallback defaults. */
  readonly faqCategories?: readonly FaqCategoryProps[] | null | undefined;
  /** When set (e.g. preview), skips live public subscription for amenities. */
  readonly amenities?: PublishedAmenitiesNearby | null | undefined;
  readonly banner?: React.ReactNode;
}

export function HomepageShell({
  pricingFlags,
  marketingFeatureFlags: marketingFromProps,
  gear,
  photos,
  audioTracks,
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

  const liveMarketing = useQuery(
    api.public.getPublishedMarketingFeatureFlags,
    marketingFromProps === undefined ? {} : "skip",
  );
  const marketing =
    marketingFromProps === undefined ? liveMarketing : marketingFromProps;

  const logoScale = calculateLogoScale(scrollY);
  const showPricing =
    marketing === undefined ||
    (marketing !== null && isHomepagePricingSectionEnabled(marketing)) ||
    (isPreview &&
      marketing == null &&
      previewHasActivePricingPackages(pricingFlags));
  const showAbout = marketing === undefined
    ? false
    : marketing !== null && marketing.aboutPage === true;
  const showRecordings =
    marketing === undefined
      ? false
      : marketing !== null && marketing.recordingsPage === true;

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
        homeSectionBase={homeSectionBase}
        recordingsHref={recordingsNavHref}
      />
      <Hero logoScale={logoScale} />

      <main className="relative z-10">
        <TheSpace photos={photos} />
        <AudioPortfolio tracks={audioTracks} />
        <EquipmentSpecs gear={gear} />
        <MarketingPricingSection
          pricingFlags={pricingFlags}
          marketingFeatureFlags={marketing ?? null}
          isPreviewRoute={isPreview}
        />
        <AmenitiesNearby amenities={amenities} />
        <FAQ
          categories={
            faqCategories === undefined || faqCategories === null
              ? undefined
              : faqCategories
          }
        />
        <ArtistInquiries />
      </main>

      <SiteFooter />
    </div>
  );
}
