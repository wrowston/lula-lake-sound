"use client";

import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { AmenitiesNearby } from "@/components/amenities-nearby";
import { ArtistInquiries } from "@/components/artist-inquiries";
import { MarketingPricingSection } from "@/components/dynamic-pricing";
import { EquipmentSpecs, type GearPayload } from "@/components/equipment-specs";
import { FAQ } from "@/components/faq";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { SiteFooter } from "@/components/site-footer";
import { TheSpace, type GalleryPhoto } from "@/components/the-space";
import { useScrollAndReveal } from "@/hooks/use-scroll-and-reveal";
import type { PricingFlags } from "@/lib/site-settings";

function calculateLogoScale(scrollY: number): number {
  return Math.max(0.7, 1 - scrollY * 0.0006);
}

interface HomepageShellProps {
  /** `undefined` while the client is still subscribing (preview only if not preloaded). */
  readonly pricingFlags: PricingFlags | null | undefined;
  /**
   * Published (or preview) gear payload. `undefined` renders the skeleton;
   * `null` renders the graceful empty state.
   */
  readonly gear: GearPayload | null | undefined;
  /** Published (or preview) gallery payload. */
  readonly photos: GalleryPhoto[] | null | undefined;
  /**
   * INF-46 About-page visibility flag. `null` / `undefined` keeps the nav
   * link hidden — the About page is opt-in via the CMS.
   */
  readonly aboutVisibility?:
    | { readonly published: boolean }
    | null
    | undefined;
  readonly banner?: React.ReactNode;
}

export function HomepageShell({
  pricingFlags,
  gear,
  photos,
  aboutVisibility,
  banner,
}: HomepageShellProps) {
  const { scrollY, containerRef } = useScrollAndReveal();
  const pathname = usePathname();
  const aboutHref =
    pathname === "/preview" || pathname.startsWith("/preview/")
      ? "/preview/about"
      : "/about";

  // If the caller hasn't provided a draft/preload visibility value (the
  // public homepage path), subscribe live so the nav updates reactively when
  // the owner flips the INF-46 flag in the CMS.
  const liveAboutVisibility = useQuery(
    api.public.getPublishedAboutVisibility,
    aboutVisibility === undefined ? {} : "skip",
  );
  const resolvedAboutVisibility =
    aboutVisibility === undefined ? liveAboutVisibility : aboutVisibility;

  const logoScale = calculateLogoScale(scrollY);
  const showPricing =
    pricingFlags === undefined ||
    (pricingFlags !== null && pricingFlags.flags.priceTabEnabled === true);
  const showAbout = resolvedAboutVisibility?.published === true;

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
        showRecordings
      />
      <Hero logoScale={logoScale} />

      <main className="relative z-10">
        <TheSpace photos={photos} />
        <EquipmentSpecs gear={gear} />
        <MarketingPricingSection pricingFlags={pricingFlags} />
        <AmenitiesNearby />
        <FAQ />
        <ArtistInquiries />
      </main>

      <SiteFooter />
    </div>
  );
}
