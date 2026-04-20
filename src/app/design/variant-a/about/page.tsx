import Image from "next/image";

import { ABOUT_ESSAY } from "../../_components/about-essay-copy";
import { PlaceholderFrame } from "../../_components/placeholder-frame";
import { VariantNav } from "../../_components/variant-nav";

/**
 * Variant A · About — "Field Notes".
 *
 * Markdown-essay structure: title, lede, two founder portraits, then
 * section headings (brief history · why we built it) with body copy.
 */
export default function VariantAAbout() {
  return (
    <>
      <VariantNav variant="a" active="about" />
      <main className="relative isolate overflow-hidden bg-washed-black">
        <header className="relative px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-16">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 border-b border-sand/15 pb-10">
            <div className="flex items-center justify-between">
              <p className="label-text text-[10px] text-sand/70">About</p>
              <p className="label-text text-[10px] text-ivory/40">
                Essay · Field Notes
              </p>
            </div>
            <h1 className="headline-primary text-[2.5rem] leading-[1.05] text-warm-white md:text-[3.25rem]">
              About Lula Lake Sound
            </h1>
            <p className="editorial-lede">{ABOUT_ESSAY.lede}</p>
          </div>
        </header>

        {/* Founders — two portraits */}
        <section className="relative px-6 py-12 md:px-10 md:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow mb-6 text-sand/55">The founders</p>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
              {ABOUT_ESSAY.founders.map((f) => (
                <figure key={f.id} className="border border-sand/15 bg-washed-black p-3">
                  <div className="rotate-[-1deg]">
                    <PlaceholderFrame
                      texture={f.texture}
                      ratio="4/5"
                      index={`F-${f.id}`}
                      subject="founder portrait — replace in production"
                    />
                  </div>
                  <figcaption className="mt-4 border-t border-sand/12 pt-3">
                    <p className="body-text-small text-sand">{f.caption}</p>
                    <p className="body-text-small mt-1 text-[11px] italic text-ivory/50">
                      {f.captionDetail}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Essay body — markdown-like sections */}
        <article className="relative px-6 pb-16 md:px-10 md:pb-24">
          <div className="mx-auto max-w-3xl space-y-14">
            <section>
              <h2 className="headline-secondary mb-6 text-2xl text-warm-white md:text-[1.875rem]">
                {ABOUT_ESSAY.history.title}
              </h2>
              {ABOUT_ESSAY.history.paragraphs.map((p, i) => (
                <p key={`history-${i}`} className="body-text mt-6 first:mt-0 text-ivory/75">
                  {p}
                </p>
              ))}
            </section>

            <div className="section-rule-solid" aria-hidden />

            <section>
              <h2 className="headline-secondary mb-6 text-2xl text-warm-white md:text-[1.875rem]">
                {ABOUT_ESSAY.why.title}
              </h2>
              {ABOUT_ESSAY.why.paragraphs.map((p, i) => (
                <p key={`why-${i}`} className="body-text mt-6 first:mt-0 text-ivory/75">
                  {p}
                </p>
              ))}
            </section>
          </div>
        </article>

        <section className="relative px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center border-y border-sand/10 py-14 text-center">
            <Image
              src="/Logos/Graphic/LLS_Logo_Graphic_Sand.png"
              alt=""
              width={80}
              height={80}
              aria-hidden
              className="mb-8 h-10 w-auto opacity-75"
            />
            <p className="eyebrow mb-5 text-sand/55">Inquire</p>
            <p className="body-text max-w-xl text-ivory/60">
              Production About will render this body from markdown. Replace
              founder names and photos when ready.
            </p>
            <p className="mt-8 text-[12px] text-ivory/40">
              <a
                href="mailto:info@lulalakesound.com"
                className="text-sand underline underline-offset-[6px]"
              >
                info@lulalakesound.com
              </a>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
