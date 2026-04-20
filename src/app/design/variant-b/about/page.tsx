import Image from "next/image";

import { ABOUT_ESSAY } from "../../_components/about-essay-copy";
import { PlaceholderFrame } from "../../_components/placeholder-frame";
import { VariantNav } from "../../_components/variant-nav";

/**
 * Variant B · About — "Resonance".
 *
 * Same essay structure as the other variants: hero lede, two founder
 * portraits, then brief history and why we built it as editorial sections.
 */
export default function VariantBAbout() {
  return (
    <>
      <VariantNav variant="b" active="about" />
      <main className="relative isolate">
        <section className="relative flex min-h-[72vh] flex-col items-center justify-center overflow-hidden px-6 py-24 md:min-h-[80vh] md:px-10">
          <div className="absolute inset-0 z-0">
            <Image
              src="/Textured Backgrounds/LLS_Texture_Emerald.jpg"
              alt=""
              fill
              className="object-cover object-center"
              priority
              quality={82}
            />
            <div className="absolute inset-0 bg-washed-black/60" />
            <div aria-hidden className="absolute inset-0 bg-chladni-2 opacity-60" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-washed-black" />
          </div>
          <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-start gap-8">
            <p className="eyebrow text-gold/85">About</p>
            <h1 className="headline-primary text-[2.5rem] leading-[1.03] text-warm-white md:text-[3.75rem]">
              Lula Lake Sound
            </h1>
            <div className="section-rule max-w-[10rem]" />
            <p className="editorial-lede max-w-2xl text-warm-white/85">
              {ABOUT_ESSAY.lede}
            </p>
          </div>
        </section>

        {/* Founders */}
        <section className="relative border-t border-sand/10 px-6 py-20 md:px-10 md:py-28">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-chladni-1 opacity-20" />
          <div className="relative mx-auto w-full max-w-6xl">
            <p className="eyebrow mb-10 text-gold/75">The founders</p>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8">
              {ABOUT_ESSAY.founders.map((f) => (
                <figure
                  key={f.id}
                  className="border border-sand/15 bg-washed-black/60 p-4 md:p-5"
                >
                  <PlaceholderFrame
                    texture={f.texture}
                    ratio="4/5"
                    index={`F-${f.id}`}
                    subject="founder portrait — replace in production"
                  />
                  <figcaption className="mt-4 border-t border-sand/12 pt-3">
                    <p className="body-text-small text-gold/90">{f.caption}</p>
                    <p className="body-text-small mt-1 text-[11px] italic text-ivory/50">
                      {f.captionDetail}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Essay — history */}
        <section className="relative px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-3xl">
            <h2 className="headline-secondary mb-8 text-[1.75rem] text-warm-white md:text-[2.25rem]">
              {ABOUT_ESSAY.history.title}
            </h2>
            {ABOUT_ESSAY.history.paragraphs.map((p, i) => (
              <p key={`h-${i}`} className="body-text mt-6 first:mt-0 text-ivory/75">
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* Essay — why */}
        <section className="relative overflow-hidden border-t border-sand/10 px-6 py-20 md:px-10 md:py-28">
          <div className="absolute inset-0 z-0">
            <Image
              src="/Textured Backgrounds/LLS_Texture_Sagebrush.jpg"
              alt=""
              fill
              className="object-cover object-center opacity-40"
            />
            <div className="absolute inset-0 bg-washed-black/88" />
          </div>
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2 className="headline-secondary mb-8 text-[1.75rem] text-warm-white md:text-[2.25rem]">
              {ABOUT_ESSAY.why.title}
            </h2>
            {ABOUT_ESSAY.why.paragraphs.map((p, i) => (
              <p key={`w-${i}`} className="body-text mt-6 first:mt-0 text-ivory/75">
                {p}
              </p>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden px-6 py-28 md:px-10 md:py-36">
          <div className="absolute inset-0 z-0">
            <Image
              src="/Textured Backgrounds/LLS_Texture_Starburst.jpg"
              alt=""
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-washed-black/75" />
            <div aria-hidden className="absolute inset-0 bg-chladni-3 opacity-65" />
          </div>
          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
            <Image
              src="/Logos/Graphic/LLS_Logo_Graphic_Sage.png"
              alt=""
              width={90}
              height={90}
              aria-hidden
              className="mb-8 h-12 w-auto opacity-80"
            />
            <p className="eyebrow mb-5 text-gold/80">Inquire</p>
            <p className="body-text mb-10 text-ivory/65">
              Final About will render from markdown. Replace founder names
              and portraits when assets are ready.
            </p>
            <a
              href="mailto:info@lulalakesound.com"
              className="inline-flex items-center gap-3 border border-transparent bg-sand px-10 py-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-washed-black transition-colors duration-500 hover:bg-warm-white"
            >
              Get in touch
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
