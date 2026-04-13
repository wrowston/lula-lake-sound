import Link from "next/link";

export default function VariantCIndexPage() {
  const pages = [
    {
      href: "/design/variant-c/about",
      title: "About",
      description: "Oversized type, panoramic hero, dual portraits, numbered philosophy blocks, and data strip.",
    },
    {
      href: "/design/variant-c/gallery",
      title: "Gallery",
      description: "Category tabs and a strict uniform grid with hover labels and lightbox.",
    },
    {
      href: "/design/variant-c/recordings",
      title: "Recordings",
      description: "Metadata-forward table, mobile rows, summary bar, and minimal inquire CTA.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 pt-32 pb-20 md:pt-36 md:pb-28">
      <p className="label-text text-sage/70 mb-4 tracking-[0.25em] text-[10px]">Variant C</p>
      <h1
        className="headline-primary text-warm-white leading-[1.1] mb-4 tracking-tight"
        style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
      >
        Alpine Minimal — page comps
      </h1>
      <p className="body-text text-ivory/50 text-lg leading-[1.85] mb-12 max-w-2xl">
        Routes mirror how separate templates would ship: systematic About, filterable Gallery, and
        a data-dense Recordings view.
      </p>

      <ul className="space-y-4">
        {pages.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className="group block border border-sand/10 bg-charcoal/30 p-6 md:p-8 transition-colors hover:border-sage/35 hover:bg-sage/[0.04]"
            >
              <span className="headline-secondary text-warm-white text-lg md:text-xl group-hover:text-sand transition-colors">
                {p.title}
              </span>
              <p className="body-text-small text-ivory/45 mt-2 leading-relaxed max-w-xl">{p.description}</p>
              <span className="label-text text-sage/50 group-hover:text-sage text-[10px] mt-4 inline-flex items-center gap-2">
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
        <Link href="/design" className="text-sage/50 hover:text-sage transition-colors">
          ← All design variants
        </Link>
      </p>
    </div>
  );
}
