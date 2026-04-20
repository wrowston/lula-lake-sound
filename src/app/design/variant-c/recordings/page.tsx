"use client";

import { Fragment, useMemo, useState } from "react";

import { VariantNav } from "../../_components/variant-nav";

type Column = "id" | "artist" | "title" | "genre" | "year" | "role" | "duration";

type Session = {
  readonly id: string;
  readonly artist: string;
  readonly title: string;
  readonly genre: string;
  readonly year: string;
  readonly role: string;
  readonly duration: string;
  readonly bpm: string;
  readonly key: string;
  readonly chain: string;
};

const SESSIONS: readonly Session[] = [
  {
    id: "S-014",
    artist: "Mountain Echo",
    title: "Bridges in February",
    genre: "Indie folk",
    year: "’26",
    role: "Tracking / Mix",
    duration: "3:42",
    bpm: "86",
    key: "G maj",
    chain: "Royer 121 · Neve 1073 · ATR-102",
  },
  {
    id: "S-017",
    artist: "River Stones",
    title: "Sometimes a Psalm",
    genre: "Chamber folk",
    year: "’26",
    role: "Tracking / Mix",
    duration: "4:11",
    bpm: "72",
    key: "D min",
    chain: "U47 · BAE 1073 · LA-2A",
  },
  {
    id: "S-021",
    artist: "Digital Forest",
    title: "Lamp / Still",
    genre: "Electronic / acoustic",
    year: "’25",
    role: "Recording / Hybrid mix",
    duration: "5:08",
    bpm: "104",
    key: "F# min",
    chain: "KM184 · API 512c · Distressor",
  },
  {
    id: "S-029",
    artist: "Evelyn Parke",
    title: "Let the House Forget",
    genre: "Singer-songwriter",
    year: "’25",
    role: "Tracking / Mix / Master ref",
    duration: "3:27",
    bpm: "68",
    key: "C maj",
    chain: "Coles 4038 · Neve 1073 · Fairchild 660",
  },
  {
    id: "S-031",
    artist: "Pine Orchestra",
    title: "Long Walk, Short Bridge",
    genre: "Film / TV score",
    year: "’25",
    role: "Recording",
    duration: "2:58",
    bpm: "90",
    key: "A min",
    chain: "DPA 4006 pair · Millennia HV-3",
  },
  {
    id: "S-034",
    artist: "Alder & Hart",
    title: "Somewhere Between Verses",
    genre: "Americana",
    year: "’24",
    role: "Tracking / Mix",
    duration: "4:35",
    bpm: "92",
    key: "E maj",
    chain: "SM7 · BAE 1073 · 1176",
  },
];

type SortState = { readonly column: Column; readonly dir: "asc" | "desc" };

const COLUMN_LABELS: Record<Column, string> = {
  id: "ID",
  artist: "Artist",
  title: "Title",
  genre: "Genre",
  year: "Year",
  role: "Role",
  duration: "Dur.",
};

function compare(a: Session, b: Session, column: Column): number {
  if (column === "duration") {
    return toSeconds(a.duration) - toSeconds(b.duration);
  }
  return a[column].localeCompare(b[column]);
}

function toSeconds(d: string): number {
  const [m, s] = d.split(":").map((x) => parseInt(x, 10));
  return (m || 0) * 60 + (s || 0);
}

function Waveform({ seed }: { readonly seed: number }) {
  return (
    <div className="flex h-10 w-full items-center gap-[2px] overflow-hidden">
      {Array.from({ length: 100 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="bg-sand/60"
          style={{
            width: 2,
            height: `${20 + ((i * 53 + seed * 17) % 80)}%`,
          }}
        />
      ))}
    </div>
  );
}

