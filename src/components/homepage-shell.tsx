"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { TheSpace, type GalleryPhoto } from "@/components/the-space";
import { EquipmentSpecs, type GearPayload } from "@/components/equipment-specs";
import { AmenitiesNearby } from "@/components/amenities-nearby";
import { FAQ } from "@/components/faq";
import { ArtistInquiries } from "@/components/artist-inquiries";
import { MarketingPricingSection } from "@/components/dynamic-pricing";
import type { PricingFlags } from "@/lib/site-settings";

function calculateLogoScale(scrollY: number): number {
  return Math.max(0.7, 1 - scrollY * 0.0008);
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
  readonly banner?: React.ReactNode;
}

export function HomepageShell({
  pricingFlags,
  gear,
  photos,
  banner,
}: HomepageShellProps) {
  const [scrollY, setScrollY] = useState(0);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    const reveals = node.querySelectorAll(".reveal");
    reveals.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const logoScale = calculateLogoScale(scrollY);
  const showPricing =
    pricingFlags === undefined ||
    (pricingFlags !== null && pricingFlags.flags.priceTabEnabled === true);

  return (
    <div ref={containerRef} className="dark min-h-screen bg-washed-black relative grain-overlay">
      {banner}
      <Header scrollY={scrollY} showPricing={showPricing} />
      <Hero logoScale={logoScale} />

      <div className="relative z-10">
        <TheSpace photos={photos} />
        <EquipmentSpecs gear={gear} />
        <MarketingPricingSection pricingFlags={pricingFlags} />
        <AmenitiesNearby />
        <FAQ />
        <ArtistInquiries />
      </div>
    </div>
  );
}
