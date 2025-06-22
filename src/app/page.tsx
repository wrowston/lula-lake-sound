"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate logo scale based on scroll position (scale from 1 to 0.7)
  const logoScale = Math.max(0.7, 1 - scrollY * 0.0008);
  return (
    <div className="min-h-screen bg-sand">


      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
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
              
              <div className="pt-4 md:pt-8">
                <p className="text-sm md:text-base text-sand/80 font-medium tracking-wider font-titillium drop-shadow-lg">
                  CHATTANOOGA, TN
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery Placeholder Section */}
      <section className="py-20 px-4 bg-washed-black relative">
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

      {/* Contact Section */}
      <section className="py-20 px-4 bg-sand relative">
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
