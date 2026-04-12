"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

/*
 * ─── VARIANT A: "CINEMATIC EDITORIAL" ───
 *
 * Magazine-style, dramatic full-bleed imagery, long-scroll narrative.
 * Think Sonic Ranch meets Kinfolk magazine. Moody, atmospheric, immersive.
 *
 * About:   Side-by-side storytelling with large pull quotes and a timeline.
 * Gallery: Full-width masonry grid with hover reveals.
 * Records: Horizontal cards with waveform vis and large album art.
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
  { title: "Hollow Bones",      artist: "The Paper Kites",     role: "Recorded & Mixed", genre: "Indie Folk",    year: "2024", duration: "3:42" },
  { title: "River Hymn",        artist: "Julien Baker",        role: "Tracked",          genre: "Alt Rock",      year: "2024", duration: "4:18" },
  { title: "Still Life",        artist: "Iron & Wine",         role: "Mixed & Mastered", genre: "Chamber Folk",  year: "2023", duration: "5:01" },
  { title: "Burning Daylight",  artist: "Strand of Oaks",      role: "Recorded",         genre: "Indie Rock",    year: "2023", duration: "4:33" },
  { title: "Good Grief",        artist: "Lucius",              role: "Recorded & Mixed", genre: "Synth Pop",     year: "2023", duration: "3:55" },
];

const TIMELINE = [
  { year: "2019", event: "First session recorded on Lookout Mountain" },
  { year: "2020", event: "Full acoustic treatment and control room build" },
  { year: "2022", event: "Analog console installed — 32-channel Neve" },
  { year: "2023", event: "Residential wing opens for immersive retreats" },
  { year: "2024", event: "Over 40 projects tracked and released" },
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
        transform: visible ? "translateY(0)" : "translateY(36px)",
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── ABOUT ─── */
function AboutSection() {
  return (
    <section className="relative">
      {/* Hero banner — full-bleed cinematic image */}
      <div className="relative h-[70vh] md:h-[85vh] overflow-hidden">
        <Image
          src={STUDIO_IMAGES[0]}
          alt="Studio interior"
          fill
          className="object-cover"
          quality={85}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-forest/60 via-deep-forest/30 to-deep-forest" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto w-full px-6 md:px-16 pb-16 md:pb-24">
            <Reveal>
              <p className="label-text text-sand/70 mb-4 tracking-[0.2em]">Our Story</p>
              <h1
                className="headline-primary text-warm-white leading-[1.05]"
                style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}
              >
                Born from the
                <br />
                <span className="text-sand italic">mountain itself</span>
              </h1>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Narrative body — two-column editorial */}
      <div className="bg-deep-forest py-24 md:py-36 px-6 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          {/* Left column — text */}
          <div className="lg:col-span-7 space-y-10">
            <Reveal>
              <p className="body-text text-ivory/70 text-lg md:text-xl leading-[1.8] max-w-2xl">
                Lula Lake Sound was founded on a simple belief: the environment shapes
                the art. Perched on Lookout Mountain above Chattanooga, our studio sits
                inside a landscape that has inspired generations — ancient rock
                formations, dense canopy, and silence so deep you can hear your own
                pulse.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="body-text text-ivory/50 text-lg leading-[1.8] max-w-2xl">
                What began as a single room with a pair of monitors and a dream has
                grown into a fully realized analog-digital hybrid facility. Every
                decision — from the placement of baffles to the routing of the console
                — was made in service of one thing: capturing the truest possible
                version of the sound in the room.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="body-text text-ivory/50 text-lg leading-[1.8] max-w-2xl">
                We built the residential wing so artists could stop commuting and start
                living inside their work. Wake up, walk twenty steps, and be standing
                at the mic. Cook dinner together. Sit on the porch and let the evening
                do its work. The songs that come out of this place carry that energy —
                you can hear the mountain in them.
              </p>
            </Reveal>
          </div>

          {/* Right column — pull quote + image */}
          <div className="lg:col-span-5 space-y-12">
            <Reveal delay={0.15}>
              <blockquote className="border-l-2 border-gold/40 pl-8 py-4">
                <p
                  className="headline-secondary text-sand/90 italic leading-[1.4]"
                  style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
                >
                  &ldquo;The mountain doesn&rsquo;t rush. Neither should the music.&rdquo;
                </p>
              </blockquote>
            </Reveal>
            <Reveal delay={0.25}>
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={STUDIO_IMAGES[3]}
                  alt="Studio detail"
                  fill
                  className="object-cover"
                  quality={80}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-forest/50 to-transparent" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Timeline strip */}
      <div className="bg-washed-black border-t border-b border-sand/8 py-20 px-6 md:px-16 overflow-x-auto">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="label-text text-sand/50 mb-12 tracking-[0.2em]">Milestones</p>
          </Reveal>
          <div className="flex gap-12 md:gap-20 min-w-max md:min-w-0 md:flex-wrap">
            {TIMELINE.map((item, i) => (
              <Reveal key={item.year} delay={i * 0.08} className="flex-shrink-0 md:flex-shrink">
                <div className="group">
                  <span className="headline-primary text-gold/80 text-3xl md:text-4xl block mb-3">
                    {item.year}
                  </span>
                  <span className="body-text-small text-ivory/50 block max-w-[200px]">
                    {item.event}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── GALLERY ─── */
function GallerySection() {
  const [activeImage, setActiveImage] = useState<number | null>(null);

  const gridConfig = [
    { span: "md:col-span-2 md:row-span-2", aspect: "aspect-[4/3]" },
    { span: "md:col-span-1 md:row-span-1", aspect: "aspect-square" },
    { span: "md:col-span-1 md:row-span-1", aspect: "aspect-square" },
    { span: "md:col-span-1 md:row-span-2", aspect: "aspect-[3/5]" },
    { span: "md:col-span-2 md:row-span-1", aspect: "aspect-[16/9]" },
    { span: "md:col-span-1 md:row-span-1", aspect: "aspect-square" },
    { span: "md:col-span-2 md:row-span-1", aspect: "aspect-[21/9]" },
    { span: "md:col-span-1 md:row-span-1", aspect: "aspect-[3/4]" },
    { span: "md:col-span-1 md:row-span-1", aspect: "aspect-square" },
  ];

  const captions = [
    "Control Room — Neve 5088 console, Focal monitors",
    "Live Room A — 600 sq ft, 14-foot ceilings",
    "Iso Booth — tuned for vocal intimacy",
    "Mountain view from the tracking room",
    "Outboard rack — LA-2A, 1176, Distressor",
    "Live Room B — stone walls, natural reverb",
    "Panoramic — the full facility at dusk",
    "Lounge — where the after-hours magic happens",
    "Hallway to the residential wing",
  ];

  return (
    <section className="bg-deep-forest py-24 md:py-36 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <div>
              <p className="label-text text-sand/50 mb-4 tracking-[0.2em]">The Facility</p>
              <h2
                className="headline-primary text-warm-white"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
              >
                Photo Gallery
              </h2>
            </div>
            <p className="body-text-small text-ivory/40 mt-4 md:mt-0 max-w-xs">
              {STUDIO_IMAGES.length} images — control room, live rooms, grounds, and gear.
            </p>
          </div>
        </Reveal>

        {/* Masonry grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[220px] gap-2">
          {STUDIO_IMAGES.map((url, i) => (
            <Reveal
              key={url}
              delay={i * 0.06}
              className={`${gridConfig[i]?.span ?? ""} group cursor-pointer relative overflow-hidden`}
            >
              <button
                onClick={() => setActiveImage(i)}
                className="block w-full h-full relative"
              >
                <Image
                  src={url}
                  alt={captions[i]}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={75}
                />
                <div className="absolute inset-0 bg-deep-forest/0 group-hover:bg-deep-forest/40 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <span className="body-text-small text-warm-white/90 text-xs">
                    {captions[i]}
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {activeImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-deep-forest/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
          onClick={() => setActiveImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-ivory/50 hover:text-warm-white transition-colors"
            onClick={() => setActiveImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative w-full max-w-5xl aspect-[16/10]">
            <Image
              src={STUDIO_IMAGES[activeImage]}
              alt={captions[activeImage]}
              fill
              className="object-contain"
              quality={90}
              sizes="90vw"
            />
          </div>
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="body-text-small text-ivory/50">{captions[activeImage]}</p>
            <p className="label-text text-ivory/30 mt-2 text-[10px]">
              {activeImage + 1} / {STUDIO_IMAGES.length}
            </p>
          </div>

          {/* Prev / Next */}
          {activeImage > 0 && (
            <button
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-sand transition-colors"
              onClick={(e) => { e.stopPropagation(); setActiveImage(activeImage - 1); }}
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {activeImage < STUDIO_IMAGES.length - 1 && (
            <button
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-sand transition-colors"
              onClick={(e) => { e.stopPropagation(); setActiveImage(activeImage + 1); }}
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  return (
    <section className="bg-washed-black py-24 md:py-36 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <p className="label-text text-sand/50 mb-4 tracking-[0.2em]">Listen</p>
          <h2
            className="headline-primary text-warm-white mb-6"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
          >
            Selected Recordings
          </h2>
          <p className="body-text text-ivory/50 max-w-2xl mb-16 text-lg">
            A curated selection of projects tracked, mixed, or mastered at Lula Lake Sound.
            Each piece carries the character of the mountain.
          </p>
        </Reveal>

        {/* Track list — editorial horizontal cards */}
        <div className="space-y-1">
          {RECORDINGS.map((track, i) => (
            <Reveal key={track.title} delay={i * 0.06}>
              <button
                onClick={() => setPlaying(playing === i ? null : i)}
                className="w-full group"
              >
                <div className={`
                  flex flex-col md:flex-row md:items-center gap-4 md:gap-0
                  py-6 md:py-7 px-4 md:px-8
                  border-b border-sand/8
                  transition-all duration-400
                  ${playing === i ? "bg-charcoal/60" : "hover:bg-charcoal/30"}
                `}>
                  {/* Play indicator */}
                  <div className="w-10 flex-shrink-0 hidden md:flex items-center justify-center">
                    {playing === i ? (
                      <div className="flex items-end gap-[3px] h-4">
                        <span className="w-[3px] bg-gold animate-pulse" style={{ height: "60%", animationDelay: "0s" }} />
                        <span className="w-[3px] bg-gold animate-pulse" style={{ height: "100%", animationDelay: "0.15s" }} />
                        <span className="w-[3px] bg-gold animate-pulse" style={{ height: "40%", animationDelay: "0.3s" }} />
                        <span className="w-[3px] bg-gold animate-pulse" style={{ height: "80%", animationDelay: "0.1s" }} />
                      </div>
                    ) : (
                      <span className="label-text text-ivory/25 text-xs">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    )}
                  </div>

                  {/* Track info */}
                  <div className="flex-1 text-left">
                    <h3 className={`headline-secondary text-lg md:text-xl transition-colors ${playing === i ? "text-gold" : "text-warm-white group-hover:text-sand"}`}>
                      {track.title}
                    </h3>
                    <p className="body-text-small text-ivory/50 mt-0.5">{track.artist}</p>
                  </div>

                  {/* Waveform placeholder */}
                  <div className="hidden lg:flex items-center gap-[2px] h-8 flex-shrink-0 mx-8 w-48">
                    {Array.from({ length: 40 }).map((_, j) => {
                      const h = 20 + Math.sin(j * 0.7 + i * 2) * 40 + Math.random() * 20;
                      return (
                        <span
                          key={j}
                          className={`w-[2px] rounded-full transition-colors duration-300 ${playing === i ? "bg-gold/70" : "bg-sand/20 group-hover:bg-sand/30"}`}
                          style={{ height: `${h}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-6 text-right flex-shrink-0">
                    <span className="label-text text-ivory/30 text-[10px] hidden md:block">{track.role}</span>
                    <span className="label-text text-ivory/30 text-[10px] hidden sm:block">{track.genre}</span>
                    <span className="body-text-small text-ivory/40 tabular-nums w-10">{track.duration}</span>
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        {/* CTA */}
        <Reveal delay={0.3}>
          <div className="mt-20 pt-16 border-t border-sand/8 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h3 className="headline-secondary text-sand text-2xl mb-2">
                Hear yourself here
              </h3>
              <p className="body-text-small text-ivory/40 max-w-md">
                Whether you&rsquo;re tracking a full band or an intimate solo project,
                the mountain makes a difference you can hear.
              </p>
            </div>
            <Link
              href="/#artist-inquiries"
              className="inline-flex items-center gap-3 bg-sand text-washed-black px-8 py-3.5 text-sm tracking-wide body-text hover:bg-warm-white transition-colors duration-300"
            >
              Book a Session
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── PAGE ─── */
export default function VariantAPage() {
  return (
    <main className="min-h-screen bg-deep-forest text-ivory relative grain-overlay">
      {/* Sticky back link */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 label-text text-ivory/40 hover:text-sand transition-colors text-[11px] flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to site
      </Link>

      {/* Variant label */}
      <div className="fixed top-6 right-6 z-50 label-text text-gold/60 text-[11px] bg-deep-forest/80 backdrop-blur-sm px-4 py-2 border border-gold/15 rounded-full">
        Variant A — Cinematic Editorial
      </div>

      <AboutSection />
      <GallerySection />
      <RecordingsSection />

      {/* Footer */}
      <footer className="bg-deep-forest border-t border-sand/8 py-16 px-6 md:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="headline-secondary text-sand text-xl">Lula Lake Sound</p>
            <p className="body-text-small text-ivory/40 mt-1">Lookout Mountain — Chattanooga, TN</p>
          </div>
          <div className="flex gap-8">
            <Link href="/#artist-inquiries" className="label-text text-ivory/40 hover:text-sand transition-colors text-[11px]">Book</Link>
            <Link href="mailto:hello@lulalakesound.com" className="label-text text-ivory/40 hover:text-sand transition-colors text-[11px]">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
