"use client";

import { useMemo, useState } from "react";

import { PlaceholderFrame } from "../../_components/placeholder-frame";
import { VariantNav } from "../../_components/variant-nav";

type Category = "all" | "rooms" | "gear" | "grounds" | "sessions";

type Frame = {
  readonly id: string;
  readonly subject: string;
  readonly caption: string;
  readonly category: Exclude<Category, "all">;
  readonly texture:
    | "emerald"
    | "sagebrush"
    | "seafoam"
    | "sunset"
    | "goldenhour"
    | "starburst"
    | "coral";
};

const FRAMES: readonly Frame[] = [
  { id: "01", subject: "control room, afternoon", caption: "CR · console", category: "rooms", texture: "emerald" },
  { id: "02", subject: "live room, quartet setup", caption: "LR · strings", category: "rooms", texture: "sagebrush" },
  { id: "03", subject: "vocal booth, single source", caption: "VB · vocal", category: "rooms", texture: "seafoam" },
  { id: "04", subject: "outboard rack, warming", caption: "Rack · outboard", category: "gear", texture: "sunset" },
  { id: "05", subject: "microphone locker", caption: "Mics · locker", category: "gear", texture: "goldenhour" },
  { id: "06", subject: "SSL AWS 948 detail", caption: "Console · detail", category: "gear", texture: "starburst" },
  { id: "07", subject: "trail, first snow", caption: "Trail · winter", category: "grounds", texture: "emerald" },
  { id: "08", subject: "lake, pre-dawn", caption: "Lake · dawn", category: "grounds", texture: "seafoam" },
  { id: "09", subject: "cedar porch, summer", caption: "Porch · summer", category: "grounds", texture: "coral" },
  { id: "10", subject: "band, live to tape", caption: "Session · band", category: "sessions", texture: "sagebrush" },
  { id: "11", subject: "piano overdub, late", caption: "Session · overdub", category: "sessions", texture: "goldenhour" },
  { id: "12", subject: "string date, wide shot", caption: "Session · strings", category: "sessions", texture: "sunset" },
];

const CATEGORIES: readonly { id: Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rooms", label: "Rooms" },
  { id: "gear", label: "Gear" },
  { id: "grounds", label: "Grounds" },
  { id: "sessions", label: "Sessions" },
];

export default function VariantCGallery() {
  const [active, setActive] = useState<Category>("all");
  const [lightbox, setLightbox] = useState<Frame | null>(null);

  const visible = useMemo(
    () => (active === "all" ? FRAMES : FRAMES.filter((f) => f.category === active)),
    [active],
  );

  return (
    <>
      <VariantNav variant="c" active="gallery" />
      <main className="relative isolate overflow-hidden">
        {/* Masthead */}
        <header className="relative px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-14">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 border-b border-sand/15 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label-text mb-3 text-[10px] text-sand/70">
                § II · Contact sheet
              </p>
              <h1 className="headline-primary text-[2.5rem] leading-[1.04] text-warm-white md:text-[3.5rem]">
                <span className="text-ivory">Proof sheet,</span>{" "}
                indexed and filtered.
              </h1>
            </div>
            <p className="body-text-small max-w-sm text-ivory/55">
              {FRAMES.length} frames · filter by category · click any frame
              to open the plate card.
            </p>
          </div>
        </header>

        {/* Filter bar — sticky */}
        <div className="sticky top-[100px] z-20 border-b border-sand/15 bg-washed-black/92 backdrop-blur-[2px]">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-6 overflow-x-auto px-6 py-4 md:px-10">
            <span className="label-text shrink-0 text-[10px] text-sand/55">
              Filter
            </span>
            <span className="h-3 w-px shrink-0 bg-sand/15" aria-hidden />
            <div className="flex items-center gap-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActive(c.id)}
                  aria-pressed={active === c.id}
                  className={`relative shrink-0 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors duration-500 ${
                    active === c.id
                      ? "border border-sand/60 bg-sand/5 text-sand"
                      : "border border-transparent text-ivory/50 hover:text-sand"
                  }`}
                >
                  {c.label}
                  <span className="ml-2 text-[9px] text-ivory/35">
                    {c.id === "all"
                      ? FRAMES.length
                      : FRAMES.filter((f) => f.category === c.id).length}
                  </span>
                </button>
              ))}
            </div>
            <span className="ml-auto shrink-0 label-text text-[10px] text-ivory/40">
              Showing {visible.length} of {FRAMES.length}
            </span>
          </div>
        </div>

        {/* Grid */}
        <section className="relative px-6 py-14 md:px-10 md:py-20">
          <ul className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {visible.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => setLightbox(f)}
                  className="group/frame block w-full border border-sand/15 bg-washed-black/50 p-2 text-left transition-colors hover:border-sand/45"
                >
                  <PlaceholderFrame
                    texture={f.texture}
                    ratio="1/1"
                    index={f.id}
                    subject={f.subject}
                  />
                  <div className="mt-2 flex items-baseline justify-between gap-2 px-1">
                    <span className="label-text text-[9px] text-sand/70">
                      {f.id}
                    </span>
                    <span className="body-text-small truncate text-[11px] italic text-ivory/55">
                      {f.caption}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {visible.length === 0 ? (
            <div className="mx-auto mt-12 flex max-w-3xl items-center justify-center border border-sand/15 bg-washed-black/40 px-10 py-20">
              <p className="body-text-small text-ivory/45">
                No frames match the current filter.
              </p>
            </div>
          ) : null}
        </section>

        {/* Lightbox / plate card */}
        {lightbox ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="frame-caption"
            className="fixed inset-0 z-50 flex items-center justify-center bg-washed-black/92 px-6 py-12"
            onClick={() => setLightbox(null)}
          >
            <div
              className="relative w-full max-w-4xl border border-sand/15 bg-washed-black/85 p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-sand/15 pb-3">
                <p className="label-text text-[10px] text-sand/70">
                  Frame {lightbox.id} · {lightbox.category}
                </p>
                <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  aria-label="Close"
                  className="label-text text-[10px] text-ivory/55 transition-colors hover:text-sand"
                >
                  Close ✕
                </button>
              </div>
              <PlaceholderFrame
                texture={lightbox.texture}
                ratio="16/10"
                index={lightbox.id}
                subject={lightbox.subject}
              />
              <p
                id="frame-caption"
                className="mt-4 border-t border-sand/12 pt-3 text-[12px] italic text-ivory/65"
              >
                {lightbox.caption} — {lightbox.subject}
              </p>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
