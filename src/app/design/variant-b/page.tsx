"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

/*
 * ─── VARIANT B: "ANALOG WARMTH" ───
 *
 * Organic, textured, warm. Inspired by vinyl sleeves, field journals, and
 * the tactile quality of tape. Asymmetric layouts with intentional
 * imperfection. Earth-tone dominant with amber/gold accents.
 *
 * About:   Split layout with founder portrait emphasis, hand-drawn-feel accents.
 * Gallery: Contact-sheet / film-strip inspired grid with subtle rotations.
 * Records: Vinyl-sleeve aesthetic, warm amber tones, LP-tracklist format.
 */

const STUDIO_IMAGES = [
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnAhUWTJqtRkcnhBTMlYH2mZ96dp7NjQyvSeA8",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnGgq0wvZhmjCbdgSkyYaQZufLK4p7lXNtnUGo",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcneVQxywz2IGKtsAWTxLkyF9jPro53i6YVXq7h",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcn18NiyKHC8VEdygXoWvOfwDNr4nKAMuSlZcJs",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnNn2WFhLaBXU2mSOfjAvJRsoweyxrVpu0LgGq",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnFvdpGuRyJUMW2EV18lGQ7knqO4zraujxNILd",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnlDpo7kAVektLHUCp59bOQSyZsY3dhJa8v6Ec",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnDeHTxFcjwcQ4o9dq8RzDyMmHUW2L3ANGbuX0",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnaaBwzY5E6xa1cmW8klTXKG9BfZjqtQngYb7o",
];

