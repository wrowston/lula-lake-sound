import Image from "next/image";

import { PlaceholderFrame } from "../../_components/placeholder-frame";
import { VariantNav } from "../../_components/variant-nav";

/**
 * Variant C · About — "Archive".
 *
 * Dossier layout. A persistent data rail on the right carries studio
 * facts (elevation, room size, capacity, gear counts) while three
 * Roman-numeral chapters carry the editorial narrative on the left. A
 * short founder Q&A closes the page in a print-column format.
 */

const FACTS = [
  { k: "Location", v: "Chattanooga, TN · Lookout Mountain" },
  { k: "Established", v: "2021" },
  { k: "Elevation", v: "1,750 ft" },
  { k: "Capacity", v: "One session at a time" },
  { k: "Booking blocks", v: "Week-long default" },
  { k: "Live room", v: "640 sq ft · floated floor" },
  { k: "Control room", v: "SSL AWS 948 · treated" },
  { k: "Isolation", v: "Amp · Vocal · Dead" },
  { k: "Residency", v: "On-property cabin (sleeps 6)" },
  { k: "Engineering", v: "Tracking · Mixing · Master ref" },
] as const;

const CHAPTERS = [
  {
    num: "I.",
    title: "Location and ethos",
    body:
      "Lula Lake Sound is a destination recording studio thirty minutes outside Chattanooga, at the foot of Lookout Mountain. The property combines a custom-built control and live room pair with a residential cabin; booking is week-long and single-session by default. The thesis is simple: artists do their best work when the city is behind them and the room, the light, and the walk to the lake are doing half the work.",
  },
  {
    num: "II.",
    title: "Room design",
    body:
      "The live room was laid out first, then the control room followed. The live room (640 sq ft) is framed around a stone fireplace and uses a floated floor with two speeds of absorption so it can track a quartet or an amp stack without re-rigging. The control room is SSL-anchored with ATC near-fields; isolation is split across amp closet, vocal booth, and dead room so overdubs and live tracking coexist.",
  },
  {
    num: "III.",
    title: "Work and rhythm",
    body:
      "Sessions run in week-long blocks with the same engineering pair from setup to mix. One project at a time. No day-rate Tetris. That is the decision that drives everything else on this page — the capacity, the residency, the quiet.",
  },
] as const;

const QA = [
  {
    q: "What kinds of projects do you take?",
    a: "Full-band tracking, singer-songwriter records, chamber-folk arrangements, and film / TV score work. We prefer projects that want a week in the room over a day.",
  },
  {
    q: "Do you master on site?",
    a: "We provide a master reference. Final mastering is usually handled off-site by a room we trust; we will make an introduction if you need one.",
  },
  {
    q: "Is the cabin required?",
    a: "Recommended, not required. The residency rate is bundled with the room rate; bands that stay on property track better because the walk home is part of the session.",
  },
] as const;

export default function VariantCAbout() {
  return (
    <>
      <VariantNav variant="c" active="about" />
      <main className="relative isolate overflow-hidden">
        {/* Masthead */}
        <header className="relative px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-16">
          <div className="mx-auto w-full max-w-6xl border-b border-sand/15 pb-10">
            <div className="flex items-center justify-between">
              <p className="label-text text-[10px] text-sand/70">
                Dossier · About
              </p>
              <p className="label-text text-[10px] text-ivory/40">
                Document no. LLS-ABOUT-01
              </p>
            </div>
            <h1 className="headline-primary mt-6 text-[2.5rem] leading-[1.05] text-warm-white md:text-[3.75rem]">
              Lula Lake Sound
              <br />
              <span className="text-ivory/75">a studio dossier.</span>
            </h1>
            <p className="editorial-lede mt-10 max-w-3xl">
              A reference document for labels, A&R, and engineers
              evaluating the studio. Chapters on the left; persistent data
              rail on the right; founder Q&A at the bottom.
            </p>
          </div>
        </header>

        {/* Chapters + rail */}
        <section className="relative px-6 py-14 md:px-10 md:py-20">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 md:grid-cols-[minmax(0,1fr)_22rem] md:gap-16">
            <div className="space-y-14">
              {CHAPTERS.map((c) => (
                <article
                  key={c.num}
                  className="border-t border-sand/15 pt-10"
                >
                  <div className="mb-6 flex items-baseline gap-6">
                    <span className="font-acumin text-3xl text-sand md:text-[2.25rem]">
                      {c.num}
                    </span>
                    <h2 className="headline-secondary text-2xl text-warm-white md:text-[1.875rem]">
                      {c.title}
                    </h2>
                  </div>
                  <p className="body-text text-ivory/70">{c.body}</p>
                </article>
              ))}

              <div className="border border-sand/15 bg-washed-black/40 p-4 md:p-6">
                <PlaceholderFrame
                  texture="emerald"
                  ratio="21/9"
                  index="PLAN"
                  subject="Site plan · cabin, control, live, cabin"
                />
              </div>
            </div>

            <aside className="md:sticky md:top-[140px] md:self-start md:pt-1">
              <div className="border border-sand/15 bg-washed-black/60 p-6">
                <div className="mb-5 flex items-baseline justify-between">
                  <p className="eyebrow text-sand/60">Studio facts</p>
                  <p className="label-text text-[9px] text-ivory/40">
                    Data rail
                  </p>
                </div>
                <dl className="divide-y divide-sand/10">
                  {FACTS.map((f) => (
                    <div
                      key={f.k}
                      className="flex items-baseline justify-between gap-6 py-3"
                    >
                      <dt className="label-text text-[10px] text-ivory/45">
                        {f.k}
                      </dt>
                      <dd className="body-text-small text-right text-[12px] text-sand">
                        {f.v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-6 border border-sand/15 bg-washed-black/60 p-6">
                <p className="eyebrow mb-4 text-sand/55">Represent</p>
                <p className="body-text-small text-ivory/60">
                  Independent · self-represented. No label affiliation,
                  no management layer between artist and engineer.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* Q&A */}
        <section className="relative px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 flex items-baseline justify-between border-b border-sand/15 pb-6">
              <h2 className="headline-secondary text-2xl text-warm-white md:text-[1.875rem]">
                Notes on the record
              </h2>
              <p className="label-text text-[10px] text-ivory/45">§ Q&A</p>
            </div>
            <dl className="divide-y divide-sand/10">
              {QA.map((row) => (
                <div
                  key={row.q}
                  className="grid grid-cols-1 gap-4 py-8 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10"
                >
                  <dt className="body-text-small text-sand">Q. {row.q}</dt>
                  <dd className="body-text text-ivory/70">A. {row.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Close */}
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
                <p className="label-text text-[10px] text-sand/70">
                  End of document
                </p>
                <p className="body-text-small text-ivory/55">
                  Requests for availability, technical spec, or a private
                  walkthrough: info@lulalakesound.com
                </p>
              </div>
            </div>
            <a
              href="mailto:info@lulalakesound.com"
              className="inline-flex items-center gap-3 border border-sand/40 bg-transparent px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-sand transition-colors duration-500 hover:bg-sand hover:text-washed-black"
            >
              Request availability
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
