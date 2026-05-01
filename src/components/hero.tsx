"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { Button } from "@/components/ui/button";

/**
 * Hero — quiet luxury recording studio in nature.
 *
 * Brand kit: primary full lockup in **Ivory** on the dark wash. Background
 * uses the Emerald textured field; Chladni rings sit on top. As the user
 * scrolls, every layer scrubs against scroll progress (`useScroll` +
 * `useTransform` from `motion/react`) so the hero feels cinematic rather
 * than sliding off-screen as a static block.
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
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const bgOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.35]);

  const chladniY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const chladniOpacity = useTransform(scrollYProgress, [0, 1], [0.45, 0]);

  const logoScale = useTransform(scrollYProgress, [0, 1], [1, 0.62]);
  const logoY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const logoOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.6, 0]);

  const copyY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55, 1], [1, 0.5, 0]);

  const cueOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.45],
    [0.65, 0.2, 0],
  );
  const cueY = useTransform(scrollYProgress, [0, 0.5], [0, 24]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden md:min-h-screen"
    >
      <div className="absolute inset-0 z-0">
        {/*
         * `unoptimized` keeps the served URL identical to the one preloaded
         * from `app/page.tsx` via `ReactDOM.preload`, so the browser reuses
         * those bytes instead of waiting on a fresh `/_next/image` request.
         */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ y: bgY, scale: bgScale, opacity: bgOpacity }}
        >
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
        </motion.div>
        {/* Single, earthy wash — keeps type legible without flashy gradients. */}
        <div className="absolute inset-0 bg-washed-black/55" />
        {/* Atmospheric Chladni pattern — drifts opposite the photo for depth. */}
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-chladni-1 mix-blend-overlay will-change-transform"
          style={{ y: chladniY, opacity: chladniOpacity }}
        />
        {/* Vertical fade toward the next section so the seam lands softly. */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-washed-black" />
      </div>

      <div className="relative z-10 flex min-h-[88vh] w-full max-w-7xl flex-col items-stretch px-6 pb-32 pt-32 sm:pb-28 md:min-h-screen md:flex-row md:items-center md:px-12 md:py-32">
        <motion.div
          className="order-2 flex w-full shrink-0 justify-center will-change-transform md:order-2 md:mb-0 md:w-1/2"
          style={{ scale: logoScale, y: logoY, opacity: logoOpacity }}
        >
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
        </motion.div>

        <motion.div
          className="order-1 mb-16 w-full min-w-0 text-center will-change-transform md:order-1 md:mb-0 md:w-1/2 md:pr-16 md:text-left"
          style={{ y: copyY, opacity: copyOpacity }}
        >
          <div className="mx-auto w-full max-w-lg space-y-10 md:mx-0 md:max-w-none md:space-y-12">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="eyebrow justify-center text-sand/70 md:justify-start"
            >
              Chattanooga, Tennessee
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
              className="headline-primary text-[2.75rem] leading-[1.05] text-warm-white md:text-[3.75rem] lg:text-[4.25rem]"
            >
              A Natural
              <br />
              <span className="text-sand">Creative Refuge</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
              className="editorial-lede mx-auto max-w-lg md:mx-0"
            >
              Nestled in serene mountains just outside of Chattanooga, TN, Lula
              Lake Sound recording studio offers artists a space where
              state-of-the-art equipment, comfortable accommodations, and
              breathtaking surroundings converge to fuel your sonic vision.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
              className="flex justify-center pt-4 md:justify-start"
            >
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
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scroll cue — fades + slides downward as the user begins scrolling. */}
      <motion.div
        className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
        style={{ opacity: cueOpacity, y: cueY }}
      >
        <span className="eyebrow text-[10px] text-sand/60">Scroll</span>
        <span className="h-10 w-px bg-gradient-to-b from-sand/45 to-transparent" />
      </motion.div>
    </section>
  );
}
