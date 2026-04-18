import Image from "next/image";
import { Button } from "@/components/ui/button";

interface HeroProps {
  readonly logoScale: number;
}

/**
 * Editorial hero for Lula Lake Sound.
 *
 * The composition is intentionally quiet:
 *   - A natural, softly-contrasted photograph anchors the top of the
 *     page.
 *   - A thin vertical rule separates the eyebrow copy from the
 *     headline, giving the block an editorial feel rather than a
 *     marketing splash.
 *   - The only motion is a gentle parallax on the word-mark; there
 *     are no loud gradients, glossy UI chrome or CTA screams.
 */
export function Hero({ logoScale }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-deep-forest"
    >
      {/* Photographic backdrop */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          quality={85}
        />

        {/* Soft editorial wash — kept calm, no aggressive gradients. */}
        <div className="absolute inset-0 bg-washed-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-washed-black/30 to-washed-black/90" />
        <div className="absolute inset-0 bg-texture-chladni opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[88rem] flex-col items-stretch px-6 pb-28 pt-28 md:flex-row md:items-center md:px-12 md:py-32 lg:px-16">
        {/* Copy column */}
        <div className="order-2 w-full md:order-1 md:w-1/2 md:pr-12">
          <div className="mx-auto w-full max-w-xl space-y-10 text-center md:mx-0 md:text-left">
            <p
              className="label-text text-ivory/60"
              style={{ letterSpacing: "0.32em" }}
            >
              Chattanooga, Tennessee
            </p>

            <h1 className="headline-display text-4xl text-warm-white md:text-5xl lg:text-[4.5rem]">
              A natural
              <br />
              <span className="italic font-normal text-sand">
                creative refuge
              </span>
              <span className="text-gold">.</span>
            </h1>

            <div className="flex justify-center md:justify-start">
              <span className="block h-px w-14 bg-sand/60" />
            </div>

            <p className="body-text mx-auto max-w-md text-base text-ivory/75 md:mx-0 md:max-w-lg md:text-lg">
              A recording studio tucked into the mountains outside Chattanooga.
              Thoughtful equipment, quiet rooms, and the kind of long, unhurried
              days that let records find themselves.
            </p>

            <div className="flex flex-col items-center gap-5 pt-2 sm:flex-row sm:justify-center md:justify-start">
              <Button
                variant="outline"
                size="lg"
                className="h-11 px-7"
                onClick={() =>
                  document
                    .getElementById("artist-inquiries")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Plan a session
              </Button>
              <a
                href="#the-space"
                className="label-text text-ivory/50 transition-colors duration-500 hover:text-sand"
              >
                See the space →
              </a>
            </div>
          </div>
        </div>

        {/* Mark column */}
        <div className="order-1 mb-12 flex w-full shrink-0 justify-center md:order-2 md:mb-0 md:w-1/2">
          <Image
            src="/LLS_Logo_Stack_White.png"
            alt="Lula Lake Sound"
            width={520}
            height={520}
            className="h-auto w-[72%] max-w-[26rem] opacity-95 transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:w-[86%] md:max-w-[32rem]"
            style={{ transform: `scale(${logoScale})` }}
            priority
          />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="pointer-events-none absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 opacity-60">
        <span
          className="label-text text-sand/70"
          style={{ letterSpacing: "0.45em" }}
        >
          Scroll
        </span>
        <div className="h-10 w-px bg-gradient-to-b from-sand/50 to-transparent" />
      </div>
    </section>
  );
}
