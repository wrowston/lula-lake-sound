"use client";

import { useState } from "react";

import { PlaceholderFrame } from "../../_components/placeholder-frame";
import { VariantNav } from "../../_components/variant-nav";

type Texture =
  | "emerald"
  | "sagebrush"
  | "seafoam"
  | "sunset"
  | "goldenhour"
  | "starburst"
  | "coral";

type GalleryEntry = {
  readonly id: string;
  readonly subject: string;
  readonly caption: string;
  readonly note: string;
  readonly location: string;
  readonly texture: Texture;
};

const ENTRIES: readonly GalleryEntry[] = [
  {
    id: "01",
    subject: "control room, late afternoon",
    caption: "SSL AWS 948, window to the live room, house light off.",
    note: "Pulled the overheads once the sun dropped past the ridge.",
    location: "CR · N 34°58′",
    texture: "emerald",
  },
  {
    id: "02",
    subject: "live room, drum tracking",
    caption: "Quartet setup. Two pairs of room mics, one pair far-field.",
    note: "Carpet lifted for the bridge. Stone fireplace opens the room up.",
    location: "LR",
    texture: "sagebrush",
  },
  {
    id: "03",
    subject: "porch, load-in",
    caption: "Cedar decking, morning light, cables still coiled.",
    note: "Porch handles cellos, amps, and coffee equally well.",
    location: "EXT · W",
    texture: "goldenhour",
  },
  {
    id: "04",
    subject: "vocal booth, signal chain",
    caption: "U47 → BAE 1073 → LA-2A. Single-source, no bus.",
    note: "Wood lamellae tuned for folk baritone; thicker panel for soprano.",
    location: "VB",
    texture: "sunset",
  },
  {
    id: "05",
    subject: "trail to the lake",
    caption: "Six minutes, maybe seven. Taken between takes on the bridge.",
    note: "Everyone writes better after they walk it. No known exception.",
    location: "EXT",
    texture: "seafoam",
  },
  {
    id: "06",
    subject: "cabin kitchen, evening",
    caption: "Residential side. Supper, session notes, the usual.",
    note: "Bands cook one night, we cook one night. It is the rule.",
    location: "CAB",
    texture: "coral",
  },
  {
    id: "07",
    subject: "outboard rack, warm-up",
    caption: "1176s, Fairchild clone, the tube pre we keep borrowing back.",
    note: "Warmed up a half-hour before the first take so nothing drifts.",
    location: "CR",
    texture: "starburst",
  },
];

export default function VariantAGallery() {
  const [current, setCurrent] = useState(0);
  const entry = ENTRIES[current] ?? ENTRIES[0];

  return (
    <>
      <VariantNav variant="a" active="gallery" />
      <main className="relative isolate overflow-hidden bg-washed-black">
        <header className="relative px-6 pt-14 pb-10 md:px-10 md:pt-20 md:pb-14">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 border-b border-sand/15 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label-text mb-3 text-[10px] text-sand/70">
                Chapter 02 · Gallery
              </p>
              <h1 className="headline-primary text-[2.5rem] leading-[1.05] text-warm-white md:text-[3.25rem]">
                <span className="text-sand">Field contacts,</span> in the
                order we found them.
              </h1>
            </div>
            <p className="body-text-small max-w-sm text-ivory/55">
              A single frame at a time. The strip below collects the contacts;
              each margin note is a small field entry from the session log.
            </p>
          </div>
        </header>

        <section className="relative px-6 pb-14 md:px-10 md:pb-20">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_18rem] md:gap-14">
            {/* Stage */}
            <div>
              <div className="relative">
                <div className="border border-sand/20 bg-washed-black p-4 md:p-5">
                  <PlaceholderFrame
                    key={entry.id}
                    texture={entry.texture}
                    index={entry.id}
                    subject={entry.subject}
                    ratio="3/2"
                  />
                  <div className="mt-4 flex items-baseline justify-between gap-6 border-t border-sand/12 pt-3">
                    <p className="body-text-small italic text-ivory/70">
                      {entry.caption}
                    </p>
                    <p className="label-text shrink-0 text-[10px] text-ivory/40">
                      {entry.location}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="label-text text-[10px] text-ivory/45">
                  <span className="text-sand">
                    {String(current + 1).padStart(2, "0")}
                  </span>
                  <span className="mx-2 text-ivory/25">/</span>
                  <span>{String(ENTRIES.length).padStart(2, "0")}</span>
                </div>
                <div className="flex items-center gap-4 text-ivory/40">
                  <button
                    type="button"
                    className="label-text text-[11px] transition-colors duration-500 hover:text-sand"
                    onClick={() =>
                      setCurrent((c) =>
                        c === 0 ? ENTRIES.length - 1 : c - 1,
                      )
                    }
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    className="label-text text-[11px] transition-colors duration-500 hover:text-sand"
                    onClick={() => setCurrent((c) => (c + 1) % ENTRIES.length)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>

            {/* Margin note */}
            <aside className="relative md:pt-3">
              <p className="eyebrow mb-3 text-sand/55">Margin note · {entry.id}</p>
              <p className="body-text-small italic text-ivory/65">
                {entry.note}
              </p>
              <div className="section-rule-solid my-8 max-w-[5rem]" />
              <p className="eyebrow mb-3 text-sand/55">Keep in mind</p>
              <ul className="space-y-3 text-ivory/55">
                <li className="body-text-small">
                  Every image on the live site is a real frame from a real
                  session, captioned by the engineer on the day.
                </li>
                <li className="body-text-small">
                  No rooms-we-don&apos;t-have. No gear-we-don&apos;t-run.
                </li>
                <li className="body-text-small">
                  Seasons matter: the studio looks different in February
                  than it does in August, and we show that.
                </li>
              </ul>
            </aside>
          </div>
        </section>

        {/* Filmstrip */}
        <section className="relative px-6 pb-20 md:px-10 md:pb-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-baseline justify-between border-b border-sand/15 pb-4">
              <p className="eyebrow text-sand/55">Contacts</p>
              <p className="label-text text-[10px] text-ivory/40">
                {ENTRIES.length} frames
              </p>
            </div>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-7 md:gap-3 md:overflow-visible">
              {ENTRIES.map((e, i) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-pressed={i === current}
                  className={`group/contact relative shrink-0 snap-start text-left transition-colors md:shrink md:snap-none`}
                >
                  <div
                    className={`relative w-44 border md:w-auto ${
                      i === current
                        ? "border-sand/60"
                        : "border-sand/15 group-hover/contact:border-sand/35"
                    }`}
                  >
                    <PlaceholderFrame
                      texture={e.texture}
                      index={e.id}
                      subject={e.subject}
                      ratio="4/3"
                    />
                  </div>
                  <p className="mt-2 flex items-baseline justify-between gap-2">
                    <span
                      className={`label-text text-[10px] ${
                        i === current ? "text-sand" : "text-ivory/45"
                      }`}
                    >
                      {e.id}
                    </span>
                    <span className="body-text-small truncate text-[11px] italic text-ivory/55">
                      {e.subject}
                    </span>
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
