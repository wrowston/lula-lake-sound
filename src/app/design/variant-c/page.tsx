import Link from "next/link";

import { VariantNav } from "../_components/variant-nav";

const pages = [
  {
    slug: "about",
    title: "About",
    lede: "Markdown essay + facts rail; two founder portraits.",
    tag: "§ I · Essay",
  },
  {
    slug: "gallery",
    title: "Gallery",
    lede: "Contact sheet with indexed frames and category filter.",
    tag: "§ II · Contacts",
  },
  {
    slug: "recordings",
    title: "Recordings",
    lede: "Tabular session log. Sortable. Expandable waveform row.",
    tag: "§ III · Log",
  },
] as const;

const STATS = [
  { label: "Established", value: "2021" },
  { label: "Elevation", value: "1,750 ft" },
  { label: "Live room", value: "640 sq ft" },
  { label: "Iso boxes", value: "03" },
  { label: "Sessions / yr", value: "22" },
  { label: "Capacity", value: "one at a time" },
] as const;

export default function VariantCSummary() {
  return (
    <>
      <VariantNav variant="c" active="index" />
      <main className="relative isolate overflow-hidden">
        <section className="relative px-6 pt-16 pb-14 md:px-10 md:pt-24 md:pb-20">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex items-center gap-4 border-b border-sand/15 pb-5">
              <span className="label-text text-[10px] text-ivory/50">
                Variant C
              </span>
              <span className="h-3 w-px bg-sand/20" aria-hidden />
              <span className="label-text text-[10px] text-ivory/40">
                Archive · Dossier · Systematic
              </span>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10">
              <div className="md:col-span-8">
                <p className="eyebrow mb-5 text-sand/65">
                  Lula Lake Sound · Studio Dossier
                </p>
                <h1 className="headline-primary text-[2.75rem] leading-[1.04] text-warm-white md:text-[3.75rem]">
                  <span className="text-ivory">The archive</span>
                  <br />
                  variant.
                </h1>
                <div className="section-rule my-10 max-w-[9rem]" />
                <p className="editorial-lede max-w-2xl">
                  Archive treats the marketing site like a reference
                  document. About is still a markdown-style essay—two founder
                  portraits, brief history, why we built it—with a facts rail
                  for quick scanning. Gallery and Recordings stay tabular and
                  systematic. The tone stays on brand — Acumin Wide Semibold,
                  Sand on Washed Black, editorial rules — with information
                  architecture tuned for legibility.
                </p>
                <p className="body-text mt-6 text-ivory/60">
                  Best for labels, engineers, and A&R — anyone who arrives
                  with a specific question (&ldquo;what&apos;s in the
                  room? who&apos;s recorded there? can I see a tracklist
                  with credits?&rdquo;) and wants to answer it on the
                  first scroll.
                </p>
              </div>

              <aside className="md:col-span-4 md:border-l md:border-sand/15 md:pl-8">
                <p className="eyebrow mb-5 text-sand/55">Data rail</p>
                <dl className="grid grid-cols-2 gap-5">
                  {STATS.map((s) => (
                    <div key={s.label}>
                      <dt className="label-text text-[9px] text-ivory/40">
                        {s.label}
                      </dt>
                      <dd className="body-text mt-1 text-sand">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            </div>
          </div>
        </section>

        <section className="relative px-6 py-20 md:px-10 md:py-24">
          <div className="mx-auto grid w-full max-w-6xl gap-0 border border-sand/15 md:grid-cols-3">
            {pages.map((p, i) => (
              <Link
                key={p.slug}
                href={`/design/variant-c/${p.slug}`}
                className={`group/page relative flex flex-col justify-between bg-washed-black/50 p-8 transition-colors duration-500 hover:bg-washed-black/75 ${
                  i < pages.length - 1
                    ? "border-b border-sand/15 md:border-b-0 md:border-r"
                    : ""
                }`}
              >
                <div>
                  <p className="eyebrow mb-6 text-sand/60">{p.tag}</p>
                  <h3 className="headline-secondary mb-3 text-2xl text-warm-white">
                    {p.title}
                  </h3>
                  <p className="body-text-small text-ivory/60">{p.lede}</p>
                </div>
                <div className="mt-10 flex items-center justify-between border-t border-sand/12 pt-5">
                  <span className="label-text text-[10px] text-ivory/45">
                    Open section
                  </span>
                  <span className="label-text text-[10px] text-ivory transition-transform duration-500 group-hover/page:translate-x-1">
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
