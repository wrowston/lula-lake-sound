import Link from "next/link";

/*
 * Design exploration index — links to all three variants with summaries,
 * comparison table, and recommendation. Presented to the client for review.
 */

const variants = [
  {
    id: "A",
    name: "Cinematic Editorial",
    href: "/design/variant-a",
    accent: "bg-gold/20 border-gold/30 text-gold",
    summary:
      "Magazine-style, dramatic full-bleed imagery with long-scroll narrative storytelling. Inspired by high-end editorial publications and destination studio sites like Sonic Ranch. The About section uses two-column editorial layout with large pull quotes and a horizontal timeline. The Gallery is a masonry grid with hover-reveal captions and full-screen lightbox. Recordings appear as a full-width tracklist with inline waveform visualizations.",
    rationale:
      "This direction leans into the cinematic quality of the studio's mountain setting. It treats every page like a spread in a film magazine — images bleed edge-to-edge, text sits in generous columns, and the scroll itself becomes part of the experience. Ideal if the brand wants to project aspiration and editorial gravitas. The trade-off is higher image density and longer page weight.",
  },
  {
    id: "B",
    name: "Analog Warmth",
    href: "/design/variant-b",
    accent: "bg-gold/20 border-gold/30 text-gold",
    summary:
      "Organic, textured, and intimate. Inspired by vinyl sleeves, field journals, and the tactile quality of tape. The About section uses polaroid-framed imagery with slightly rotated compositions and handcrafted decorative dividers. The Gallery presents a contact-sheet grid where each photo sits in a film-border frame with subtle rotations. Recordings are split into Side A / Side B like a vinyl LP, with a decorative disc element.",
    rationale:
      "This direction channels the analog soul of recording — the physical, hands-on warmth that digital can't replicate. It feels personal, almost intimate, like being invited into someone's studio journal. The rotated frames and LP-format tracklist give the site tactile character that sets it apart from typical studio sites. Best for artists who value craft and authenticity over polish.",
  },
  {
    id: "C",
    name: "Alpine Minimal",
    href: "/design/variant-c",
    accent: "bg-sage/20 border-sage/30 text-sage",
    summary:
      "Clean, grid-driven, Swiss-inspired. Confident negative space and strong typographic hierarchy. The About section uses numbered content blocks (01, 02, 03) in a systematic two-column layout with a data strip. The Gallery features a strict uniform grid with category filter tabs (All, Rooms, Gear, Grounds). Recordings are presented as a structured data table with columns for title, artist, role, genre, year, BPM, and duration.",
    rationale:
      "This direction lets the work speak by getting out of its way. Every element is placed on a strict grid, typography does the heavy lifting, and there's nowhere to hide — which signals confidence. The category-filtered gallery and metadata-rich tracklist serve visitors who want to evaluate the studio's capability quickly. Best for attracting professional engineers and label A&R who value clarity over atmosphere.",
  },
];

const comparisonRows = [
  {
    dimension: "Visual tone",
    a: "Moody, cinematic, atmospheric",
    b: "Warm, organic, handcrafted",
    c: "Clean, systematic, authoritative",
  },
  {
    dimension: "About approach",
    a: "Two-column editorial + timeline + pull quote",
    b: "Polaroid portrait + prose + founder voice",
    c: "Numbered sections + data strip + oversized type",
  },
  {
    dimension: "Gallery style",
    a: "Masonry grid, variable aspect ratios",
    b: "Contact sheet, subtle rotations, film frames",
    c: "Uniform grid, category filter tabs",
  },
  {
    dimension: "Recordings format",
    a: "Full-width tracklist with waveform vis",
    b: "Side A / Side B vinyl LP layout",
    c: "Data table with metadata columns",
  },
  {
    dimension: "Image density",
    a: "High — full-bleed heroes, large gallery",
    b: "Medium — framed images, intentional gaps",
    c: "Medium — uniform thumbnails, controlled",
  },
  {
    dimension: "Primary CTA",
    a: "\"Book a Session\" — prominent solid button",
    b: "\"Start a Conversation\" — outlined, warm",
    c: "\"Inquire\" — minimal, arrow-right",
  },
  {
    dimension: "Mobile gallery",
    a: "Single-column masonry stack",
    b: "2-column contact sheet grid",
    c: "2-column uniform grid with filter",
  },
  {
    dimension: "Mobile recordings",
    a: "Stacked cards, waveform hidden",
    b: "Single-column LP tracklist",
    c: "Compact row with truncated metadata",
  },
  {
    dimension: "Typography delta",
    a: "None — uses existing Acumin/Titillium at large scale",
    b: "None — adds decorative SVG accents alongside existing fonts",
    c: "None — tighter tracking, stronger size contrast",
  },
  {
    dimension: "Implementation complexity",
    a: "Medium-high — masonry layout, parallax overlays, waveform component",
    b: "Medium — CSS rotations, SVG decorations, vinyl disc CSS art",
    c: "Medium-low — grid, tabs, table layout, minimal animation",
  },
  {
    dimension: "Ongoing maintenance",
    a: "Medium — image-heavy, needs curated large photos",
    b: "Low — works well with casual/candid photography",
    c: "Low — structured format, easy to add rows/images",
  },
  {
    dimension: "Content hierarchy",
    a: "Image → Story → Data",
    b: "Story → Image → Craft",
    c: "Data → Image → Action",
  },
];