export default function VariantCRecordings() {
  const [sort, setSort] = useState<SortState>({ column: "year", dir: "desc" });
  const [expanded, setExpanded] = useState<string | null>("S-014");

  const sorted = useMemo(() => {
    const list = [...SESSIONS];
    list.sort((a, b) => {
      const v = compare(a, b, sort.column);
      return sort.dir === "asc" ? v : -v;
    });
    return list;
  }, [sort]);

  function onSort(column: Column) {
    setSort((prev) =>
      prev.column === column
        ? { column, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { column, dir: "asc" },
    );
  }

  return (
    <>
      <VariantNav variant="c" active="recordings" />
      <main className="relative isolate overflow-hidden">
        {/* Masthead */}
        <header className="relative px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-14">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 border-b border-sand/15 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label-text mb-3 text-[10px] text-sand/70">
                § III · Session log
              </p>
              <h1 className="headline-primary text-[2.5rem] leading-[1.04] text-warm-white md:text-[3.5rem]">
                <span className="text-ivory">Recordings,</span> as
                a log.
              </h1>
            </div>
            <p className="body-text-small max-w-sm text-ivory/55">
              Sortable table of recent sessions. Click a row to expand the
              signal chain and waveform ticker. Best on desktop; stacks to
              cards on mobile.
            </p>
          </div>
        </header>

        {/* Table — desktop */}
        <section className="relative px-6 py-10 md:px-10 md:py-16">
          <div className="mx-auto hidden w-full max-w-6xl border border-sand/15 md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-sand/15 bg-washed-black/45">
                  {(
                    ["id", "artist", "title", "genre", "year", "role", "duration"] as Column[]
                  ).map((col) => (
                    <th
                      key={col}
                      className="label-text select-none px-4 py-3 text-[10px] text-ivory/55"
                    >
                      <button
                        type="button"
                        onClick={() => onSort(col)}
                        className={`group/th flex items-center gap-1.5 transition-colors duration-500 hover:text-sand ${
                          sort.column === col ? "text-sand" : ""
                        }`}
                      >
                        {COLUMN_LABELS[col]}
                        <span
                          aria-hidden
                          className={`text-[9px] ${
                            sort.column === col ? "opacity-85" : "opacity-30 group-hover/th:opacity-60"
                          }`}
                        >
                          {sort.column === col && sort.dir === "asc" ? "▲" : "▼"}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const isOpen = expanded === s.id;
                  return (
                    <Fragment key={s.id}>
                      <tr
                        className={`group/row cursor-pointer border-b border-sand/10 transition-colors hover:bg-washed-black/45 ${
                          isOpen ? "bg-washed-black/55" : i % 2 === 1 ? "bg-washed-black/25" : ""
                        }`}
                        onClick={() => setExpanded(isOpen ? null : s.id)}
                      >
                        <td className="body-text-small px-4 py-4 text-[12px] text-sand">
                          {s.id}
                        </td>
                        <td className="body-text px-4 py-4 text-[13px] text-ivory/80">
                          {s.artist}
                        </td>
                        <td className="body-text px-4 py-4 text-[13px] text-warm-white">
                          {s.title}
                        </td>
                        <td className="body-text-small px-4 py-4 text-[12px] text-ivory/55">
                          {s.genre}
                        </td>
                        <td className="label-text px-4 py-4 text-[10px] text-ivory/60">
                          {s.year}
                        </td>
                        <td className="body-text-small px-4 py-4 text-[12px] text-ivory/55">
                          {s.role}
                        </td>
                        <td className="label-text px-4 py-4 text-right text-[10px] text-ivory/55">
                          {s.duration}
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="border-b border-sand/15 bg-washed-black/65">
                          <td colSpan={7} className="px-4 py-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-[10rem_minmax(0,1fr)_14rem]">
                              <div>
                                <p className="eyebrow mb-2 text-sand/55">BPM · Key</p>
                                <p className="body-text text-sand">
                                  {s.bpm} · {s.key}
                                </p>
                              </div>
                              <div>
                                <p className="eyebrow mb-2 text-sand/55">Waveform · reference</p>
                                <Waveform seed={toSeconds(s.duration)} />
                              </div>
                              <div className="md:text-right">
                                <p className="eyebrow mb-2 text-sand/55">
                                  Signal chain
                                </p>
                                <p className="body-text-small text-ivory/65">
                                  {s.chain}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="mx-auto flex max-w-6xl flex-col gap-3 md:hidden">
            <div className="flex items-center justify-between border-b border-sand/15 pb-3">
              <p className="eyebrow text-sand/55">Sort</p>
              <select
                aria-label="Sort sessions"
                value={sort.column}
                onChange={(e) =>
                  setSort({ column: e.target.value as Column, dir: "desc" })
                }
                className="border border-sand/15 bg-washed-black px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-ivory/70"
              >
                {(Object.keys(COLUMN_LABELS) as Column[]).map((c) => (
                  <option key={c} value={c}>
                    {COLUMN_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            {sorted.map((s) => {
              const isOpen = expanded === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className={`border border-sand/15 p-5 text-left transition-colors ${
                    isOpen ? "bg-washed-black/70" : "bg-washed-black/40"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="label-text text-[10px] text-sand">{s.id}</span>
                    <span className="label-text text-[10px] text-ivory/45">
                      {s.year} · {s.duration}
                    </span>
                  </div>
                  <p className="body-text mt-3 text-warm-white">{s.title}</p>
                  <p className="body-text-small mt-1 text-ivory/60">
                    {s.artist} <span className="text-ivory/35">· {s.genre}</span>
                  </p>
                  {isOpen ? (
                    <div className="mt-5 border-t border-sand/12 pt-4">
                      <p className="eyebrow mb-2 text-sand/55">Chain</p>
                      <p className="body-text-small text-ivory/65">{s.chain}</p>
                      <div className="mt-4">
                        <Waveform seed={toSeconds(s.duration)} />
                      </div>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {/* Footer line */}
        <section className="relative px-6 py-14 md:px-10 md:py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 border-t border-sand/15 pt-10 md:flex-row md:items-center">
            <p className="body-text-small max-w-md text-ivory/55">
              Full session log and extended credits available on request.
              This page shows the most recent {SESSIONS.length} entries.
            </p>
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
