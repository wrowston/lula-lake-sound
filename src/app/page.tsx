"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    
    // Throttled scroll handler for performance
    let ticking = false;
    const scrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, []);

  // Calculate logo scale based on scroll position (scale from 1 to 0.7)
  const logoScale = Math.max(0.7, 1 - scrollY * 0.0008);
  
  // Header background opacity based on scroll
  const headerOpacity = Math.min(0.95, scrollY * 0.005);
  
  // Header transformation based on scroll - smoother transitions
  const scrollProgress = Math.min(scrollY / 200, 1); // 0 to 1 over 200px
  
  // Smooth interpolation functions
  const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress;
  
  // Smooth transitions based on scroll progress
  const headerPadding = lerp(16, 18, scrollProgress); // Actually larger when scrolled
  const headerRadius = lerp(0, 28, scrollProgress);
  const headerWidth = scrollProgress > 0.3 ? 'auto' : '100%';
  const headerMargin = lerp(0, 16, scrollProgress);
  
  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Account for fixed header
      const offsetTop = element.offsetTop - headerHeight;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      // Close mobile menu after navigation
      setMobileMenuOpen(false);
    }
  };
  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
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
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
            className="hidden md:flex items-center justify-center transition-all duration-500" 
            style={{ 
              gap: `${lerp(32, 24, scrollProgress)}px`,
              marginLeft: `${lerp(0, 40, scrollProgress)}px`
            }}
          >
            <button
              onClick={() => scrollToSection('the-space')}
              className="text-sand hover:text-ivory transition-colors duration-300 font-acumin font-medium tracking-wide relative group"
              style={{ fontSize: `${lerp(16, 16, scrollProgress)}px` }}
            >
              The Space
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-sand transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button
              onClick={() => scrollToSection('local-favorites')}
              className="text-sand hover:text-ivory transition-colors duration-300 font-acumin font-medium tracking-wide relative group"
              style={{ fontSize: `${lerp(16, 16, scrollProgress)}px` }}
            >
              Amenities Nearby
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-sand transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button
              onClick={() => scrollToSection('artist-inquiries')}
              className="text-sand hover:text-ivory transition-colors duration-300 font-acumin font-medium tracking-wide relative group"
              style={{ fontSize: `${lerp(16, 16, scrollProgress)}px` }}
            >
              Artist Inquiries
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-sand transition-all duration-300 group-hover:w-full"></span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-sand hover:text-ivory transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Menu Panel */}
          <div className="absolute top-20 left-4 right-4 bg-washed-black/95 backdrop-blur-md rounded-lg border border-sage/20 p-6">
            <nav className="flex flex-col space-y-6">
              <button
                onClick={() => scrollToSection('the-space')}
                className="text-sand hover:text-ivory transition-colors duration-300 font-acumin font-medium tracking-wide text-lg text-left"
              >
                The Space
              </button>
              <button
                onClick={() => scrollToSection('local-favorites')}
                className="text-sand hover:text-ivory transition-colors duration-300 font-acumin font-medium tracking-wide text-lg text-left"
              >
                Amenities Nearby
              </button>
              <button
                onClick={() => scrollToSection('artist-inquiries')}
                className="text-sand hover:text-ivory transition-colors duration-300 font-acumin font-medium tracking-wide text-lg text-left"
              >
                Artist Inquiries
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.jpg"
            alt="Atmospheric clouds background"
            fill
            className="object-cover object-center"
            priority
            quality={100}
          />
          {/* Dark overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/40"></div>
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"></div>
        </div>
        
                <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 flex flex-col md:flex-row items-center min-h-screen">
          {/* Logo - Top on Mobile, Right on Desktop */}
          <div className="w-full md:w-1/2 flex justify-center md:order-2 mb-8 md:mb-0">
            <Image
              src="/lula-lake-logo.png"
              alt="Lula Lake Sound Logo"
              width={500}
              height={375}
              className="max-w-full h-auto filter brightness-0 invert transition-transform duration-300 ease-out"
              style={{ 
                transform: `scale(${logoScale})`,
                maxWidth: '90%'
              }}
              priority
            />
          </div>
          
          {/* Hero Text - Bottom on Mobile, Left on Desktop */}
          <div className="w-full md:w-1/2 md:pr-8 md:order-1 text-center md:text-left">
            <div className="space-y-8 md:space-y-12">
              <div className="space-y-6 md:space-y-8">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-wide font-acumin drop-shadow-2xl">
                  A NATURAL
                  <br />
                  <span className="text-sand">CREATIVE REFUGE</span>
                </h1>
                
                <div className="text-base md:text-lg lg:text-xl text-white/90 leading-relaxed font-titillium">
                  <p className="drop-shadow-lg">
                  Nestled in serene mountains just outside of Chattanooga, TN- Lula Lake Sound offers artists a natural creative refuge. The studio is designed to inspire creativity and relaxation, providing the perfect environment for your sonic adventures.
                  <br/>
                  <br/>
                  With state-of-the-art equipment, comfortable accommodations, and breathtaking surroundings, Lula Lake Sound is a space where artists can fully immerse themselves in their both nature and music. 
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery Placeholder Section */}
      <section id="the-space" className="py-20 px-4 bg-washed-black relative">
        <div className="absolute inset-0 opacity-40 bg-texture-stone"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-ivory mb-16 text-center tracking-wide font-acumin">
            THE SPACE
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="aspect-[4/3] bg-sage/20 border-2 border-rust/60 rounded-sm flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-sage/40 rounded-sm flex items-center justify-center mb-4">
                  <span className="text-sage text-xs">LLS</span>
                </div>
                <p className="text-ivory/70 text-sm font-titillium text-center">
                  Photo {item} - Studio Space
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Nearby Section */}
      <section id="local-favorites" className="py-20 px-4 bg-forest relative">
        <div className="absolute inset-0 opacity-20 bg-texture-stone"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-sand mb-16 text-center tracking-wide font-acumin">
            AMENITIES NEARBY
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Massey's Kitchen */}
            <div className="bg-sage/10 border-2 border-rust/60 rounded-sm p-6 hover:bg-sage/20 transition-all duration-300 group">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-sand font-acumin group-hover:text-ivory transition-colors">
                    {`Massey's Kitchen`}
                  </h3>
                  <p className="text-sand/90 text-sm font-medium font-titillium tracking-wide">
                    MEDITERRANEAN CUISINE
                  </p>
                </div>
                
                <p className="text-ivory/80 text-sm leading-relaxed font-titillium">
                  Elevated dining experience featuring made-from-scratch Mediterranean dishes. Authentic flavors crafted with imported ingredients and techniques learned from travels across the Mediterranean region.
                </p>
                
                <div className="pt-2">
                  <a 
                    href="https://www.masseyskitchen.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block text-sage hover:text-sand text-sm font-medium font-titillium tracking-wide transition-colors border-b border-sage/40 hover:border-sand/60"
                  >
                    Visit Website →
                  </a>
                </div>
              </div>
            </div>

            {/* Canopy Coffee and Wine Bar */}
            <div className="bg-sage/10 border-2 border-rust/60 rounded-sm p-6 hover:bg-sage/20 transition-all duration-300 group">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-sand font-acumin group-hover:text-ivory transition-colors">
                    Canopy Coffee & Wine Bar
                  </h3>
                  <p className="text-sand/90 text-sm font-medium font-titillium tracking-wide">
                    COFFEE • WINE • CRAFT BEER
                  </p>
                </div>
                
                <p className="text-ivory/80 text-sm leading-relaxed font-titillium">
                  Authentic Lookout Mountain experience in a casual, cozy atmosphere. Perfect community gathering spot with excellent coffee, local beer selections, and wine in a trendy yet laid-back setting.
                </p>
                
                <div className="pt-2">
                  <a 
                    href="http://www.canopylkt.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block text-sage hover:text-sand text-sm font-medium font-titillium tracking-wide transition-colors border-b border-sage/40 hover:border-sand/60"
                  >
                    Visit Website →
                  </a>
                </div>
              </div>
            </div>

            {/* Canyon Grill */}
            <div className="bg-sage/10 border-2 border-rust/60 rounded-sm p-6 hover:bg-sage/20 transition-all duration-300 group">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-sand font-acumin group-hover:text-ivory transition-colors">
                    Canyon Grill
                  </h3>
                  <p className="text-sand/90 text-sm font-medium font-titillium tracking-wide">
                    FINE DINING • FRESH SEAFOOD
                  </p>
                </div>
                
                <p className="text-ivory/80 text-sm leading-relaxed font-titillium">
                  Relaxed fine dining featuring sustainably sourced seafood and hickory wood-grilled specialties. Simple, careful preparation highlights natural flavors with ingredients stored on ice for optimal freshness.
                </p>
                
                <div className="pt-2">
                  <a 
                    href="https://www.canyongrill.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block text-sage hover:text-sand text-sm font-medium font-titillium tracking-wide transition-colors border-b border-sage/40 hover:border-sand/60"
                  >
                    Visit Website →
                  </a>
                </div>
              </div>
            </div>

            {/* Mountain Escape Spa */}
            <div className="bg-sage/10 border-2 border-rust/60 rounded-sm p-6 hover:bg-sage/20 transition-all duration-300 group">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-sand font-acumin group-hover:text-ivory transition-colors">
                    Mountain Escape Spa
                  </h3>
                  <p className="text-sand/90 text-sm font-medium font-titillium tracking-wide">
                    SPA • WELLNESS • RELAXATION
                  </p>
                </div>
                
                <p className="text-ivory/80 text-sm leading-relaxed font-titillium">
                Mountain Escape Spa is a full-service spa offering a range of treatments designed to rejuvenate and restore balance. Their services include massages, facials, body treatments, and more, all designed to help guests feel relaxed and refreshed.
                </p>
                
                <div className="pt-2">
                  <a 
                    href="https://www.mountainescapespa.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block text-sage hover:text-sand text-sm font-medium font-titillium tracking-wide transition-colors border-b border-sage/40 hover:border-sand/60"
                  >
                    Visit Website →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="artist-inquiries" className="py-20 px-4 bg-sand relative">
        <div className="absolute inset-0 opacity-20 bg-texture-canvas"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Graphic Logo */}
          <div className="mb-12">
            <Image
              src="/LLS_Logo_Full_Tar.png"
              alt="Lula Lake Sound Symbol"
              width={64}
              height={64}
              className="mx-auto"
            />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-forest mb-8 tracking-wide font-acumin">
            ARTIST INQUIRIES
          </h2>
          
          <div className="space-y-6 text-lg text-washed-black font-titillium">
            <p>
              Ready to create something meaningful? Reach out to discuss your project and discover how Lula Lake Sound can serve your artistic vision.
            </p>
            <p>
              <a href="mailto:lulalakesound@gmail.com">lulalakesound@gmail.com</a>
            </p>

            <div className="space-y-2">
              <p className="text-base">
                Chattanooga, Tennessee
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
