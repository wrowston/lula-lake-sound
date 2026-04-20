import Link from "next/link";

import { VariantNav } from "../_components/variant-nav";

const pages = [
  {
    slug: "about",
    title: "About",
    lede: "Markdown essay: two founder portraits, brief history, why we built it.",
    note: "01 · Essay",
  },
  {
    slug: "gallery",
    title: "Gallery",
    lede: "Single full-frame stage, indexed filmstrip, field-note captions.",
    note: "02 · Stage · Contacts · Notes",
  },
  {
    slug: "recordings",
    title: "Recordings",
    lede: "Notebook sessions with margin credits and inline players.",
    note: "03 · Session log",
  },
] as const;

export default function VariantASummary() {
  return (
    <>
      <VariantNav variant="a" active="index" />
      <main className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-texture-stone opacity-50"
        />

        <section className="relative px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-14">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 md:grid-cols-[auto_1fr] md:gap-16">
            <div className="md:pt-4">
              <p className="eyebrow mb-4 text-sand/60">Variant A</p>
              <p className="label-text text-[10px] text-ivory/40">
                Field Notes
              </p>
            </div>
            <div className="max-w-3xl">
              <h1 className="headline-primary text-[2.5rem] leading-[1.05] text-warm-white md:text-[3.5rem]">
                <span className="text-sand">The studio,</span> written in
                the margins.
              </h1>
              <div className="section-rule my-10 max-w-[9rem]" />
              <p className="editorial-lede">
                Field Notes treats the marketing site like a leather-bound
                journal. About is a markdown-style essay with two founder
                portraits and section headings for a brief history and why
                they built the studio. The gallery is a single framed print
                with a filmstrip of indexed contacts below. Recordings read
                as stacked session entries, each with its own margin of
                credits and gear.
              </p>
              <p className="body-text mt-6 text-ivory/65">
                The variant is deliberately the lowest-risk of the three:
                typography and layout do the heavy lifting, so the
                implementation is mostly flat HTML and CSS with very little
                scroll choreography. It is also the most forgiving of
                candid, imperfect photography — margins, captions, and
                field-note metadata carry the narrative.
              </p>
            </div>
          </div>
        </section>

        <section className="relative px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto grid w-full max-w-6xl gap-5 md:grid-cols-3">
            {pages.map((p) => (
              <Link
                key={p.slug}
                href={`/design/variant-a/${p.slug}`}
                className="group/page relative flex flex-col justify-between border border-sand/15 bg-washed-black/55 p-7 transition-colors duration-500 hover:border-sand/40"
              >
                <div>
                  <p className="eyebrow mb-6 text-sand/55">{p.note}</p>
                  <h3 className="headline-secondary mb-3 text-2xl text-warm-white">
                    {p.title}
                  </h3>
                  <p className="body-text-small text-ivory/60">{p.lede}</p>
                </div>
                <div className="mt-10 flex items-center justify-between border-t border-sand/12 pt-5">
                  <span className="label-text text-[10px] text-ivory/45">
                    Open page
                  </span>
                  <span className="label-text text-[10px] text-sand transition-transform duration-500 group-hover/page:translate-x-1">
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
