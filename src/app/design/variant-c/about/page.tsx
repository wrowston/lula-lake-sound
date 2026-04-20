import Image from "next/image";

import { ABOUT_ESSAY } from "../../_components/about-essay-copy";
import { PlaceholderFrame } from "../../_components/placeholder-frame";
import { VariantNav } from "../../_components/variant-nav";

const FACTS = [
  { k: "Location", v: "Chattanooga, TN · Lookout Mountain" },
  { k: "Founded by", v: "Two founders · [names TBD]" },
  { k: "Established", v: "2021" },
  { k: "Elevation", v: "1,750 ft" },
  { k: "Capacity", v: "One session at a time" },
  { k: "Residency", v: "On-property cabin" },
] as const;

/**
 * Variant C · About — "Archive".
 *
 * Same markdown-essay content as A/B: lede, two founder portraits, brief
 * history and why we built it. Layout keeps a data rail for quick facts;
 * body reads as structured document, not a Q&A dossier.
 */
export default function VariantCAbout() {
  return (
    <>
      <VariantNav variant="c" active="about" />
      <main className="relative isolate overflow-hidden">
        <header className="relative px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-16">
          <div className="mx-auto w-full max-w-6xl border-b border-sand/15 pb-10">
            <div className="flex items-center justify-between">
              <p className="label-text text-[10px] text-sand/70">About</p>
              <p className="label-text text-[10px] text-ivory/40">
                Essay · Markdown structure
              </p>
            </div>
            <h1 className="headline-primary mt-6 text-[2.5rem] leading-[1.05] text-warm-white md:text-[3.5rem]">
              About Lula Lake Sound
            </h1>
            <p className="editorial-lede mt-8 max-w-3xl">{ABOUT_ESSAY.lede}</p>
          </div>
        </header>

        <section className="relative px-6 py-14 md:px-10 md:py-20">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-16">
            <div className="space-y-14">
              <div>
                <p className="eyebrow mb-6 text-sand/55">Founders</p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {ABOUT_ESSAY.founders.map((f) => (
                    <figure
                      key={f.id}
                      className="border border-sand/15 bg-washed-black/50 p-3"
                    >
                      <PlaceholderFrame
                        texture={f.texture}
                        ratio="4/5"
                        index={`F-${f.id}`}
                        subject="founder portrait — replace in production"
                      />
                      <figcaption className="mt-3 border-t border-sand/10 pt-2">
                        <p className="body-text-small text-sand">{f.caption}</p>
                        <p className="body-text-small mt-1 text-[11px] italic text-ivory/50">
                          {f.captionDetail}
                        </p>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>

              <article className="border-t border-sand/15 pt-10">
                <h2 className="headline-secondary mb-6 text-2xl text-warm-white md:text-[1.875rem]">
                  {ABOUT_ESSAY.history.title}
                </h2>
                {ABOUT_ESSAY.history.paragraphs.map((p, i) => (
                  <p key={`h-${i}`} className="body-text mt-6 first:mt-0 text-ivory/70">
                    {p}
                  </p>
                ))}
              </article>

              <article className="border-t border-sand/15 pt-10">
                <h2 className="headline-secondary mb-6 text-2xl text-warm-white md:text-[1.875rem]">
                  {ABOUT_ESSAY.why.title}
                </h2>
                {ABOUT_ESSAY.why.paragraphs.map((p, i) => (
                  <p key={`w-${i}`} className="body-text mt-6 first:mt-0 text-ivory/70">
                    {p}
                  </p>
                ))}
              </article>
            </div>

            <aside className="md:sticky md:top-[140px] md:self-start md:pt-1">
              <div className="border border-sand/15 bg-washed-black/60 p-6">
                <div className="mb-5 flex items-baseline justify-between">
                  <p className="eyebrow text-sand/60">Facts</p>
                  <p className="label-text text-[9px] text-ivory/40">Rail</p>
                </div>
                <dl className="divide-y divide-sand/10">
                  {FACTS.map((row) => (
                    <div
                      key={row.k}
                      className="flex items-baseline justify-between gap-6 py-3"
                    >
                      <dt className="label-text text-[10px] text-ivory/45">
                        {row.k}
                      </dt>
                      <dd className="body-text-small text-right text-[12px] text-sand">
                        {row.v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="body-text-small mt-4 text-ivory/45">
                Production page will map this essay from markdown; founder
                names and photos ship with INF-46.
              </p>
            </aside>
          </div>
        </section>

        <section className="relative px-6 py-16 md:px-10 md:py-20">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 border-t border-sand/15 pt-10 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <Image
                src="/Logos/Graphic/LLS_Logo_Graphic_Sand.png"
                alt=""
                width={64}
                height={64}
                aria-hidden
                className="h-10 w-auto opacity-80"
              />
              <div>
                <p className="label-text text-[10px] text-sand/70">Contact</p>
                <p className="body-text-small text-ivory/55">
                  info@lulalakesound.com
                </p>
              </div>
            </div>
            <a
              href="mailto:info@lulalakesound.com"
              className="inline-flex items-center gap-3 border border-sand/40 bg-transparent px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-sand transition-colors duration-500 hover:bg-sand hover:text-washed-black"
            >
              Email the studio
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