export default function DesignIndexPage() {
  return (
    <main className="min-h-screen bg-washed-black text-ivory grain-overlay">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-16">
        <Link href="/" className="label-text text-ivory/30 hover:text-sand transition-colors text-[11px] inline-flex items-center gap-2 mb-12">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to site
        </Link>

        <p className="label-text text-sand/50 tracking-[0.25em] mb-4 text-[10px]">
          INF-45 — Design Exploration
        </p>
        <h1
          className="headline-primary text-warm-white leading-[1.1] mb-6"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          Marketing Sections: About, Gallery, Recordings
        </h1>
        <p className="body-text text-ivory/50 max-w-2xl text-lg leading-[1.8]">
          Three distinct design directions for the new marketing pages.
          Each variant splits About, Gallery, and Recordings into separate routes so comps read like
          real pages (mobile and desktop). Pick a variant hub below, then jump between sections with
          the in-page nav. Select one direction to proceed to implementation (INF-46, INF-47, INF-48).
        </p>
      </div>

      {/* Variant cards */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 pb-24 space-y-12">
        {variants.map((v) => (
          <div key={v.id} className="border border-sand/10 p-8 md:p-12 hover:border-sand/20 transition-colors">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className={`inline-block text-[10px] label-text px-3 py-1 border rounded-full mb-4 ${v.accent}`}>
                  Variant {v.id}
                </span>
                <h2 className="headline-secondary text-warm-white text-2xl md:text-3xl">{v.name}</h2>
              </div>
              <Link
                href={v.href}
                className="label-text text-sand/60 hover:text-sand text-[11px] border border-sand/20 hover:border-sand/40 px-5 py-2 transition-all flex items-center gap-2 flex-shrink-0"
              >
                View
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <p className="body-text text-ivory/55 leading-[1.8] mb-6">{v.summary}</p>
            <p className="body-text-small text-ivory/40 leading-[1.8] border-t border-sand/8 pt-6">{v.rationale}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 label-text text-[10px] tracking-[0.12em]">
              <Link href={`${v.href}/about`} className="text-sand/45 hover:text-sand transition-colors">
                About
              </Link>
              <span className="text-ivory/15" aria-hidden>
                ·
              </span>
              <Link href={`${v.href}/gallery`} className="text-sand/45 hover:text-sand transition-colors">
                Gallery
              </Link>
              <span className="text-ivory/15" aria-hidden>
                ·
              </span>
              <Link href={`${v.href}/recordings`} className="text-sand/45 hover:text-sand transition-colors">
                Recordings
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 pb-24">
        <h2 className="headline-secondary text-warm-white text-2xl mb-8">Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-sand/15">
                <th className="label-text text-ivory/30 text-[10px] text-left py-3 px-4 w-1/4">Dimension</th>
                <th className="label-text text-gold/50 text-[10px] text-left py-3 px-4 w-1/4">A — Cinematic</th>
                <th className="label-text text-gold/50 text-[10px] text-left py-3 px-4 w-1/4">B — Analog</th>
                <th className="label-text text-sage text-[10px] text-left py-3 px-4 w-1/4">C — Alpine</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.dimension} className="border-b border-sand/6 hover:bg-charcoal/30 transition-colors">
                  <td className="body-text-small text-ivory/50 py-3 px-4 font-semibold">{row.dimension}</td>
                  <td className="body-text-small text-ivory/40 py-3 px-4">{row.a}</td>
                  <td className="body-text-small text-ivory/40 py-3 px-4">{row.b}</td>
                  <td className="body-text-small text-ivory/40 py-3 px-4">{row.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendation */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 pb-24">
        <div className="border border-gold/15 bg-gold/[0.03] p-8 md:p-12">
          <p className="label-text text-gold/60 tracking-[0.2em] mb-4 text-[10px]">Recommendation</p>
          <h3 className="headline-secondary text-warm-white text-xl md:text-2xl mb-4">
            Build Variant A first — Cinematic Editorial
          </h3>
          <div className="space-y-4 body-text text-ivory/50 leading-[1.8]">
            <p>
              Variant A best matches how we want Lula Lake Sound to feel on first visit: aspirational,
              cinematic, and unmistakably tied to place. Full-bleed imagery, editorial typography,
              and long-scroll storytelling signal a destination studio rather than a generic room
              rental — the kind of site press, artists, and fans remember after they leave.
            </p>
            <p>
              The masonry gallery, timeline-rich About section, and waveform-accented tracklist
              give each surface a clear role: atmosphere, narrative, and proof of work. Yes, it asks
              for stronger photography and a bit more layout craft than the other directions — but
              that investment pays off in differentiation at a glance.
            </p>
            <p>
              If the priority shifts toward fastest build time and forgiving photography, Variant B
              remains a strong fallback. For maximum clarity and a Swiss, engineering-forward read,
              Variant C is the right alternative.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-sand/8 py-12 px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span className="body-text-small text-ivory/25">Lula Lake Sound — Design Exploration</span>
          <span className="label-text text-ivory/20 text-[10px]">INF-45</span>
        </div>
      </footer>
    </main>
  );
}
