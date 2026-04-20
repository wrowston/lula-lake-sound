import Image from "next/image";

import { PlaceholderFrame } from "../../_components/placeholder-frame";
import { VariantNav } from "../../_components/variant-nav";

/**
 * Variant B · Gallery — "Resonance".
 *
 * Horizontal drift on desktop (CSS scroll-snap, no JS) — vertical river
 * on mobile. Prints float at different widths and offsets against the
 * textured ground so the wall reads as curated rather than uniform.
 */

type Entry = {
  readonly id: string;
  readonly texture:
    | "emerald"
    | "sagebrush"
    | "seafoam"
    | "sunset"
    | "goldenhour"
    | "starburst"
    | "coral";
  readonly subject: string;
  readonly caption: string;
  readonly size: "sm" | "md" | "lg";
  readonly ratio: string;
  readonly offset: "top" | "center" | "bottom";
};

const ENTRIES: readonly Entry[] = [
  {
    id: "01",
    texture: "emerald",
    subject: "control room, window light",
    caption: "SSL AWS 948 · afternoon",
    size: "lg",
    ratio: "4/5",
    offset: "top",
  },
  {
    id: "02",
    texture: "sagebrush",
    subject: "live room, strings setup",
    caption: "Live room · quartet",
    size: "md",
    ratio: "3/2",
    offset: "bottom",
  },
  {
    id: "03",
    texture: "goldenhour",
    subject: "porch, cables and coffee",
    caption: "Load-in · cedar porch",
    size: "sm",
    ratio: "1/1",
    offset: "center",
  },
  {
    id: "04",
    texture: "sunset",
    subject: "outboard rack, warm tubes",
    caption: "Warm-up · outboard",
    size: "md",
    ratio: "16/10",
    offset: "top",
  },
  {
    id: "05",
    texture: "seafoam",
    subject: "trail to the lake",
    caption: "Trail · between takes",
    size: "lg",
    ratio: "3/4",
    offset: "bottom",
  },
  {
    id: "06",
    texture: "coral",
    subject: "cabin kitchen, supper",
    caption: "Residential · evening",
    size: "sm",
    ratio: "1/1",
    offset: "center",
  },
  {
    id: "07",
    texture: "starburst",
    subject: "night control room",
    caption: "Mix night · lamps only",
    size: "md",
    ratio: "3/2",
    offset: "top",
  },
  {
    id: "08",
    texture: "emerald",
    subject: "window detail, morning",
    caption: "First cue · morning",
    size: "sm",
    ratio: "4/5",
    offset: "bottom",
  },
];

const SIZE_WIDTHS: Record<Entry["size"], string> = {
  sm: "w-[68vw] sm:w-[44vw] md:w-[22rem]",
  md: "w-[80vw] sm:w-[52vw] md:w-[28rem]",
  lg: "w-[88vw] sm:w-[60vw] md:w-[34rem]",
};

const OFFSETS: Record<Entry["offset"], string> = {
  top: "md:mt-0",
  center: "md:mt-16",
  bottom: "md:mt-32",
};

export default function VariantBGallery() {
  return (
    <>
      <VariantNav variant="b" active="gallery" />
      <main className="relative isolate overflow-hidden">
        {/* Ambient ground */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-chladni-1 opacity-35" />

        <header className="relative px-6 pt-16 pb-8 md:px-10 md:pt-24 md:pb-12">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 border-b border-sand/10 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow mb-4 text-gold/75">Resonance · Gallery</p>
              <h1 className="headline-primary text-[2.5rem] leading-[1.04] text-warm-white md:text-[3.5rem]">
                <span className="text-gold">Drift through</span>{" "}
                the rooms.
              </h1>
            </div>
            <p className="body-text-small max-w-sm text-ivory/55">
              Scroll left on desktop · down on mobile. The wall is curated,
              not uniform: sizes, offsets, and grounds shift to match the
              rhythm of each room.
            </p>
          </div>
        </header>

        {/* Horizontal river — desktop */}
        <section className="relative pb-16 md:pb-24">
          <div className="hidden md:block">
            <div
              className="relative w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
              role="region"
              aria-label="Gallery — scroll horizontally"
            >
              <ul className="relative flex h-[80vh] items-center gap-10 px-10 pr-40">
                {ENTRIES.map((e) => (
                  <li
                    key={e.id}
                    className={`relative shrink-0 snap-center ${SIZE_WIDTHS[e.size]} ${OFFSETS[e.offset]}`}
                  >
                    <div className="border border-sand/15 bg-washed-black/65 p-3">
                      <PlaceholderFrame
                        texture={e.texture}
                        index={e.id}
                        subject={e.subject}
                        ratio={e.ratio}
                      />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-4">
                      <span className="label-text text-[10px] text-gold/85">
                        {e.id}
                      </span>
                      <span className="body-text-small text-[11px] italic text-ivory/60">
                        {e.caption}
                      </span>
                    </div>
                  </li>
                ))}

                {/* Trailing marker */}
                <li className="shrink-0 pl-4 pr-16">
                  <div className="flex flex-col items-start justify-center gap-4">
                    <Image
                      src="/Chladni/CHLADNI_clean.png"
                      alt=""
                      width={140}
                      height={140}
                      aria-hidden
                      className="h-16 w-auto opacity-50 mix-blend-screen"
                    />
                    <p className="eyebrow text-gold/65">End of reel</p>
                    <p className="body-text-small max-w-[14rem] text-ivory/55">
                      Eight frames. Live site pulls from the studio archive.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Desktop scroll hint */}
            <div className="mx-auto mt-8 flex max-w-6xl items-center justify-between border-t border-sand/10 px-10 pt-5 text-ivory/40">
              <span className="label-text text-[10px]">Scroll sideways</span>
              <span className="label-text text-[10px]">
                {ENTRIES.length} frames · curated wall
              </span>
            </div>
          </div>

          {/* Vertical river — mobile */}
          <div className="md:hidden">
            <ul className="flex flex-col gap-10 px-6 pb-12">
              {ENTRIES.map((e, i) => (
                <li
                  key={e.id}
                  className={`relative ${
                    i % 3 === 0
                      ? "ml-0 mr-10"
                      : i % 3 === 1
                        ? "ml-10 mr-0"
                        : "ml-4 mr-4"
                  }`}
                >
                  <div className="border border-sand/15 bg-washed-black/65 p-3">
                    <PlaceholderFrame
                      texture={e.texture}
                      index={e.id}
                      subject={e.subject}
                      ratio={e.ratio}
                    />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-4">
                    <span className="label-text text-[10px] text-gold/85">
                      {e.id}
                    </span>
                    <span className="body-text-small text-[11px] italic text-ivory/60">
                      {e.caption}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
