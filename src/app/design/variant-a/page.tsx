import Link from "next/link";

export default function VariantAIndexPage() {
  const pages = [
    {
      href: "/design/variant-a/about",
      title: "About",
      description: "Full-bleed hero, editorial two-column story, pull quote, portraits, and horizontal milestones.",
    },
    {
      href: "/design/variant-a/gallery",
      title: "Gallery",
      description: "Masonry grid with hover captions, lightbox, and prev/next — as its own page.",
    },
    {
      href: "/design/variant-a/recordings",
      title: "Recordings",
      description: "Full-width tracklist with deterministic waveforms, play affordances, and session CTA.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 pt-32 pb-20 md:pt-36 md:pb-28">
      <p className="label-text text-sand/50 mb-4 tracking-[0.2em] text-[10px]">Variant A</p>
      <h1
        className="headline-primary text-warm-white leading-[1.1] mb-4"
        style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
      >
        Cinematic Editorial — page comps
      </h1>
      <p className="body-text text-ivory/50 text-lg leading-[1.85] mb-12 max-w-2xl">
        Each marketing surface is routed separately so you can review About, Gallery, and Recordings
        the same way they would ship in the live site.
      </p>

      <ul className="space-y-4">
        {pages.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className="group block border border-sand/10 bg-deep-forest/40 p-6 md:p-8 transition-colors hover:border-gold/25 hover:bg-gold/[0.02]"
            >
              <span className="headline-secondary text-sand text-lg md:text-xl group-hover:text-gold transition-colors">
                {p.title}
              </span>
              <p className="body-text-small text-ivory/45 mt-2 leading-relaxed max-w-xl">{p.description}</p>
              <span className="label-text text-gold/40 group-hover:text-gold/70 text-[10px] mt-4 inline-flex items-center gap-2">
                Open comp
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="body-text-small text-ivory/30 mt-12">
        <Link href="/design" className="text-sand/50 hover:text-sand transition-colors">
          ← All design variants
        </Link>
      </p>
    </div>
  );
}
