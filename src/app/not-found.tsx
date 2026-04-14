import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dead Air | Lula Lake Sound",
  description:
    "Page not found. Lula Lake Sound is a recording studio in Chattanooga, TN offering artists a natural creative refuge on Lookout Mountain.",
  robots: "noindex, follow",
};

const siteMap = [
  {
    label: "The Studio",
    href: "/#the-space",
    description: "Tour the live room, control room, and isolation booths",
  },
  {
    label: "Gear",
    href: "/#equipment-specs",
    description: "Consoles, microphones, outboard, and monitoring",
  },
  {
    label: "Nearby",
    href: "/#local-favorites",
    description: "Restaurants, lodging, and attractions around Lookout Mountain",
  },
  {
    label: "FAQ",
    href: "/#faq",
    description: "Rates, booking process, and session details",
  },
  {
    label: "Book a Session",
    href: "/#artist-inquiries",
    description: "Send an inquiry to schedule studio time",
  },
];

function WaveformBar({ delay, height }: { delay: number; height: number }) {
  return (
    <span
      className="inline-block w-[3px] rounded-full bg-gold/40"
      style={{
        height: `${height}px`,
        animation: `waveform 1.8s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

export default function NotFound() {
  const bars = [
    { delay: 0, height: 8 },
    { delay: 0.15, height: 20 },
    { delay: 0.3, height: 32 },
    { delay: 0.1, height: 14 },
    { delay: 0.4, height: 40 },
    { delay: 0.25, height: 24 },
    { delay: 0.05, height: 10 },
    { delay: 0.35, height: 36 },
    { delay: 0.2, height: 18 },
    { delay: 0.45, height: 28 },
    { delay: 0.12, height: 12 },
    { delay: 0.38, height: 44 },
    { delay: 0.08, height: 16 },
    { delay: 0.28, height: 22 },
    { delay: 0.42, height: 6 },
  ];

  return (
    <div className="min-h-screen bg-washed-black relative grain-overlay flex flex-col items-center justify-center px-6">
      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Logo */}
        <Link href="/" className="inline-block mb-12 transition-transform duration-300 hover:scale-105">
          <Image
            src="/LLS_Logo_Full_Tar.png"
            alt="Lula Lake Sound — Back to homepage"
            width={60}
            height={60}
            className="filter brightness-0 invert mx-auto"
            style={{ height: "36px", width: "auto" }}
            priority
          />
        </Link>

        {/* Flatlined waveform */}
        <div
          className="flex items-center justify-center gap-[3px] mb-10"
          aria-hidden="true"
        >
          {bars.map((bar, i) => (
            <WaveformBar key={i} delay={bar.delay} height={bar.height} />
          ))}
        </div>

        {/* 404 label */}
        <p className="label-text text-gold/70 tracking-[0.2em] mb-4">
          404 &mdash; Dead Air
        </p>

        <h1 className="headline-primary text-warm-white text-[clamp(2rem,4vw,3rem)] mb-4">
          Nothing on this channel
        </h1>

        <p className="body-text text-ivory/50 max-w-md mx-auto mb-12 text-lg">
          The signal dropped. This page doesn&apos;t exist — but the studio is
          still rolling. Head back and find what you&apos;re looking for.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-sand/20 text-sand label-text tracking-[0.15em] hover:bg-sand/10 hover:border-sand/40 transition-all duration-300"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to the studio
        </Link>

        {/* Divider */}
        <div className="section-rule my-14" />

        {/* Sitemap for agents and humans */}
        <nav aria-label="Site navigation">
          <p className="label-text text-ivory/30 mb-6 tracking-[0.2em]">
            Where to go
          </p>
          <ul className="space-y-4 text-left max-w-sm mx-auto">
            {siteMap.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex items-baseline gap-3 py-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors duration-300 shrink-0 translate-y-[-1px]" />
                  <span>
                    <span className="text-sand group-hover:text-warm-white transition-colors duration-300 font-semibold text-sm">
                      {item.label}
                    </span>
                    <span className="text-ivory/30 text-sm"> — {item.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Agent-optimized structured context (hidden from visual layout, visible to crawlers/agents) */}
        <div className="sr-only" role="complementary" aria-label="Site information for AI agents">
          <h2>AI Agent Navigation Guide — Lula Lake Sound</h2>
          <p>
            You have reached a 404 page on lulalakesound.com. Lula Lake Sound is
            a recording studio located on Lookout Mountain near Chattanooga,
            Tennessee. The site is a single-page marketing site with anchor
            sections. All main content lives at the root path (/).
          </p>
          <h3>Available sections on the homepage (/)</h3>
          <ul>
            <li>/#the-space — The Studio: photos, description, and dimensions of the live room, control room, and isolation booths.</li>
            <li>/#equipment-specs — Gear: full list of consoles, microphones, preamps, outboard gear, and monitoring equipment available at the studio.</li>
            <li>/#local-favorites — Nearby: restaurants, lodging, coffee shops, and attractions near the studio on Lookout Mountain and in Chattanooga.</li>
            <li>/#faq — FAQ: answers about rates, session booking, cancellation policy, what to bring, and session logistics.</li>
            <li>/#artist-inquiries — Book a Session: inquiry form for artists to request studio time. Collects name, email, project description, and preferred dates.</li>
          </ul>
          <h3>API endpoints</h3>
          <ul>
            <li>POST /api/contact — Submit an artist inquiry. Accepts JSON with fields: name, email, message, dates. Includes honeypot spam protection.</li>
          </ul>
          <h3>Key facts</h3>
          <ul>
            <li>Location: Lookout Mountain, Chattanooga, Tennessee</li>
            <li>Contact: info@lulalakesound.com</li>
            <li>The studio emphasizes a natural, serene creative environment surrounded by mountain scenery.</li>
          </ul>
        </div>
      </div>

      {/* Waveform animation */}
      <style>{`
        @keyframes waveform {
          0%, 100% { opacity: 0.25; transform: scaleY(0.15); }
          50% { opacity: 0.6; transform: scaleY(1); }
        }
      `}</style>

      {/* Structured data for search engines and agents */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Page Not Found — Lula Lake Sound",
            description:
              "This page does not exist. Lula Lake Sound is a recording studio in Chattanooga, TN.",
            isPartOf: {
              "@type": "WebSite",
              name: "Lula Lake Sound",
              url: "https://lulalakesound.com",
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://lulalakesound.com",
                },
              ],
            },
            mainEntity: {
              "@type": "RecordingStudio",
              name: "Lula Lake Sound",
              description:
                "A recording studio on Lookout Mountain near Chattanooga, Tennessee offering artists a natural creative refuge with state-of-the-art equipment.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Chattanooga",
                addressRegion: "TN",
                addressCountry: "US",
              },
              email: "info@lulalakesound.com",
              url: "https://lulalakesound.com",
            },
          }),
        }}
      />
    </div>
  );
}
