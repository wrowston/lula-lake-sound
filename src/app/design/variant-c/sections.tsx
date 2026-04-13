"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

/*
 * ─── VARIANT C: "ALPINE MINIMAL" ───
 *
 * Clean, grid-driven, Swiss-inspired. The landscape IS the brand.
 * Confident negative space, strong typographic hierarchy, systematic grids.
 * Professional and authoritative — like a mountain vista.
 *
 * About:   Large text blocks, numbered sections, data-forward storytelling.
 * Gallery: Strict uniform grid with category tabs and consistent aspect ratios.
 * Records: Structured table/list with technical metadata, sortable-feel columns.
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

type GalleryCategory = "All" | "Rooms" | "Gear" | "Grounds";

const IMAGE_CATEGORIES: Record<number, GalleryCategory[]> = {
  0: ["All", "Rooms"],
  1: ["All", "Rooms"],
  2: ["All", "Rooms"],
  3: ["All", "Grounds"],
  4: ["All", "Gear"],
  5: ["All", "Rooms"],
  6: ["All", "Rooms"],
  7: ["All", "Grounds"],
  8: ["All", "Grounds"],
};

const IMAGE_LABELS = [
  "Control Room",
  "Live Room A",
  "Iso Booth",
  "Mountain View",
  "Outboard Rack",
  "Live Room B",
  "Hallway",
  "Lounge",
  "Porch",
];

const RECORDINGS = [
  { title: "Hollow Bones",     artist: "The Paper Kites",  role: "Recorded & Mixed", genre: "Indie Folk",    year: "2024", duration: "3:42", bpm: 92 },
  { title: "River Hymn",       artist: "Julien Baker",     role: "Tracked",          genre: "Alt Rock",      year: "2024", duration: "4:18", bpm: 128 },
  { title: "Still Life",       artist: "Iron & Wine",      role: "Mixed & Mastered", genre: "Chamber Folk",  year: "2023", duration: "5:01", bpm: 78 },
  { title: "Burning Daylight", artist: "Strand of Oaks",   role: "Recorded",         genre: "Indie Rock",    year: "2023", duration: "4:33", bpm: 140 },
  { title: "Good Grief",       artist: "Lucius",           role: "Recorded & Mixed", genre: "Synth Pop",     year: "2023", duration: "3:55", bpm: 118 },
  { title: "Tremolo",          artist: "S. Carey",         role: "Mixed",            genre: "Ambient Folk",  year: "2024", duration: "6:12", bpm: 64 },
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
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── ABOUT ─── */
export function AboutSection() {
  const sections = [
    {
      num: "01",
      title: "Origin",
      text: "Lula Lake Sound was established in 2019 on Lookout Mountain, just outside Chattanooga, Tennessee. The studio occupies a converted residence surrounded by hardwood forest, sandstone bluffs, and the silence that comes with elevation. The founding principle was simple: remove every barrier between the artist and the work.",
    },
    {
      num: "02",
      title: "Philosophy",
      text: "We believe environment is an instrument. The acoustic treatment, the gear selection, the absence of city noise — these aren't amenities. They're tools. Every room in the facility was designed to serve the recording, not impress visitors. The mountain provides the rest: perspective, patience, and a pace that lets songs reveal themselves.",
    },
    {
      num: "03",
      title: "Capability",
      text: "The studio runs a hybrid analog-digital signal chain anchored by a 32-channel Neve console, with conversion through Burl and monitoring on Focal. The live room offers 600 square feet with 14-foot ceilings and adjustable acoustic panels. Two isolation booths, a fully treated control room, and a residential wing for extended sessions. We handle tracking, mixing, and mastering in-house.",
    },
  ];

  return (
    <section className="pt-32 md:pt-48 pb-24 md:pb-36">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* Header — oversized type */}
        <Reveal>
          <div className="mb-20 md:mb-28">
            <p className="label-text text-sage tracking-[0.3em] mb-6 text-[11px]">About the Studio</p>
            <h1
              className="headline-primary text-warm-white leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(2.8rem, 7vw, 6rem)" }}
            >
              Lula Lake
              <br />
              Sound
            </h1>
            <div className="mt-8 flex items-center gap-6">
              <div className="h-px bg-sand/20 flex-1 max-w-[120px]" />
              <span className="label-text text-ivory/30 tracking-[0.2em] text-[10px]">
                Lookout Mountain, TN — Est. 2019
              </span>
            </div>
          </div>
        </Reveal>

        {/* Hero image — full width, constrained aspect */}
        <Reveal delay={0.1}>
          <div className="relative aspect-[21/9] overflow-hidden mb-16 md:mb-20">
            <Image
              src={STUDIO_IMAGES[0]}
              alt="Studio panoramic"
              fill
              className="object-cover"
              quality={85}
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-washed-black/30 to-transparent" />
          </div>
        </Reveal>

        {/* Owner & designer — portrait placeholders */}
        <Reveal delay={0.12}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-sand/10 mb-24 md:mb-32">
            <div className="bg-washed-black p-8 md:p-10 flex flex-col items-center text-center">
              <p className="label-text text-sage text-[10px] tracking-[0.2em] mb-6">Owner</p>
              <div className="relative aspect-square w-full max-w-[220px] overflow-hidden rounded-full border border-sand/12 bg-charcoal/30 mx-auto">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4">
                  <span className="label-text text-ivory/20 text-[9px] leading-snug">Photo placeholder</span>
                  <span className="body-text-small text-ivory/35 text-[10px] leading-snug">Owner portrait</span>
                </div>
              </div>
            </div>
            <div className="bg-washed-black p-8 md:p-10 flex flex-col items-center text-center">
              <p className="label-text text-sage text-[10px] tracking-[0.2em] mb-6">Studio designer</p>
              <div className="relative aspect-square w-full max-w-[220px] overflow-hidden rounded-full border border-sand/12 bg-charcoal/30 mx-auto">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4">
                  <span className="label-text text-ivory/20 text-[9px] leading-snug">Photo placeholder</span>
                  <span className="body-text-small text-ivory/35 text-[10px] leading-snug">Designer portrait</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Numbered sections — clean grid */}
        <div className="space-y-20 md:space-y-28">
          {sections.map((section, i) => (
            <Reveal key={section.num} delay={i * 0.08}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-start">
                {/* Number + title */}
                <div className="md:col-span-4 flex items-start gap-4">
                  <span className="headline-primary text-sage/40 text-sm tabular-nums mt-1">{section.num}</span>
                  <div>
                    <h3 className="headline-secondary text-warm-white text-xl md:text-2xl">{section.title}</h3>
                    <div className="w-10 h-px bg-sand/20 mt-3" />
                  </div>
                </div>
                {/* Body */}
                <div className="md:col-span-8">
                  <p className="body-text text-ivory/55 text-lg leading-[1.85] max-w-2xl">{section.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Data strip */}
        <Reveal delay={0.2}>
          <div className="mt-24 md:mt-32 border-t border-b border-sand/10 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { value: "40+",   label: "Projects Released" },
                { value: "32ch",  label: "Neve Console" },
                { value: "600ft²", label: "Live Room" },
                { value: "5yrs",  label: "In Operation" },
              ].map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <span className="headline-primary text-warm-white text-3xl md:text-4xl block tracking-tight">{stat.value}</span>
                  <span className="label-text text-ivory/30 text-[10px] mt-2 block tracking-[0.15em]">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── GALLERY ─── */
export function GallerySection() {
  const [category, setCategory] = useState<GalleryCategory>("All");
  const [activeImage, setActiveImage] = useState<number | null>(null);

  const categories: GalleryCategory[] = ["All", "Rooms", "Gear", "Grounds"];

  const filteredImages = STUDIO_IMAGES.map((url, i) => ({ url, i })).filter(
    ({ i }) => category === "All" || IMAGE_CATEGORIES[i]?.includes(category)
  );

  return (
    <section className="bg-charcoal py-24 md:py-36">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* Header row */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <p className="label-text text-sage tracking-[0.3em] mb-4 text-[11px]">Gallery</p>
              <h2
                className="headline-primary text-warm-white tracking-tight"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
              >
                The Facility
              </h2>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 mt-6 md:mt-0 bg-washed-black/40 p-1 rounded-sm">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`
                    label-text text-[10px] px-4 py-2 transition-all duration-300 rounded-sm
                    ${category === cat
                      ? "bg-sand/15 text-sand"
                      : "text-ivory/35 hover:text-ivory/60"
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Uniform grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {filteredImages.map(({ url, i }, idx) => (
            <Reveal key={url} delay={idx * 0.04}>
              <button
                onClick={() => setActiveImage(i)}
                className="block w-full group relative overflow-hidden"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={url}
                    alt={IMAGE_LABELS[i]}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 50vw, 33vw"
                    quality={75}
                  />
                  <div className="absolute inset-0 bg-washed-black/0 group-hover:bg-washed-black/30 transition-colors duration-400" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-washed-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                    <span className="label-text text-warm-white text-[10px]">{IMAGE_LABELS[i]}</span>
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        {/* Count */}
        <Reveal delay={0.2}>
          <div className="mt-6 text-right">
            <span className="label-text text-ivory/25 text-[10px]">
              {filteredImages.length} {filteredImages.length === 1 ? "image" : "images"}
            </span>
          </div>
        </Reveal>
      </div>

      {/* Lightbox */}
      {activeImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-washed-black/97 flex items-center justify-center p-4 md:p-12"
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
          <div className="relative w-full max-w-5xl aspect-[4/3]">
            <Image
              src={STUDIO_IMAGES[activeImage]}
              alt={IMAGE_LABELS[activeImage]}
              fill
              className="object-contain"
              quality={90}
              sizes="90vw"
            />
          </div>
          <div className="absolute bottom-8 flex items-center gap-4">
            <span className="label-text text-warm-white text-[11px]">{IMAGE_LABELS[activeImage]}</span>
            <span className="text-ivory/20">—</span>
            <span className="label-text text-ivory/30 text-[10px]">{activeImage + 1} / {STUDIO_IMAGES.length}</span>
          </div>
          {activeImage > 0 && (
            <button
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-ivory/30 hover:text-sand transition-colors"
              onClick={(e) => { e.stopPropagation(); setActiveImage(activeImage - 1); }}
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {activeImage < STUDIO_IMAGES.length - 1 && (
            <button
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-ivory/30 hover:text-sand transition-colors"
              onClick={(e) => { e.stopPropagation(); setActiveImage(activeImage + 1); }}
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
export function RecordingsSection() {
  const [playing, setPlaying] = useState<number | null>(null);

  return (
    <section className="bg-washed-black py-24 md:py-36">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <Reveal>
          <div className="mb-16">
            <p className="label-text text-sage tracking-[0.3em] mb-4 text-[11px]">Recordings</p>
            <h2
              className="headline-primary text-warm-white tracking-tight mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              Selected Work
            </h2>
            <p className="body-text text-ivory/45 max-w-xl text-lg">
              Projects tracked, mixed, or mastered at Lula Lake Sound.
            </p>
          </div>
        </Reveal>

        {/* Table header */}
        <Reveal delay={0.05}>
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 pb-3 border-b border-sand/12">
            <span className="col-span-1 label-text text-ivory/25 text-[10px]">Play</span>
            <span className="col-span-3 label-text text-ivory/25 text-[10px]">Title</span>
            <span className="col-span-2 label-text text-ivory/25 text-[10px]">Artist</span>
            <span className="col-span-2 label-text text-ivory/25 text-[10px]">Role</span>
            <span className="col-span-1 label-text text-ivory/25 text-[10px]">Genre</span>
            <span className="col-span-1 label-text text-ivory/25 text-[10px]">Year</span>
            <span className="col-span-1 label-text text-ivory/25 text-[10px] text-right">BPM</span>
            <span className="col-span-1 label-text text-ivory/25 text-[10px] text-right">Duration</span>
          </div>
        </Reveal>

        {/* Track rows */}
        <div>
          {RECORDINGS.map((track, i) => {
            const isPlaying = playing === i;
            return (
              <Reveal key={track.title} delay={i * 0.04}>
                <button
                  onClick={() => setPlaying(isPlaying ? null : i)}
                  className="w-full group"
                >
                  {/* Desktop row */}
                  <div className={`
                    hidden md:grid grid-cols-12 gap-4 items-center px-4 py-4
                    border-b border-sand/6
                    transition-all duration-300
                    ${isPlaying ? "bg-sage/[0.08]" : "hover:bg-charcoal/40"}
                  `}>
                    <div className="col-span-1 flex items-center">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
                        isPlaying
                          ? "bg-sand border-sand text-washed-black"
                          : "border-ivory/15 text-ivory/30 group-hover:border-sand/40 group-hover:text-sand"
                      }`}>
                        {isPlaying ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <h4 className={`col-span-3 headline-secondary text-sm text-left transition-colors ${isPlaying ? "text-sand" : "text-warm-white/90 group-hover:text-sand"}`}>
                      {track.title}
                    </h4>
                    <span className="col-span-2 body-text-small text-ivory/45 text-left text-sm">{track.artist}</span>
                    <span className="col-span-2 body-text-small text-ivory/35 text-left text-sm">{track.role}</span>
                    <span className="col-span-1 label-text text-ivory/25 text-[10px]">{track.genre}</span>
                    <span className="col-span-1 body-text-small text-ivory/30 text-sm tabular-nums">{track.year}</span>
                    <span className="col-span-1 body-text-small text-ivory/25 text-sm tabular-nums text-right">{track.bpm}</span>
                    <span className="col-span-1 body-text-small text-ivory/35 text-sm tabular-nums text-right">{track.duration}</span>
                  </div>

                  {/* Mobile row */}
                  <div className={`
                    md:hidden flex items-center gap-4 px-3 py-4
                    border-b border-sand/6
                    transition-all duration-300
                    ${isPlaying ? "bg-sage/[0.08]" : "hover:bg-charcoal/40"}
                  `}>
                    <div className="w-8 h-8 flex-shrink-0 rounded-full border flex items-center justify-center transition-all duration-300"
                      style={{
                        borderColor: isPlaying ? "var(--color-sand)" : "rgba(191, 187, 181, 0.15)",
                        backgroundColor: isPlaying ? "var(--color-sand)" : "transparent",
                        color: isPlaying ? "var(--color-washed-black)" : "rgba(191, 187, 181, 0.3)",
                      }}
                    >
                      {isPlaying ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className={`headline-secondary text-sm truncate transition-colors ${isPlaying ? "text-sand" : "text-warm-white/90"}`}>
                        {track.title}
                      </h4>
                      <p className="body-text-small text-ivory/40 text-xs mt-0.5 truncate">{track.artist} — {track.genre}</p>
                    </div>
                    <span className="body-text-small text-ivory/30 text-xs tabular-nums flex-shrink-0">{track.duration}</span>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>

        {/* Summary bar */}
        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-wrap items-center gap-6 px-4">
            <span className="label-text text-ivory/20 text-[10px]">{RECORDINGS.length} tracks</span>
            <span className="text-ivory/10">|</span>
            <span className="label-text text-ivory/20 text-[10px]">{new Set(RECORDINGS.map((r) => r.artist)).size} artists</span>
            <span className="text-ivory/10">|</span>
            <span className="label-text text-ivory/20 text-[10px]">{new Set(RECORDINGS.map((r) => r.genre)).size} genres</span>
          </div>
        </Reveal>

        {/* CTA — minimal */}
        <Reveal delay={0.25}>
          <div className="mt-24 border-t border-sand/10 pt-16">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
              <div className="md:col-span-8">
                <h3
                  className="headline-primary text-warm-white tracking-tight mb-3"
                  style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
                >
                  Your project, our mountain.
                </h3>
                <p className="body-text text-ivory/40 max-w-lg">
                  We take a limited number of sessions each month to ensure every
                  project receives our full attention and the space it deserves.
                </p>
              </div>
              <div className="md:col-span-4 md:text-right">
                <Link
                  href="/#artist-inquiries"
                  className="inline-flex items-center gap-3 bg-warm-white text-washed-black px-8 py-3.5 text-sm tracking-wide body-text hover:bg-sand transition-colors duration-300"
                >
                  Inquire
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
