"use client";

import Image from "next/image";
import { useState } from "react";

interface HeaderProps {
  readonly scrollY: number;
  readonly scrollToSection: (sectionId: string) => void;
}

// Helper function for smooth interpolation
function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

export function Header({ scrollY, scrollToSection }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Calculate transformations based on scroll position
  const headerOpacity = Math.min(0.95, scrollY * 0.005);
  const scrollProgress = Math.min(scrollY / 200, 1);
  
  const headerPadding = lerp(16, 18, scrollProgress);
  const headerRadius = lerp(0, 28, scrollProgress);
  const headerWidth = scrollProgress > 0.3 ? 'auto' : '100%';
  const headerMargin = lerp(0, 16, scrollProgress);

  function handleNavigation(sectionId: string) {
    scrollToSection(sectionId);
    setIsMobileMenuOpen(false);
  }

  function handleLogoClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleMobileMenu() {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }

  // Navigation items for the music studio
  const navigationItems = [
    { id: 'the-space', label: 'The Studio' },
    { id: 'amenities-nearby', label: 'Amenities Nearby' },
    { id: 'faq', label: 'FAQ' },
    { id: 'artist-inquiries', label: 'Book Your Session' },
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
          className="max-w-7xl mx-auto flex items-center justify-between transition-all duration-500 ease-out"
          style={{
            backgroundColor: `rgba(42, 39, 37, ${headerOpacity})`,
            backdropFilter: scrollY > 50 ? 'blur(8px)' : 'none',
            borderRadius: `${headerRadius}px`,
            width: headerWidth,
            paddingTop: `${headerPadding}px`,
            paddingBottom: `${headerPadding}px`,
            paddingLeft: `${lerp(16, 128, scrollProgress)}px`,
            paddingRight: `${lerp(16, 128, scrollProgress)}px`,
          }}
        >
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center transition-transform duration-300 hover:scale-105"
            style={{
              marginRight: `${lerp(0, 40, scrollProgress)}px`
            }}
          >
            <Image
              src="/LLS_Logo_Full_Tar.png"
              alt="Lula Lake Sound Logo"
              width={60}
              height={60}
              className="filter brightness-0 invert transition-all duration-500"
              style={{
                height: `${lerp(48, 40, scrollProgress)}px`,
                width: 'auto'
              }}
              priority
            />
          </button>

          {/* Desktop Navigation */}
          <nav 
            className="hidden lg:flex items-center justify-center transition-all duration-500" 
            style={{ 
              gap: `${lerp(24, 20, scrollProgress)}px`,
              marginLeft: `${lerp(0, 40, scrollProgress)}px`
            }}
          >
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className="body-text text-sand hover:text-ivory transition-colors duration-300 relative group whitespace-nowrap"
                style={{ fontSize: `${lerp(15, 14, scrollProgress)}px` }}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-sand transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-sand hover:text-ivory transition-colors"
            onClick={toggleMobileMenu}
          >
            <svg 
              className="transition-all duration-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{
                width: `${lerp(24, 22, scrollProgress)}px`,
                height: `${lerp(24, 22, scrollProgress)}px`
              }}
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Menu Panel */}
          <div className="absolute top-20 left-4 right-4 bg-washed-black/95 backdrop-blur-md rounded-lg border border-sage/20 p-6">
            <nav className="flex flex-col space-y-6">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className="headline-secondary text-sand hover:text-ivory transition-colors duration-300 text-lg text-left"
                >
                  {item.label}
                </button>
              ))}
              
              {/* Additional mobile-only links */}
              <div className="border-t border-sage/30 pt-6 space-y-4">
                <button
                  onClick={() => handleNavigation('faq')}
                  className="body-text text-ivory/70 hover:text-ivory transition-colors duration-300 text-left"
                >
                  FAQ
                </button>
                <button
                  onClick={() => handleNavigation('local-favorites')}
                  className="body-text text-ivory/70 hover:text-ivory transition-colors duration-300 text-left"
                >
                  Amenities Nearby
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}