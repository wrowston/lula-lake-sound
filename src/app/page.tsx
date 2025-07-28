"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { TheSpace } from "@/components/the-space";
import { AmenitiesNearby } from "@/components/amenities-nearby";
import { ArtistInquiries } from "@/components/artist-inquiries";

// Helper function for calculating logo scale
function calculateLogoScale(scrollY: number): number {
  return Math.max(0.7, 1 - scrollY * 0.0008);
}

// Helper function for smooth scrolling to sections
function createScrollToSection() {
  return function scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (!element) return;
    
    const headerHeight = 80; // Account for fixed header
    const offsetTop = element.offsetTop - headerHeight;
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  };
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

  const scrollToSection = createScrollToSection();
  const logoScale = calculateLogoScale(scrollY);

  return (
    <div className="min-h-screen bg-sand">
      <Header scrollY={scrollY} scrollToSection={scrollToSection} />
      <Hero logoScale={logoScale} />
      <TheSpace />
      <AmenitiesNearby />
      <ArtistInquiries />
    </div>
  );
}
