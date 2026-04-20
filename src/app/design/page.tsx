import Link from "next/link";
import Image from "next/image";

/**
 * Design Exploration index — INF-45.
 *
 * Three directions produced on top of the refreshed brand landing. Each
 * variant is meaningfully different in information architecture and
 * emotional register, but all honour the same brand tokens:
 * Washed Black ground, Sand + Rust accents, Acumin Wide Semibold display,
 * Titillium body, near-square corners, Chladni plates, and restrained motion.
 */

const variants = [
  {
    id: "A",
    slug: "a",
    name: "Field Notes",
    tagline: "Printed journal · marginalia · editorial voice",
    accent: "text-sand",
    dot: "bg-sand",
    summary:
      "An editorial field journal. Drop caps anchor long-form About prose; pull quotes and margin annotations point to specifics in the imagery. The Gallery is a single full-frame stage with a filmstrip of indexed contacts beneath, each with a small captioned field note. Recordings read like session notes in a leather-bound log: title, tracking date, key gear in the margin, inline player where credits fall.",
  },
  {
    id: "B",
    slug: "b",
    name: "Resonance",
    tagline: "Atmospheric · image-first · Chladni-led rhythm",
    accent: "text-gold",
    dot: "bg-gold",
    summary:
      "Chladni plates, textured fields, and sticky layered panels set the tempo. The About page unfolds as alternating full-bleed image / text rhythm with a persistent sand hairline that never lets the eye drift. The Gallery scrolls horizontally on desktop and stacks into a vertical river on mobile, images floating against textured grounds like prints on a studio wall. Recordings become self-contained full-bleed hero panels with overlaid waveform strips — the most cinematic of the three.",
  },
  {
    id: "C",
    slug: "c",
    name: "Archive",
    tagline: "Dossier · systematic · data-forward",
    accent: "text-ivory",
    dot: "bg-ivory",
    summary:
      "A structured archive. About reads as a three-chapter dossier with Roman-numeral section heads and a persistent data rail (est., elevation, room count, isolation). The Gallery is a taut contact sheet with indexed frames and a category filter (Rooms · Gear · Grounds · Sessions) that never stops looking like a proof sheet. Recordings are a tabular session log with sortable columns and a hover-expandable waveform row — the easiest to scan for A&R and engineers.",
  },
] as const;

const comparisonRows = [
  {
    dimension: "Visual register",
    a: "Editorial, handwritten, intimate",
    b: "Cinematic, atmospheric, layered",
    c: "Structured, systematic, archival",
  },
  {
    dimension: "About approach",
    a: "Drop-cap essay, margin annotations, polaroid inset, 3-beat timeline",
    b: "Full-bleed sticky panels, alternating image/text, Chladni wayfinder rail",
    c: "Roman-numeral chapters, data rail, inline pull stats, founder Q&A",
  },
  {
    dimension: "Gallery style",
    a: "Single stage + filmstrip thumbnails, captioned field notes",
    b: "Horizontal parallax (desktop) / vertical river (mobile), floating prints",
    c: "Tight contact-sheet grid, indexed frames, category filter",
  },
  {
    dimension: "Recordings format",
    a: "Notebook entries — stacked sessions with margin credits, inline player",
    b: "Full-bleed track heroes, waveform overlay, one per viewport",
    c: "Tabular session log, sortable columns, expandable waveform row",
  },
  {
    dimension: "Image density",
    a: "Medium — 1 large + 6 indexed thumbs per section",
    b: "High — full-bleed imagery dominates",
    c: "Medium/high — uniform grid, visual volume without noise",
  },
  {
    dimension: "Primary CTA treatment",
    a: "“Write us” — lettered link in the footnote voice",
    b: "“Hold a session” — solid sand button inside an image panel",
    c: "“Request availability” — outlined, sits at the end of the log",
  },
  {
    dimension: "Mobile behaviour",
    a: "Margins fold under body copy; filmstrip becomes snap-scroll",
    b: "Horizontal galleries collapse to vertical river; panels keep sticky rhythm",
    c: "Table becomes stacked cards; filter bar stays pinned",
  },
  {
    dimension: "Implementation complexity",
    a: "Low/medium — typographic and layout work, no scroll choreography",
    b: "Medium/high — sticky + horizontal scroll, careful mobile fallbacks",
    c: "Low — grid + table, minimal state",
  },
  {
    dimension: "Maintenance",
    a: "Medium — margin notes and captions need curation per session",
    b: "Medium — large imagery must stay curated; art direction matters",
    c: "Low — structured schema makes new entries trivial",
  },
  {
    dimension: "Best for",
    a: "Artists who respond to story and craft — folk, singer-songwriter, film scoring",
    b: "High-visual-impact pitches — labels, destination-session marketing",
    c: "Engineer / A&R evaluation — fast legibility of credits and gear",
  },
] as const;

