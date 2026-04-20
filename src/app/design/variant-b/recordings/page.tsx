"use client";

import Image from "next/image";
import { useState } from "react";

import { VariantNav } from "../../_components/variant-nav";

type Track = {
  readonly id: string;
  readonly artist: string;
  readonly title: string;
  readonly genre: string;
  readonly duration: string;
  readonly year: string;
  readonly credits: string;
  readonly blurb: string;
  readonly texture:
    | "emerald"
    | "sagebrush"
    | "seafoam"
    | "sunset"
    | "goldenhour"
    | "starburst"
    | "coral";
};

const TEXTURE_SRC: Record<Track["texture"], string> = {
  emerald: "/Textured Backgrounds/LLS_Texture_Emerald.jpg",
  sagebrush: "/Textured Backgrounds/LLS_Texture_Sagebrush.jpg",
  seafoam: "/Textured Backgrounds/LLS_Texture_Seafoam.jpg",
  sunset: "/Textured Backgrounds/LLS_Texture_Sunset.jpg",
  goldenhour: "/Textured Backgrounds/LLS_Texture_GoldenHour.jpg",
  starburst: "/Textured Backgrounds/LLS_Texture_Starburst.jpg",
  coral: "/Textured Backgrounds/LLS_Texture_Coral.jpg",
};

const TRACKS: readonly Track[] = [
  {
    id: "01",
    artist: "Mountain Echo",
    title: "Bridges in February",
    genre: "Indie folk · quartet",
    duration: "3:42",
    year: "’26",
    credits: "Tracking · Mix · Master ref",
    blurb:
      "Live to tape with overdubs on the porch. The bridge is the third take, no edits.",
    texture: "emerald",
  },
  {
    id: "02",
    artist: "River Stones",
    title: "Sometimes a Psalm",
    genre: "Chamber folk",
    duration: "4:11",
    year: "’26",
    credits: "Tracking · Mix",
    blurb:
      "Voice and guitar first, strings on day three. Single-mic vocal, no doubles.",
    texture: "sagebrush",
  },
  {
    id: "03",
    artist: "Digital Forest",
    title: "Lamp / Still",
    genre: "Electronic / acoustic",
    duration: "5:08",
    year: "’25",
    credits: "Recording · Hybrid mix",
    blurb:
      "Analogue synthesis captured live, drums printed to tape, reverb through the chamber.",
    texture: "sunset",
  },
  {
    id: "04",
    artist: "Evelyn Parke",
    title: "Let the House Forget",
    genre: "Singer-songwriter",
    duration: "3:27",
    year: "’25",
    credits: "Tracking · Mix · Master ref",
    blurb:
      "One vocalist, one piano, one acoustic. Arrangement stays on the floor.",
    texture: "goldenhour",
  },
];

function TrackPanel({ track, idx }: { readonly track: Track; readonly idx: number }) {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="relative flex min-h-[92vh] overflow-hidden border-t border-sand/10">
      <div className="absolute inset-0 z-0">
        <Image
          src={TEXTURE_SRC[track.texture]}
          alt=""
          fill
          className="object-cover"
          priority={idx === 0}
          quality={82}
        />
        <div className="absolute inset-0 bg-washed-black/72" />
        <div
          aria-hidden
          className={`absolute inset-0 ${
            idx % 3 === 0
              ? "bg-chladni-1"
              : idx % 3 === 1
                ? "bg-chladni-2"
                : "bg-chladni-3"
          } opacity-50`}
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-washed-black" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-between gap-12 px-6 py-24 md:px-10 md:py-32">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3 text-gold/85">
            <span className="label-text text-[10px]">
              Track {track.id}
            </span>
            <span className="h-3 w-px bg-gold/35" aria-hidden />
            <span className="label-text text-[10px] text-ivory/45">
              {track.year}
            </span>
          </div>
          <span className="label-text text-[10px] text-ivory/45">
            {track.credits}
          </span>
        </div>

        {/* Title block */}
        <div className="max-w-3xl">
          <p className="eyebrow mb-6 text-sand/70">{track.genre}</p>
          <h2 className="headline-primary text-[2.5rem] leading-[1.02] text-warm-white md:text-[4rem]">
            {track.title}
          </h2>
          <p className="mt-6 text-[13px] uppercase tracking-[0.28em] text-gold/85">
            {track.artist}
          </p>
          <p className="editorial-lede mt-10 max-w-xl text-warm-white/75">
            {track.blurb}
          </p>
        </div>

        {/* Player + waveform */}
        <div className="flex flex-col gap-5 border-t border-sand/15 pt-8">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
              className="flex size-12 items-center justify-center border border-sand/40 text-sand transition-colors hover:border-sand hover:bg-sand hover:text-washed-black"
            >
              {playing ? (
                <svg className="size-4" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                  <rect x="2.5" y="1.5" width="2" height="9" />
                  <rect x="7.5" y="1.5" width="2" height="9" />
                </svg>
              ) : (
                <svg className="size-4" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                  <path d="M2.5 1.5 L10 6 L2.5 10.5 Z" />
                </svg>
              )}
            </button>

            <div className="flex h-10 flex-1 items-center gap-[2px] overflow-hidden">
              {Array.from({ length: 120 }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={playing ? "bg-sand/75" : "bg-sand/28"}
                  style={{
                    width: 2,
                    height: `${20 + ((i * 53 + idx * 19) % 80)}%`,
                    transition: "background 500ms",
                  }}
                />
              ))}
            </div>

            <span className="label-text shrink-0 text-[11px] text-ivory/55">
              {track.duration}
            </span>
          </div>
          <p className="label-text text-[10px] text-ivory/35">
            Mix reference · preview only
          </p>
        </div>
      </div>
    </section>
  );
}

export default function VariantBRecordings() {
  return (
    <>
      <VariantNav variant="b" active="recordings" />
      <main className="relative isolate">
        {/* Intro */}
        <section className="relative overflow-hidden px-6 pt-20 pb-16 md:px-10 md:pt-28 md:pb-24">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-chladni-1-2" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 border-b border-sand/10 pb-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow mb-4 text-gold/80">Resonance · Recordings</p>
              <h1 className="headline-primary text-[2.5rem] leading-[1.04] text-warm-white md:text-[3.5rem]">
                <span className="text-gold">Four tracks,</span> one per
                viewport.
              </h1>
              <p className="editorial-lede mt-8 max-w-lg">
                Scroll through a curated reel. Each track gets its own
                textured ground and waveform overlay — the page is designed
                to slow the reader down, not to get them to the next link.
              </p>
            </div>
            <p className="body-text-small max-w-xs text-ivory/55">
              The live site adds a full tracklist below; this exploration
              shows the hero treatment only.
            </p>
          </div>
        </section>

        {TRACKS.map((t, i) => (
          <TrackPanel key={t.id} track={t} idx={i} />
        ))}

        {/* Close */}
        <section className="relative border-t border-sand/10 px-6 py-24 md:px-10 md:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-chladni-2 opacity-40" />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="eyebrow mb-5 text-gold/80">End of reel</p>
            <h2 className="headline-secondary mb-6 text-[1.75rem] text-warm-white md:text-[2.25rem]">
              Book a session where the room is a track.
            </h2>
            <a
              href="mailto:info@lulalakesound.com"
              className="inline-flex items-center gap-3 border border-transparent bg-sand px-10 py-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-washed-black transition-colors duration-500 hover:bg-warm-white"
            >
              Hold a session
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
