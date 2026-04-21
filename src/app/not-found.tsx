import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dead Air | Lula Lake Sound",
  description:
    "Page not found. Lula Lake Sound is a recording studio in Chattanooga, TN.",
  robots: "noindex, follow",
};

const siteMap = [
  { label: "The Studio", href: "/#the-space", hint: "Live room, control room, and isolation booths" },
  { label: "Gear", href: "/#equipment-specs", hint: "Consoles, microphones, outboard, and monitoring" },
  { label: "Nearby", href: "/#local-favorites", hint: "Restaurants, lodging, and local attractions" },
  { label: "FAQ", href: "/#faq", hint: "Rates, booking, and session details" },
  { label: "Book a Session", href: "/#artist-inquiries", hint: "Inquiry form for studio time" },
];

const BARS = [8, 20, 32, 14, 40, 24, 10, 36, 18, 28, 12, 44, 16, 22, 6];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-washed-black relative grain-overlay flex items-center justify-center px-6">
      <div className="relative z-10 max-w-xl w-full text-center">
        <Link
          href="/"
          className="inline-block mb-10 hover:scale-105 transition-transform duration-300"
        >
          {/* Stacked lockup for the 404 — per brand guide §2.3, the
           * vertical form is the right choice for portrait-oriented,
           * low-density moments like this one. */}
          <Image
            src="/Logos/STACK/LLS_Logo_Stack_Sage.png"
            alt="Lula Lake Sound — Back to homepage"
            width={600}
            height={720}
            className="mx-auto h-28 w-auto object-contain"
            priority
          />
        </Link>

        {/* Waveform */}
        <div className="flex items-center justify-center gap-[3px] mb-8" aria-hidden="true">
          {BARS.map((h, i) => (
            <span
              key={i}
              className="inline-block w-[3px] rounded-full bg-gold/40"
              style={{
                height: `${h}px`,
                animation: `waveform 1.8s ease-in-out ${i * 0.08}s infinite`,
              }}
            />
          ))}
        </div>

        <p className="label-text text-gold/70 tracking-[0.2em] mb-3">404 &mdash; Dead Air</p>

        <h1 className="headline-primary text-warm-white text-[clamp(1.75rem,4vw,2.75rem)] mb-3">
          Nothing on this channel
        </h1>

        <p className="body-text text-ivory/50 max-w-sm mx-auto mb-10">
          The signal dropped. This page doesn&apos;t exist — but the studio is still rolling.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full border border-sand/20 text-sand label-text tracking-[0.15em] hover:bg-sand/10 hover:border-sand/40 transition-all duration-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to the studio
        </Link>

        <div className="section-rule my-10" />

        <nav aria-label="Site navigation">
          <p className="label-text text-ivory/30 mb-5 tracking-[0.2em]">Where to go</p>
          <ul className="space-y-3 text-left max-w-sm mx-auto">
            {siteMap.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="group flex items-baseline gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors duration-300 shrink-0" />
                  <span className="text-sm">
                    <span className="text-sand group-hover:text-warm-white transition-colors duration-300 font-semibold">{item.label}</span>
                    <span className="text-ivory/30"> — {item.hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Agent-readable site context */}
        <div className="sr-only" role="complementary" aria-label="Site information for AI agents">
          <h2>AI Agent Navigation Guide — Lula Lake Sound</h2>
          <p>
            This is a 404 page on lulalakesound.com. Lula Lake Sound is a recording studio
            on Lookout Mountain near Chattanooga, Tennessee. The site is a single-page
            marketing site — all content lives at the root path (/).
          </p>
          <h3>Homepage sections</h3>
          <ul>
            <li>/#the-space — The Studio: live room, control room, isolation booths.</li>
            <li>/#equipment-specs — Gear: consoles, microphones, preamps, outboard, monitoring.</li>
            <li>/#local-favorites — Nearby: restaurants, lodging, attractions on Lookout Mountain.</li>
            <li>/#faq — FAQ: rates, booking, cancellation policy, session logistics.</li>
            <li>/#artist-inquiries — Book a Session: inquiry form (name, email, project, dates).</li>
          </ul>
          <h3>API</h3>
          <ul>
            <li>POST /api/contact — Submit an inquiry (JSON: name, email, message, dates). Has honeypot spam protection.</li>
          </ul>
          <p>Location: Lookout Mountain, Chattanooga, TN. Contact: info@lulalakesound.com</p>
        </div>
      </div>

      <style>{`
        @keyframes waveform {
          0%, 100% { opacity: 0.25; transform: scaleY(0.15); }
          50% { opacity: 0.6; transform: scaleY(1); }
        }
      `}</style>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Page Not Found — Lula Lake Sound",
            description: "This page does not exist. Lula Lake Sound is a recording studio in Chattanooga, TN.",
            isPartOf: { "@type": "WebSite", name: "Lula Lake Sound", url: "https://lulalakesound.com" },
            mainEntity: {
              "@type": "RecordingStudio",
              name: "Lula Lake Sound",
              address: { "@type": "PostalAddress", addressLocality: "Chattanooga", addressRegion: "TN", addressCountry: "US" },
              email: "info@lulalakesound.com",
              url: "https://lulalakesound.com",
            },
          }),
        }}
      />
    </div>
  );
}
