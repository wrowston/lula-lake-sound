"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { TheSpace } from "@/components/the-space";
import { EquipmentSpecs } from "@/components/equipment-specs";
import { AmenitiesNearby } from "@/components/amenities-nearby";
import { FAQ } from "@/components/faq";
import { ArtistInquiries } from "@/components/artist-inquiries";
import { MarketingPricingSection } from "@/components/dynamic-pricing";
import { Footer } from "@/components/footer";
import type { PricingFlags } from "@/lib/site-settings";

function calculateLogoScale(scrollY: number): number {
  // Very gentle parallax shrink — the hero mark settles rather than
  // dramatically contracts. Brand guide calls for "subtle parallax
  // only if tasteful".
  return Math.max(0.82, 1 - scrollY * 0.00045);
}

interface HomepageShellProps {
  /** `undefined` while the client is still subscribing (preview only if not preloaded). */
  readonly pricingFlags: PricingFlags | null | undefined;
  readonly banner?: React.ReactNode;
}

export function HomepageShell({ pricingFlags, banner }: HomepageShellProps) {
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
        <TheSpace />
        <EquipmentSpecs />
        <MarketingPricingSection pricingFlags={pricingFlags} />
        <AmenitiesNearby />
        <FAQ />
        <ArtistInquiries />
        <Footer />
      </div>
    </div>
  );
}
