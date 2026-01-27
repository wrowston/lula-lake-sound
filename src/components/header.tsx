"use client";

import Image from "next/image";
import { useState } from "react";

interface HeaderProps {
  readonly scrollY: number;
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

export function Header({ scrollY }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollProgress = Math.min(scrollY / 200, 1);
  const headerOpacity = Math.min(0.92, scrollY * 0.005);
  const headerPadding = lerp(14, 12, scrollProgress);
  const headerRadius = lerp(0, 999, scrollProgress);
  const headerMargin = lerp(0, 12, scrollProgress);

  function handleNavigation() {
    setIsMobileMenuOpen(false);
  }

  function handleLogoClick() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const navigationItems = [
    { id: "the-space", label: "The Studio" },
    { id: "equipment-specs", label: "Gear" },
    { id: "local-favorites", label: "Nearby" },
    { id: "faq", label: "FAQ" },
    { id: "artist-inquiries", label: "Inquire" },
  ];

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out flex justify-center"
        style={{
          paddingTop: `${headerMargin}px`,
          paddingLeft: `${headerMargin}px`,
          paddingRight: `${headerMargin}px`,
        }}
      >
        <div
          className="w-full max-w-5xl mx-auto flex items-center justify-between transition-all duration-500 ease-out"
          style={{
            backgroundColor: `rgba(31, 30, 28, ${headerOpacity})`,
            backdropFilter: scrollY > 50 ? "blur(16px) saturate(1.2)" : "none",
            WebkitBackdropFilter: scrollY > 50 ? "blur(16px) saturate(1.2)" : "none",
            borderRadius: `${headerRadius}px`,
            border: scrollProgress > 0.3 ? "1px solid rgba(198, 189, 160, 0.08)" : "1px solid transparent",
            paddingTop: `${headerPadding}px`,
            paddingBottom: `${headerPadding}px`,
            paddingLeft: `${lerp(16, 32, scrollProgress)}px`,
            paddingRight: `${lerp(16, 32, scrollProgress)}px`,
          }}
        >
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center transition-transform duration-300 hover:scale-105"
          >
            <Image
              src="/LLS_Logo_Full_Tar.png"
              alt="Lula Lake Sound Logo"
              width={60}
              height={60}
              className="filter brightness-0 invert transition-all duration-500"
              style={{
                height: `${lerp(36, 28, scrollProgress)}px`,
                width: "auto",
              }}
              priority
            />
          </button>

          {/* Desktop Navigation */}
          <nav
            className="hidden lg:flex items-center transition-all duration-500"
            style={{
              gap: `${lerp(28, 24, scrollProgress)}px`,
            }}
          >
            {navigationItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="label-text text-ivory/60 hover:text-sand transition-colors duration-300 relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-sand transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-ivory/60 hover:text-sand transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg
              className="w-5 h-5 transition-all duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-washed-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-20 left-4 right-4 bg-charcoal/95 backdrop-blur-xl rounded-2xl border border-sand/10 p-8">
            <nav className="flex flex-col space-y-6">
              {navigationItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={handleNavigation}
                  className="headline-secondary text-ivory/80 hover:text-sand transition-colors duration-300 text-xl"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
