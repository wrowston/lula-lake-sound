import Link from "next/link";
import Image from "next/image";

import { VariantNav } from "../_components/variant-nav";

const pages = [
  {
    slug: "about",
    title: "About",
    lede: "Sticky full-bleed panels, alternating image / text, Chladni wayfinder rail.",
    tag: "01 · Unfolds",
  },
  {
    slug: "gallery",
    title: "Gallery",
    lede: "Horizontal parallax on desktop, vertical river on mobile. Prints float against textured grounds.",
    tag: "02 · Drifts",
  },
  {
    slug: "recordings",
    title: "Recordings",
    lede: "One track, one viewport. Waveform overlaid on textured hero fields.",
    tag: "03 · Resonates",
  },
] as const;

export default function VariantBSummary() {
  return (
    <>
      <VariantNav variant="b" active="index" />
      <main className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-chladni-2 opacity-45" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[60vh] bg-chladni-1-2" />

        <section className="relative px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-16">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow mb-5 text-gold/80">Variant B</p>
              <h1 className="headline-primary text-[2.75rem] leading-[1.04] text-warm-white md:text-[3.75rem]">
                <span className="text-gold">Resonance.</span>
                <br />
                Place as character.
              </h1>
              <div className="section-rule my-10 max-w-[9rem]" />
              <p className="editorial-lede">
                Resonance is the most cinematic of the three directions.
                Chladni plates and textured fields become structural — not
                decorative. The About page unfolds as sticky full-bleed
                panels; the Gallery drifts horizontally on desktop and
                becomes a vertical river on mobile; each recording is its
                own full-viewport hero with a waveform overlaid on the
                session&apos;s textured backdrop.
              </p>
              <p className="body-text mt-6 text-ivory/65">
                This variant leans hardest into the refreshed brand kit and
                into what the studio actually sells: immersion,
                atmosphere, and the feeling of having stepped out of the
                city for a while.
              </p>
            </div>
            <Image
              src="/Chladni/CHLADNI_clean.png"
              alt=""
              width={220}
              height={220}
              aria-hidden
              className="hidden h-40 w-auto opacity-55 mix-blend-screen md:block"
            />
          </div>
        </section>

        <section className="relative px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto grid w-full max-w-6xl gap-5 md:grid-cols-3">
            {pages.map((p) => (
              <Link
                key={p.slug}
                href={`/design/variant-b/${p.slug}`}
                className="group/page relative flex flex-col justify-between border border-gold/25 bg-washed-black/65 p-7 transition-colors duration-500 hover:border-gold/60"
              >
                <div>
                  <p className="eyebrow mb-6 text-gold/70">{p.tag}</p>
                  <h3 className="headline-secondary mb-3 text-2xl text-warm-white">
                    {p.title}
                  </h3>
                  <p className="body-text-small text-ivory/60">{p.lede}</p>
                </div>
                <div className="mt-10 flex items-center justify-between border-t border-gold/15 pt-5">
                  <span className="label-text text-[10px] text-ivory/45">
                    Open page
                  </span>
                  <span className="label-text text-[10px] text-gold transition-transform duration-500 group-hover/page:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
