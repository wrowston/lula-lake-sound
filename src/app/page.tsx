"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { TheSpace } from "@/components/the-space";
import { EquipmentSpecs } from "@/components/equipment-specs";
import { AmenitiesNearby } from "@/components/amenities-nearby";
import { FAQ } from "@/components/faq";
import { ArtistInquiries } from "@/components/artist-inquiries";

// Helper function for calculating logo scale
function calculateLogoScale(scrollY: number): number {
  return Math.max(0.7, 1 - scrollY * 0.0008);
}



export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    function handleScroll() {
      setScrollY(window.scrollY);
    }
    
    // Throttled scroll handler for performance
    let isTickingRef = false;
    function scrollHandler() {
      if (!isTickingRef) {
        requestAnimationFrame(() => {
          handleScroll();
          isTickingRef = false;
        });
        isTickingRef = true;
      }
    }

    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, []);

  const logoScale = calculateLogoScale(scrollY);

  return (
    <div className="min-h-screen bg-sand">
      <Header scrollY={scrollY} />
      <Hero logoScale={logoScale} />
      <TheSpace />
      <EquipmentSpecs />
      <AmenitiesNearby />
      <FAQ />
      <ArtistInquiries />
    </div>
  );
}