const RECORDINGS = [
  { title: "Hollow Bones",     artist: "The Paper Kites",  role: "Recorded & Mixed", genre: "Indie Folk",   year: "2024", side: "A", track: 1 },
  { title: "River Hymn",       artist: "Julien Baker",     role: "Tracked",          genre: "Alt Rock",     year: "2024", side: "A", track: 2 },
  { title: "Still Life",       artist: "Iron & Wine",      role: "Mixed & Mastered", genre: "Chamber Folk", year: "2023", side: "A", track: 3 },
  { title: "Burning Daylight", artist: "Strand of Oaks",   role: "Recorded",         genre: "Indie Rock",   year: "2023", side: "B", track: 1 },
  { title: "Good Grief",       artist: "Lucius",           role: "Recorded & Mixed", genre: "Synth Pop",    year: "2023", side: "B", track: 2 },
  { title: "Tremolo",          artist: "S. Carey",         role: "Mixed",            genre: "Ambient Folk", year: "2024", side: "B", track: 3 },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── ABOUT ─── */
function AboutSection() {
  return (
    <section className="relative py-24 md:py-40">
      {/* Textured background */}
      <div className="absolute inset-0 bg-texture-ink-wash opacity-40" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
        {/* Top — stacked intro */}
        <Reveal>
          <div className="mb-20 md:mb-28">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-px bg-gold/40" />
              <span className="label-text text-gold/60 tracking-[0.25em] text-[10px]">EST. 2019</span>
            </div>
            <h1
              className="headline-primary text-warm-white leading-[1.1] mb-8"
              style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
            >
              A studio that feels
              <br />
              like <span className="text-gold">coming home</span>
            </h1>
            <p className="body-text text-ivory/60 text-lg max-w-xl leading-[1.9]">
              Some places hold sound differently. The rooms at Lula Lake Sound were
              built to be one of those places — where the walls listen back and the
              silence between takes is part of the recording.
            </p>
          </div>
        </Reveal>

        {/* Two-panel — portrait + story */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 items-start">
          {/* Polaroid-style image */}
          <Reveal delay={0.1}>
            <div className="bg-warm-white/[0.04] p-3 md:p-4 max-w-md md:-rotate-1 hover:rotate-0 transition-transform duration-700">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={STUDIO_IMAGES[0]}
                  alt="Studio founder portrait"
                  fill
                  className="object-cover"
                  quality={80}
                  priority
                />
              </div>
              <div className="pt-4 pb-2 px-1">
                <p className="body-text-small text-ivory/40 italic text-sm">
                  The control room, late afternoon light
                </p>
              </div>
            </div>
          </Reveal>

          {/* Prose */}
          <Reveal delay={0.2}>
            <div className="space-y-8 md:pt-12">
              <p className="body-text text-ivory/60 text-lg leading-[1.85]">
                The studio was born out of necessity — the kind that doesn&rsquo;t ask
                permission. After years of chasing sessions in Nashville and Atlanta,
                our founder realized the best records he&rsquo;d ever heard were made
                in rooms where artists had time to breathe.
              </p>
              <p className="body-text text-ivory/50 leading-[1.85]">
                So he came home to the mountain. Tore out walls. Strung cable through
                crawl spaces. Hand-treated every surface. The first session was a
                three-piece folk band who stayed for a week and left with an album that
                sounded like it had always existed.
              </p>

              {/* Hand-drawn divider */}
              <div className="py-6 flex items-center gap-3">
                <svg width="60" height="8" viewBox="0 0 60 8" className="text-gold/30">
                  <path d="M0 4 Q10 0, 20 4 T40 4 T60 4" stroke="currentColor" fill="none" strokeWidth="1" />
                </svg>
              </div>

              <p className="body-text text-ivory/50 leading-[1.85]">
                Today, Lula Lake Sound is a residential recording studio with analog and
                digital capability, comfortable lodging, and a kitchen that&rsquo;s
                always stocked. We host artists for days or weeks at a time. The pace
                is intentional. The mountain sets the tempo.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-sand/10">
                {[
                  { num: "40+", label: "Projects released" },
                  { num: "5", label: "Years running" },
                  { num: "32", label: "Console channels" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <span className="headline-primary text-gold text-2xl md:text-3xl block">{stat.num}</span>
                    <span className="body-text-small text-ivory/40 text-xs mt-1 block">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Pull quote — full width */}
        <Reveal delay={0.1}>
          <div className="mt-24 md:mt-32 py-16 text-center">
            <svg width="32" height="24" viewBox="0 0 32 24" className="text-gold/30 mx-auto mb-6">
              <path d="M0 24V14.4C0 6.4 3.6 1.6 10.8 0l1.6 3.2C8 5.2 5.8 9 5.6 14.4H12V24H0zm19.2 0V14.4C19.2 6.4 22.8 1.6 30 0l1.6 3.2C27.2 5.2 25 9 24.8 14.4H31.2V24H19.2z" fill="currentColor" />
            </svg>
            <blockquote
              className="headline-secondary text-sand/80 italic max-w-3xl mx-auto leading-[1.5]"
              style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)" }}
            >
              We don&rsquo;t make records fast. We make them right. And out here,
              right sounds like the trees outside your window at six in the morning.
            </blockquote>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── GALLERY ─── */
function GallerySection() {
  const [activeImage, setActiveImage] = useState<number | null>(null);

  const rotations = [-1.5, 0.8, -0.5, 1.2, -0.8, 0.5, -1, 0.3, 1.5];

  const labels = [
    "Control Room",
    "Live Room A",
    "Iso Booth",
    "Mountain View",
    "Outboard Gear",
    "Live Room B",
    "Hallway",
    "Lounge",
    "Porch",
  ];

  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-charcoal" />
      {/* Tape-edge decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <Reveal>
          <div className="mb-16 md:mb-20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-px bg-gold/40" />
              <span className="label-text text-gold/50 tracking-[0.25em] text-[10px]">Contact Sheet</span>
            </div>
            <h2
              className="headline-primary text-warm-white"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)" }}
            >
              The Space in Frames
            </h2>
          </div>
        </Reveal>

        {/* Contact-sheet grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {STUDIO_IMAGES.map((url, i) => (
            <Reveal key={url} delay={i * 0.05}>
              <button
                onClick={() => setActiveImage(i)}
                className="group block w-full"
              >
                <div
                  className="bg-warm-white/[0.03] p-2 md:p-3 transition-all duration-500 hover:bg-warm-white/[0.06]"
                  style={{ transform: `rotate(${rotations[i]}deg)` }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={url}
                      alt={labels[i]}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 50vw, 33vw"
                      quality={75}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 px-1">
                    <span className="body-text-small text-ivory/35 text-[11px]">
                      {labels[i]}
                    </span>
                    <span className="label-text text-ivory/20 text-[9px]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        {/* Film-strip decoration */}
        <Reveal delay={0.3}>
          <div className="mt-16 flex items-center justify-center gap-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-3 rounded-sm"
                style={{
                  backgroundColor: `rgba(163, 130, 46, ${0.08 + (i % 3) * 0.04})`,
                }}
              />
            ))}
          </div>
        </Reveal>
      </div>

      {/* Lightbox */}
      {activeImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-washed-black/95 backdrop-blur-lg flex items-center justify-center p-6"
          onClick={() => setActiveImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-ivory/40 hover:text-warm-white transition-colors"
            onClick={() => setActiveImage(null)}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="bg-warm-white/[0.03] p-3 md:p-5 max-w-4xl w-full">
            <div className="relative aspect-[4/3]">
              <Image src={STUDIO_IMAGES[activeImage]} alt={labels[activeImage]} fill className="object-contain" quality={90} sizes="85vw" />
            </div>
            <div className="flex justify-between items-center pt-3 px-1">
              <span className="body-text-small text-ivory/50">{labels[activeImage]}</span>
              <span className="label-text text-ivory/25 text-[10px]">{activeImage + 1} / {STUDIO_IMAGES.length}</span>
            </div>
          </div>
          {activeImage > 0 && (
            <button
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-ivory/30 hover:text-gold transition-colors"
              onClick={(e) => { e.stopPropagation(); setActiveImage(activeImage - 1); }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {activeImage < STUDIO_IMAGES.length - 1 && (
            <button
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-ivory/30 hover:text-gold transition-colors"
              onClick={(e) => { e.stopPropagation(); setActiveImage(activeImage + 1); }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ─── RECORDINGS ─── */
function RecordingsSection() {
  const [playing, setPlaying] = useState<number | null>(null);
  const sideA = RECORDINGS.filter((r) => r.side === "A");
  const sideB = RECORDINGS.filter((r) => r.side === "B");

  function TrackRow({ track, index }: { track: typeof RECORDINGS[0]; index: number }) {
    const isPlaying = playing === index;
    return (
      <button
        onClick={() => setPlaying(isPlaying ? null : index)}
        className="w-full group"
      >
        <div className={`flex items-center gap-4 py-4 px-3 transition-all duration-300 ${isPlaying ? "bg-gold/[0.06]" : "hover:bg-warm-white/[0.02]"}`}>
          {/* Play button */}
          <div className="w-9 h-9 flex-shrink-0 rounded-full border flex items-center justify-center transition-all duration-300"
            style={{
              borderColor: isPlaying ? "rgba(163, 130, 46, 0.8)" : "rgba(163, 130, 46, 0.2)",
              backgroundColor: isPlaying ? "rgba(163, 130, 46, 0.15)" : "transparent",
            }}
          >
            {isPlaying ? (
              <svg className="w-3.5 h-3.5 text-gold" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 ml-0.5 text-gold/50 group-hover:text-gold transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-left min-w-0">
            <h4 className={`headline-secondary text-base transition-colors truncate ${isPlaying ? "text-gold" : "text-warm-white/90 group-hover:text-sand"}`}>
              {track.title}
            </h4>
          </div>

          {/* Artist */}
          <span className="body-text-small text-ivory/40 hidden sm:block flex-shrink-0">{track.artist}</span>

          {/* Year */}
          <span className="label-text text-ivory/20 text-[10px] flex-shrink-0 w-10 text-right">{track.year}</span>
        </div>
      </button>
    );
  }

  return (
    <section className="relative py-24 md:py-36">
      <div className="absolute inset-0 bg-washed-black bg-texture-stone opacity-100" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
        <Reveal>
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-px bg-gold/40" />
              <span className="label-text text-gold/50 tracking-[0.25em] text-[10px]">Now Playing</span>
            </div>
            <h2
              className="headline-primary text-warm-white mb-4"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)" }}
            >
              From the Tape Machine
            </h2>
            <p className="body-text text-ivory/50 max-w-xl leading-[1.8]">
              Selected work recorded, mixed, or mastered at the studio. 
              These tracks carry the fingerprint of the room and the mountain.
            </p>
          </div>
        </Reveal>

        {/* Vinyl sleeve layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* Side A */}
          <Reveal delay={0.1}>
            <div>
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gold/15">
                <div className="w-6 h-6 rounded-full border border-gold/30 flex items-center justify-center">
                  <span className="label-text text-gold/60 text-[9px]">A</span>
                </div>
                <span className="label-text text-ivory/30 text-[10px] tracking-[0.2em]">Side A</span>
              </div>
              <div className="space-y-0.5">
                {sideA.map((track, i) => (
                  <TrackRow key={track.title} track={track} index={i} />
                ))}
              </div>
            </div>
          </Reveal>

          {/* Side B */}
          <Reveal delay={0.2}>
            <div>
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gold/15">
                <div className="w-6 h-6 rounded-full border border-gold/30 flex items-center justify-center">
                  <span className="label-text text-gold/60 text-[9px]">B</span>
                </div>
                <span className="label-text text-ivory/30 text-[10px] tracking-[0.2em]">Side B</span>
              </div>
              <div className="space-y-0.5">
                {sideB.map((track, i) => (
                  <TrackRow key={track.title} track={track} index={sideA.length + i} />
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Vinyl disc decoration */}
        <Reveal delay={0.3}>
          <div className="mt-20 flex justify-center">
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full border border-gold/10 flex items-center justify-center">
              <div className="absolute inset-2 rounded-full border border-gold/[0.06]" />
              <div className="absolute inset-6 rounded-full border border-gold/[0.04]" />
              <div className="absolute inset-10 rounded-full border border-gold/[0.04]" />
              <div className="w-6 h-6 rounded-full bg-gold/15 border border-gold/20" />
              <div className="absolute inset-0 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, rgba(163,130,46,0.03), rgba(163,130,46,0.08), rgba(163,130,46,0.03), rgba(163,130,46,0.06), rgba(163,130,46,0.03))",
                }}
              />
            </div>
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal delay={0.35}>
          <div className="mt-20 text-center">
            <p className="body-text text-ivory/40 mb-6 max-w-md mx-auto">
              Ready to add your work to the collection?
            </p>
            <Link
              href="/#artist-inquiries"
              className="inline-flex items-center gap-3 border border-gold/30 text-gold px-8 py-3.5 text-sm tracking-wide body-text hover:bg-gold/10 hover:border-gold/50 transition-all duration-300"
            >
              Start a Conversation
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── PAGE ─── */
export default function VariantBPage() {
  return (
    <main className="min-h-screen bg-washed-black text-ivory relative grain-overlay">
      {/* Sticky back link */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 label-text text-ivory/40 hover:text-gold transition-colors text-[11px] flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to site
      </Link>

      {/* Variant label */}
      <div className="fixed top-6 right-6 z-50 label-text text-gold/60 text-[11px] bg-washed-black/80 backdrop-blur-sm px-4 py-2 border border-gold/15 rounded-full">
        Variant B — Analog Warmth
      </div>

      <AboutSection />
      <GallerySection />
      <RecordingsSection />

      {/* Footer */}
      <footer className="bg-washed-black border-t border-gold/10 py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="headline-secondary text-gold text-xl">Lula Lake Sound</p>
            <p className="body-text-small text-ivory/35 mt-1">Lookout Mountain — Chattanooga, TN</p>
          </div>
          <div className="flex gap-8">
            <Link href="/#artist-inquiries" className="label-text text-ivory/35 hover:text-gold transition-colors text-[11px]">Book</Link>
            <Link href="mailto:hello@lulalakesound.com" className="label-text text-ivory/35 hover:text-gold transition-colors text-[11px]">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