export default function DesignIndex() {
  return (
    <main className="relative isolate overflow-hidden">
      {/* Ambient ground */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-chladni-2 opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40vh] bg-chladni-3 opacity-40"
      />

      {/* Masthead */}
      <section className="relative px-6 pt-16 pb-20 md:px-10 md:pt-24 md:pb-28">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-6 text-sand/70">
              INF-45 · Design Exploration
            </p>
            <h1 className="headline-primary text-[2.75rem] leading-[1.04] text-warm-white md:text-[3.75rem]">
              Three directions for
              <br />
              <span className="text-sand">About, Gallery, Recordings.</span>
            </h1>
            <div className="section-rule my-10 max-w-[9rem]" />
            <p className="editorial-lede max-w-xl">
              Each variant is a meaningfully different expression of the
              refreshed Lula Lake Sound brand system — same palette, same
              typographic spine, different information architecture, density,
              and rhythm. Review the summaries below, walk each variant, then
              record your choice on the ticket.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <Image
              src="/Logos/Graphic/LLS_Logo_Graphic_Sand.png"
              alt=""
              width={180}
              height={180}
              aria-hidden
              className="h-16 w-auto opacity-80 md:h-20"
            />
            <p className="label-text text-[10px] text-ivory/40">
              Built on <span className="text-sand">feat/brand-landing-refresh</span>
            </p>
          </div>
        </div>
      </section>

      <div aria-hidden className="section-rule mx-auto max-w-6xl" />

      {/* Variant cards */}
      <section className="relative px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-3">
          {variants.map((v) => (
            <Link
              key={v.id}
              href={`/design/variant-${v.slug}`}
              className="group/variant relative flex flex-col justify-between border border-sand/15 bg-washed-black/40 p-8 transition-colors duration-500 hover:border-sand/40 hover:bg-washed-black/60"
            >
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <span className={`size-1.5 ${v.dot}`} aria-hidden />
                  <span className="label-text text-[10px] text-ivory/50">
                    Variant {v.id}
                  </span>
                </div>
                <h2
                  className={`headline-secondary mb-3 text-3xl ${v.accent} md:text-[2.25rem]`}
                >
                  {v.name}
                </h2>
                <p className="eyebrow mb-8 text-ivory/40">{v.tagline}</p>
                <p className="body-text-small text-ivory/65">{v.summary}</p>
              </div>
              <div className="mt-10 flex items-center justify-between border-t border-sand/12 pt-6">
                <span className="label-text text-[10px] text-ivory/45">
                  Walk the variant
                </span>
                <span className="label-text text-[10px] text-sand transition-transform duration-500 group-hover/variant:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div aria-hidden className="section-rule mx-auto max-w-6xl" />

      {/* Comparison */}
      <section className="relative px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-14 flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow mb-5 text-sand/60">Comparison</p>
              <h2 className="headline-secondary text-3xl text-warm-white md:text-[2.5rem]">
                Pros, cons, complexity
              </h2>
            </div>
            <p className="body-text-small max-w-sm text-ivory/55">
              Scan this table alongside the live variants. The bias is stated
              in the recommendation below.
            </p>
          </div>

          {/* Desktop: table. Mobile: stacked. */}
          <div className="hidden overflow-hidden border border-sand/15 md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-sand/15 bg-washed-black/40">
                  <th className="label-text w-1/4 px-5 py-4 text-[10px] text-ivory/45">
                    Dimension
                  </th>
                  <th className="label-text w-1/4 px-5 py-4 text-[10px] text-sand">
                    A · Field Notes
                  </th>
                  <th className="label-text w-1/4 px-5 py-4 text-[10px] text-gold">
                    B · Resonance
                  </th>
                  <th className="label-text w-1/4 px-5 py-4 text-[10px] text-ivory">
                    C · Archive
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.dimension}
                    className={
                      i % 2 === 0
                        ? "border-b border-sand/10"
                        : "border-b border-sand/10 bg-washed-black/25"
                    }
                  >
                    <td className="body-text-small px-5 py-5 text-[12px] text-ivory/80">
                      {row.dimension}
                    </td>
                    <td className="body-text-small px-5 py-5 text-[12px] text-ivory/65">
                      {row.a}
                    </td>
                    <td className="body-text-small px-5 py-5 text-[12px] text-ivory/65">
                      {row.b}
                    </td>
                    <td className="body-text-small px-5 py-5 text-[12px] text-ivory/65">
                      {row.c}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-6 md:hidden">
            {comparisonRows.map((row) => (
              <div
                key={row.dimension}
                className="border border-sand/15 bg-washed-black/40 p-5"
              >
                <p className="eyebrow mb-3 text-sand/55">{row.dimension}</p>
                <dl className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <dt className="label-text text-[9px] text-sand">
                      A · Field Notes
                    </dt>
                    <dd className="body-text-small text-[12px] text-ivory/70">
                      {row.a}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 border-t border-sand/10 pt-3">
                    <dt className="label-text text-[9px] text-gold">
                      B · Resonance
                    </dt>
                    <dd className="body-text-small text-[12px] text-ivory/70">
                      {row.b}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 border-t border-sand/10 pt-3">
                    <dt className="label-text text-[9px] text-ivory">
                      C · Archive
                    </dt>
                    <dd className="body-text-small text-[12px] text-ivory/70">
                      {row.c}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div aria-hidden className="section-rule mx-auto max-w-6xl" />

      {/* Recommendation */}
      <section className="relative px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-[1fr_auto] md:gap-16">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5 text-sand/60">Recommendation</p>
            <h2 className="headline-secondary mb-8 text-3xl text-warm-white md:text-[2.5rem]">
              Build <span className="text-gold">Variant B · Resonance</span>
              <span className="text-ivory"> first.</span>
            </h2>
            <p className="editorial-lede mb-6">
              Resonance leans hardest into what the brand refresh actually
              buys us: the Chladni plates, the textured grounds, and the
              editorial dark wash. The cinematic register also mirrors the
              destination-studio positioning best — place as character,
              immersion over logistics — which shows up most credibly when
              imagery is given room to breathe.
            </p>
            <p className="body-text mb-10 text-ivory/65">
              Field Notes is the close second and the safest fallback: it is
              lower risk, kinder to candid photography, and still reads
              unmistakably as Lula Lake Sound. Archive is the right choice
              only if the client wants the site to be first and foremost an
              evaluative tool for labels and engineers.
            </p>

            <Link
              href="/design/variant-b"
              className="inline-flex items-center gap-3 border border-gold/40 bg-transparent px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold transition-colors duration-500 hover:bg-gold hover:text-washed-black"
            >
              Open Variant B
              <span aria-hidden>→</span>
            </Link>
          </div>

          <aside className="self-start border border-sand/15 bg-washed-black/40 p-7">
            <p className="eyebrow mb-5 text-sand/55">Quick links</p>
            <ul className="space-y-4">
              {variants.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/design/variant-${v.slug}`}
                    className="group/quick flex items-baseline justify-between gap-6 text-ivory/70 transition-colors hover:text-sand"
                  >
                    <span className="body-text-small">
                      <span className={`mr-3 ${v.accent}`}>
                        Variant {v.id}
                      </span>
                      {v.name}
                    </span>
                    <span className="label-text text-[10px] text-ivory/30 transition-transform duration-500 group-hover/quick:translate-x-1">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
