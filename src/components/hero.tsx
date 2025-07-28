import Image from "next/image";
import { Button } from "@/components/ui/button";

interface HeroProps {
  readonly logoScale: number;
}

export function Hero({ logoScale }: HeroProps) {
  return (
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
              
              {/* Call to Action Button */}
              <div className="pt-4">
                <Button 
                  variant="primary"
                  size="lg"
                  onClick={() => document.getElementById('artist-inquiries')?.scrollIntoView({ behavior: 'smooth' })}
                  className="drop-shadow-xl"
                >
                  Get in touch
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}