"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";

/**
 * Hero — quiet luxury recording studio in nature.
 *
 * Brand kit: primary full lockup in **Ivory** on the dark wash. Background
 * uses the Emerald textured field. Chladni rings sit on top and drift via
 * CSS scroll-driven animation so the hero avoids a JS animation runtime.
 *
 * The previous `logoScale` prop is no longer required — scrub-driven
 * transforms own all hero motion. The prop is kept optional for backwards
 * compat with any caller that still passes it.
 */
interface HeroProps {
  /** @deprecated Hero now owns its own scroll-tied transforms. Ignored. */
  readonly logoScale?: number;
}

export function Hero({}: HeroProps = {}) {
  return (
    <section
      id="hero"
      className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden md:min-h-screen"
    >
      <div className="absolute inset-0 z-0">
        {/*
         * `unoptimized` keeps the served URL identical to the one preloaded
         * from `app/page.tsx` via `ReactDOM.preload`, so the browser reuses
         * those bytes instead of waiting on a fresh `/_next/image` request.
         */}
        <div className="parallax-soft absolute inset-0">
          <Image
            src="/Textured Backgrounds/LLS_Texture_Emerald.optimized.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
            fetchPriority="high"
            unoptimized
          />
        </div>
        {/* Single, earthy wash — keeps type legible without flashy gradients. */}
        <div className="absolute inset-0 bg-washed-black/55" />
        {/* Atmospheric Chladni pattern — drifts opposite the photo for depth. */}
        <div
          aria-hidden
          className="parallax-soft absolute inset-0 bg-chladni-1 opacity-45 mix-blend-overlay"
        />
        {/* Vertical fade toward the next section so the seam lands softly. */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-washed-black" />
      </div>

      <div className="relative z-10 flex min-h-[88vh] w-full max-w-7xl flex-col items-stretch px-6 pb-32 pt-32 sm:pb-28 md:min-h-screen md:flex-row md:items-center md:px-12 md:py-32">
        <div className="order-2 flex w-full shrink-0 justify-center md:order-2 md:mb-0 md:w-1/2">
          <Image
            src="/Logos/Primary/LLS_Logo_Full_Ivory.png"
            alt="Lula Lake Sound"
            width={800}
            height={260}
            className="h-auto max-w-[78%]"
            priority
            fetchPriority="high"
            unoptimized
          />
        </div>

        <div className="order-1 mb-16 w-full min-w-0 text-center md:order-1 md:mb-0 md:w-1/2 md:pr-16 md:text-left">
          <div className="mx-auto w-full max-w-lg space-y-10 md:mx-0 md:max-w-none md:space-y-12">
            <p className="eyebrow reveal justify-center text-sand/70 md:justify-start">
              Chattanooga, Tennessee
            </p>

            <h1 className="headline-primary reveal-axis reveal-delay-1 text-[2.75rem] leading-[1.05] text-warm-white md:text-[3.75rem] lg:text-[4.25rem]">
              A Natural
              <br />
              <span className="text-sand">Creative Refuge</span>
            </h1>

            <p className="editorial-lede reveal reveal-delay-2 mx-auto max-w-lg md:mx-0">
              Nestled in serene mountains just outside of Chattanooga, TN, Lula
              Lake Sound recording studio offers artists a space where
              state-of-the-art equipment, comfortable accommodations, and
              breathtaking surroundings converge to fuel your sonic vision.
            </p>

            <div className="reveal reveal-delay-3 flex justify-center pt-4 md:justify-start">
              <Button
                variant="default"
                size="xl"
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

      {/* Scroll cue — self-erases as the hero exits via `.scroll-cue-fade`. */}
      <div className="scroll-cue-fade absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 opacity-60">
        <span className="eyebrow text-[10px] text-sand/60">Scroll</span>
        <span className="h-10 w-px bg-gradient-to-b from-sand/45 to-transparent" />
      </div>
    </section>
  );
}
