import Image from "next/image";
import { BrandButton as Button } from "@/components/ui/brand-button";

interface HeroProps {
  readonly logoScale: number;
}

export function Hero({ logoScale }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.jpg"
          alt="Atmospheric clouds background"
          fill
          className="object-cover object-center"
          priority
          quality={85}
        />
        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-washed-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-washed-black/40 via-transparent to-washed-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-washed-black/30 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 py-20 flex flex-col md:flex-row items-center min-h-screen">
        {/* Logo — right on desktop, top on mobile */}
        <div className="w-full md:w-1/2 flex justify-center md:order-2 mb-12 md:mb-0">
          <Image
            src="/lula-lake-logo.png"
            alt="Lula Lake Sound Logo"
            width={500}
            height={375}
            className="max-w-full h-auto filter brightness-0 invert transition-transform duration-700 ease-out"
            style={{
              transform: `scale(${logoScale})`,
              maxWidth: "85%",
            }}
            priority
          />
        </div>

        {/* Hero Text — left on desktop, bottom on mobile */}
        <div className="w-full md:w-1/2 md:pr-12 md:order-1 text-center md:text-left">
          <div className="space-y-8 md:space-y-10">
            <p className="label-text text-sand/80 tracking-widest">
              Chattanooga, TN
            </p>

            <h1 className="headline-primary text-3xl md:text-5xl lg:text-6xl text-warm-white leading-tight">
              A Natural
              <br />
              <span className="text-sand italic">Creative Refuge</span>
            </h1>

            <p className="body-text text-lg text-ivory/70 max-w-lg leading-relaxed">
              Nestled in serene mountains just outside of Chattanooga, TN, Lula Lake Sound recording studio
              offers artists a space where state-of-the-art equipment, comfortable accommodations,
              and breathtaking surroundings converge to fuel your sonic vision.
            </p>

            <div className="pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() =>
                  document
                    .getElementById("artist-inquiries")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Get in touch
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-50">
        <span className="label-text text-sand/60 text-[10px]">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-sand/40 to-transparent" />
      </div>
    </section>
  );
}
