"use client";

import { useState } from "react";

import { VariantNav } from "../../_components/variant-nav";

type Session = {
  readonly id: string;
  readonly artist: string;
  readonly title: string;
  readonly role: string;
  readonly genre: string;
  readonly tracked: string;
  readonly duration: string;
  readonly notes: string;
  readonly chain: readonly string[];
};

const SESSIONS: readonly Session[] = [
  {
    id: "S-014",
    artist: "Mountain Echo",
    title: "Bridges in February",
    role: "Tracking · Mixing",
    genre: "Indie folk",
    tracked: "Feb · 6 days",
    duration: "3:42",
    notes:
      "Band of five. Live to two-inch for the rhythm section, overdubs on the porch. Weather cooperated except the Tuesday.",
    chain: ["Royer 121 · pair", "Coles 4038", "Neve 1073 × 8", "ATR-102"],
  },
  {
    id: "S-017",
    artist: "River Stones",
    title: "Sometimes a Psalm",
    role: "Tracking · Mixing",
    genre: "Chamber folk",
    tracked: "April · 4 days",
    duration: "4:11",
    notes:
      "Voice and guitar first, cello and fiddle on day three. The vocal is the third take, single mic, no doubles.",
    chain: ["Telefunken U47", "BAE 1073", "LA-2A", "Pultec EQP-1A"],
  },
  {
    id: "S-021",
    artist: "Digital Forest",
    title: "Lamp / Still",
    role: "Recording · Hybrid mix",
    genre: "Electronic / acoustic",
    tracked: "July · 5 days",
    duration: "5:08",
    notes:
      "Analogue synthesis captured live, drum programming printed to tape for glue. Room ambience bussed through the reverb chamber.",
    chain: ["Neumann KM184 · room", "API 512c", "Distressor", "Studer A80"],
  },
  {
    id: "S-029",
    artist: "Evelyn Parke",
    title: "Let the House Forget",
    role: "Tracking · Mixing · Master ref",
    genre: "Singer-songwriter",
    tracked: "October · 3 days",
    duration: "3:27",
    notes:
      "One vocalist, one piano, one acoustic. Keeps arrangement on the floor: no overdubs beyond the bridge double.",
    chain: ["Coles 4038 · pair", "Neve 1073", "Fairchild 660"],
  },
];

function Player({ sessionId }: { readonly sessionId: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="flex items-center gap-4 border border-sand/15 bg-washed-black/60 px-4 py-3">
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? `Pause ${sessionId}` : `Play ${sessionId}`}
        className="flex size-9 shrink-0 items-center justify-center border border-sand/30 text-sand transition-colors hover:border-sand hover:bg-sand hover:text-washed-black"
      >
        {playing ? (
          <svg className="size-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
            <rect x="2.5" y="1.5" width="2" height="9" />
            <rect x="7.5" y="1.5" width="2" height="9" />
          </svg>
        ) : (
          <svg className="size-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
            <path d="M2.5 1.5 L10 6 L2.5 10.5 Z" />
          </svg>
        )}
      </button>

      {/* Mock waveform — staggered ticks */}
      <div className="flex h-6 flex-1 items-center gap-[2px] overflow-hidden">
        {Array.from({ length: 56 }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={playing ? "bg-sand/70" : "bg-sand/25"}
            style={{
              width: 2,
              height: `${30 + ((i * 37) % 70)}%`,
              transition: "background 400ms",
            }}
          />
        ))}
      </div>

      <span className="label-text shrink-0 text-[10px] text-ivory/40">
        {playing ? "▸ playing" : "standby"}
      </span>
    </div>
  );
}

export default function VariantARecordings() {
  return (
    <>
      <VariantNav variant="a" active="recordings" />
      <main className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-texture-stone opacity-55" />

        <header className="relative px-6 pt-14 pb-10 md:px-10 md:pt-20 md:pb-14">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 border-b border-sand/15 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label-text mb-3 text-[10px] text-sand/70">
                Chapter 03 · Recordings
              </p>
              <h1 className="headline-primary text-[2.5rem] leading-[1.05] text-warm-white md:text-[3.25rem]">
                <span className="text-sand">Session log,</span> pages
                turned out loud.
              </h1>
            </div>
            <p className="body-text-small max-w-sm text-ivory/55">
              Four recent sessions. Each entry carries the session number, a
              short engineer&apos;s note, and the signal chain in the margin.
            </p>
          </div>
        </header>

        <section className="relative px-6 pb-24 md:px-10 md:pb-32">
          <div className="mx-auto flex max-w-5xl flex-col">
            {SESSIONS.map((s, i) => (
              <article
                key={s.id}
                className={`grid grid-cols-1 gap-6 py-10 md:grid-cols-[auto_minmax(0,1fr)_14rem] md:gap-10 md:py-14 ${
                  i === 0 ? "" : "border-t border-sand/12"
                }`}
              >
                <div className="md:pt-1">
                  <p className="label-text mb-2 text-[10px] text-sand/60">
                    {s.id}
                  </p>
                  <p className="body-text-small text-ivory/45">{s.tracked}</p>
                </div>

                <div className="min-w-0">
                  <p className="eyebrow mb-3 text-sand/55">
                    {s.genre} · {s.role}
                  </p>
                  <h3 className="headline-secondary mb-1 text-2xl text-warm-white md:text-[1.875rem]">
                    {s.title}
                  </h3>
                  <p className="body-text mb-5 text-ivory/60">
                    <span className="text-sand/80">{s.artist}</span>
                    <span className="mx-3 text-ivory/25">·</span>
                    <span className="italic">{s.duration}</span>
                  </p>
                  <p className="body-text mb-6 italic text-ivory/70">
                    &ldquo;{s.notes}&rdquo;
                  </p>
                  <Player sessionId={s.id} />
                </div>

                <aside className="md:border-l md:border-sand/12 md:pl-6">
                  <p className="eyebrow mb-3 text-sand/55">Signal chain</p>
                  <ul className="space-y-2 text-ivory/60">
                    {s.chain.map((link) => (
                      <li key={link} className="body-text-small">
                        <span className="mr-2 text-sand/45">›</span>
                        {link}
                      </li>
                    ))}
                  </ul>
                </aside>
              </article>
            ))}

            <div className="mt-12 flex flex-col items-start gap-4 border-t border-sand/15 pt-10 md:flex-row md:items-center md:justify-between">
              <p className="body-text-small text-ivory/50">
                The full session log is maintained in the studio journal.
                Extended credits and engineering notes available on request.
              </p>
              <span className="label-text text-[10px] text-sand underline underline-offset-[6px]">
                Write us for credits
              </span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
