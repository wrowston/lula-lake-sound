"use client";

import Image from "next/image";
import { useState } from "react";

interface HeaderProps {
  readonly scrollY: number;
  readonly showPricing?: boolean;
}

/**
 * Restrained editorial header for Lula Lake Sound.
 *
 * Brand guide calls for "understated, grounded" navigation — so the
 * only thing that changes on scroll is a soft background wash that
 * lets the nav stay legible over photography. No glassmorphism, no
 * morphing pill, no attention-seeking effects.
 */
export function Header({ scrollY, showPricing = false }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollProgress = Math.min(scrollY / 240, 1);
  // Soft veil that fades in once the user has scrolled past the hero
  // halo. Topping out at 0.9 keeps it feeling like tinted paper, not
  // an opaque banner.
  const veilOpacity = Math.min(0.9, scrollY * 0.005);

  function handleNavigation() {
    setIsMobileMenuOpen(false);
  }

  function handleLogoClick() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const navigationItems = [
    { id: "the-space", label: "The Studio" },
    { id: "equipment-specs", label: "Gear" },
    ...(showPricing ? [{ id: "services-pricing", label: "Rates" }] : []),
    { id: "local-favorites", label: "Nearby" },
    { id: "faq", label: "Notes" },
    { id: "artist-inquiries", label: "Inquire" },
  ];

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-colors duration-500"
        style={{
          backgroundColor: `rgba(20, 22, 16, ${veilOpacity})`,
          borderBottom:
            scrollProgress > 0.25
              ? "1px solid rgba(198, 189, 160, 0.08)"
              : "1px solid transparent",
        }}
      >
        <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between px-6 py-5 md:px-10 lg:px-14">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            aria-label="Lula Lake Sound — back to top"
            className="group flex items-center gap-3 transition-opacity duration-500 hover:opacity-80"
          >
            <Image
              src="/LLS_Logo_Full_Tar.png"
              alt=""
              width={64}
              height={64}
              className="h-7 w-auto brightness-0 invert md:h-8"
              priority
            />
            <span className="label-text hidden text-ivory/70 md:inline">
              Lula Lake Sound
            </span>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-10 lg:flex">
            {navigationItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="label-text group relative text-ivory/55 transition-colors duration-500 hover:text-sand"
              >
                {item.label}
                <span className="absolute -bottom-2 left-0 h-px w-0 bg-sand/60 transition-all duration-500 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="p-1 text-ivory/70 transition-colors duration-300 hover:text-sand lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.25}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.25}
                  d="M4 7h16M4 13h16M4 19h16"
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-deep-forest/80"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute inset-x-0 top-[72px] border-y border-sand/10 bg-washed-black/95 px-8 py-12">
            <nav className="mx-auto flex max-w-md flex-col gap-8">
              {navigationItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={handleNavigation}
                  className="headline-secondary text-2xl text-ivory/85 transition-colors duration-300 hover:text-sand"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
