"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { TheSpace } from "@/components/the-space";
import { EquipmentSpecs } from "@/components/equipment-specs";
import { AmenitiesNearby } from "@/components/amenities-nearby";
import { FAQ } from "@/components/faq";
import { ArtistInquiries } from "@/components/artist-inquiries";

function calculateLogoScale(scrollY: number): number {
  return Math.max(0.7, 1 - scrollY * 0.0008);
}

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // IntersectionObserver for scroll-triggered reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    const reveals = document.querySelectorAll(".reveal");
    reveals.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const logoScale = calculateLogoScale(scrollY);

  return (
    <div ref={mainRef} className="min-h-screen bg-washed-black relative grain-overlay">
      <Header scrollY={scrollY} />
      <Hero logoScale={logoScale} />

      <div className="relative z-10">
        <TheSpace />
        <EquipmentSpecs />
        <AmenitiesNearby />
        <FAQ />
        <ArtistInquiries />
      </div>
    </div>
  );
}
