"use client";

import { Music } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";

import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { useScrollAndReveal } from "@/hooks/use-scroll-and-reveal";
import { MAX_REVEAL_DELAY, revealDelay } from "@/lib/reveal-delay";
import { cn } from "@/lib/utils";
import {
  type MarketingFeatureFlags,
  isGalleryPageEnabled,
  isHomepagePricingSectionEnabled,
} from "@/lib/site-settings";

import type { Recording } from "./recordings-data";

function recordingGenreLabel(track: Recording): string {
  const g = track.genre?.trim();
  return g ? g : "—";
}

function recordingYearLabel(track: Recording): string {
  return track.year !== undefined && track.year > 0
    ? String(track.year)
    : "—";
}

/**
 * Public Recordings page shell (INF-48).
 *
 * Based on the client-approved Variant A "Cinematic Editorial" row treatment
 * from `inf-45/design-exploration-variants` (see
 * `src/app/design/variant-a/sections.tsx` → `RecordingsSection`). Adds the
 * launch-required columns — title, artist, genre, year — optional cover art,
 * streaming links — and in-playback duration UX (elapsed / total + progress
 * bar) for the active
 * row only — no standalone duration column.
 *
 * Playback model: **one track at a time**. Switching tracks pauses the
 * current `<audio>`, swaps its `src`, and resumes from the start. Scrubbing
 * on the active row's progress bar is supported. Idle rows show no duration
 * since we do not preload audio to satisfy the "don't aggressively preload"
 * performance requirement.
 */

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

interface PlayPauseIconProps {
  readonly isActive: boolean;
  readonly className?: string;
}

function PlayPauseIcon({ isActive, className }: PlayPauseIconProps) {
  if (isActive) {
    return (
      <svg
        aria-hidden
        className={className}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden
      className={cn("ml-0.5", className)}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

interface WaveformProps {
  readonly seed: number;
  readonly isActive: boolean;
  readonly isPlaying: boolean;
}

function Waveform({ seed, isActive, isPlaying }: WaveformProps) {
  const bars = Array.from({ length: 48 });
  return (
    <div
      aria-hidden
      className="hidden lg:flex items-center justify-center gap-[2px] h-8 w-full"
    >
      {bars.map((_, j) => {
        const h =
          15 +
          Math.abs(Math.sin(j * 0.45 + seed) * 55) +
          Math.abs(Math.cos(j * 0.8 + seed * 0.3) * 25);
        return (
          <span
            key={j}
            className={cn(
              "w-[2px] rounded-full transition-colors duration-300",
              isActive ? "bg-gold/60" : "bg-sand/15 group-hover:bg-sand/25",
              isPlaying && isActive && "recordings-waveform-bar--playing",
            )}
            style={{
              height: `${Math.min(h, 95).toFixed(2)}%`,
              ...(isPlaying && isActive
                ? {
                    animationDuration: `${(0.4 + (j % 5) * 0.07 + (seed % 3) * 0.05).toFixed(2)}s`,
                    animationDelay: `${(-((j * 11 + seed * 3) % 100) / 250).toFixed(3)}s`,
                  }
                : {}),
            }}
          />
        );
      })}
    </div>
  );
}

function AlbumThumbnail({
  track,
  className,
}: {
  readonly track: Recording;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-sand/20 bg-charcoal/50",
        className,
      )}
    >
      {track.coverImageUrl ? (
        <Image
          src={track.coverImageUrl}
          alt=""
          width={44}
          height={44}
          className="object-cover"
          sizes="44px"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-sand/30"
          aria-hidden
        >
          <Music className="h-5 w-5" strokeWidth={1.25} />
        </span>
      )}
    </div>
  );
}

interface ActiveTrackState {
  readonly id: string;
  readonly duration: number;
  readonly currentTime: number;
  readonly isPlaying: boolean;
}

function SpotifyGlyph({ className }: { readonly className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.42C15.24 8.4 8.82 8.4 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function StreamingLinks({
  track,
  className,
}: {
  readonly track: Recording;
  readonly className?: string;
}) {
  const linkClass =
    "inline-flex text-ivory/45 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-0 focus-visible:ring-offset-washed-black rounded-sm";
  if (!track.spotifyUrl && !track.appleMusicUrl) {
    return (
      <span className="label-text text-[10px] text-ivory/45 tabular-nums">
        —
      </span>
    );
  }
  return (
    <span
      className={cn("inline-flex items-center justify-center gap-2.5", className)}
    >
      {track.spotifyUrl ? (
        <a
          href={track.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label={`${track.title} — listen on Spotify`}
        >
          <SpotifyGlyph className="h-4 w-4" />
        </a>
      ) : null}
      {track.appleMusicUrl ? (
        <a
          href={track.appleMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label={`${track.title} — listen on Apple Music`}
        >
          <Music className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </a>
      ) : null}
    </span>
  );
}

interface TrackRowProps {
  readonly track: Recording;
  readonly index: number;
  readonly active: ActiveTrackState | null;
  readonly onToggle: (id: string) => void;
  readonly onSeekFraction: (fraction: number) => void;
}

function TrackRow({
  track,
  index,
  active,
  onToggle,
  onSeekFraction,
}: TrackRowProps) {
  const isActive = active?.id === track.id;
  const isPlaying = isActive && active.isPlaying;
  const duration = isActive ? active.duration : 0;
  const currentTime = isActive ? active.currentTime : 0;
  const progress =
    duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  function fractionFromClientX(clientX: number): number {
    const el = sliderRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const fraction = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, fraction));
  }

  function handleSliderPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!isActive || duration <= 0) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    onSeekFraction(fractionFromClientX(e.clientX));
  }

  function handleSliderPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isScrubbing) return;
    onSeekFraction(fractionFromClientX(e.clientX));
  }

  function handleSliderPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (!isScrubbing) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsScrubbing(false);
  }

  const rowLabel = isPlaying
    ? `Pause ${track.title} by ${track.artist}`
    : `Play ${track.title} by ${track.artist}`;

  return (
    <li className={cn(revealDelay(Math.min(index, MAX_REVEAL_DELAY)))}>
      <div
        className={cn(
          "group border-b border-sand/10 transition-colors duration-300",
          isActive ? "bg-charcoal/60" : "hover:bg-charcoal/30",
        )}
      >
        {/* Desktop row — play control is separate from streaming links so
            anchors are not nested inside a button. */}
        <div
          className="hidden md:grid w-full items-stretch gap-x-4 px-4 lg:gap-x-5"
          style={{
            gridTemplateColumns:
              "44px 48px minmax(0,1fr) minmax(0,160px) minmax(8.75rem, 13rem) minmax(5.5rem, 6rem) minmax(5.75rem, 7.25rem)",
          }}
        >
          <button
            type="button"
            onClick={() => onToggle(track.id)}
            aria-label={rowLabel}
            aria-pressed={isPlaying}
            className={cn(
              "flex items-center justify-center self-stretch",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-inset",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300",
                isPlaying
                  ? "bg-gold border-gold text-washed-black"
                  : "border-sand/30 text-sand/60 group-hover:border-sand/60 group-hover:text-sand",
              )}
            >
              <PlayPauseIcon
                isActive={isPlaying}
                className="h-3.5 w-3.5"
              />
            </span>
          </button>

          <div className="flex items-center justify-center py-5">
            <AlbumThumbnail track={track} />
          </div>

          <button
            type="button"
            tabIndex={-1}
            onClick={() => onToggle(track.id)}
            aria-label={rowLabel}
            aria-pressed={isPlaying}
            className={cn(
              "col-start-3 col-span-4 grid w-full items-center gap-x-4 py-5 text-left lg:gap-x-5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-0",
            )}
            style={{
              gridTemplateColumns:
                "minmax(0,1fr) minmax(0,160px) minmax(8.75rem, 13rem) minmax(5.5rem, 6rem)",
            }}
          >
            <span className="min-w-0 pl-3">
              <span
                className={cn(
                  "headline-secondary block truncate text-lg leading-tight transition-colors",
                  isActive
                    ? "text-gold"
                    : "text-warm-white group-hover:text-sand",
                )}
                title={track.title}
              >
                {track.title}
              </span>
              <span
                className="body-text-small mt-0.5 block truncate text-ivory/55"
                title={track.artist}
              >
                {track.artist}
              </span>
            </span>

            <span className="hidden lg:flex items-center">
              <Waveform
                seed={(index + 1) * 7}
                isActive={isActive}
                isPlaying={isPlaying}
              />
            </span>

            <span
              className="label-text truncate pr-1 text-right text-[10px] tracking-[0.12em] text-ivory/45"
              title={recordingGenreLabel(track)}
            >
              {recordingGenreLabel(track)}
            </span>

            <span className="label-text pl-1 text-right text-[10px] tabular-nums tracking-[0.12em] text-ivory/45">
              {recordingYearLabel(track)}
            </span>
          </button>

          <div className="flex items-center justify-center py-5 pl-2 pr-2">
            <StreamingLinks track={track} />
          </div>
        </div>

        {/* Mobile row — play and title-block are siblings (rather than the
            title-block being nested inside the play button) so streaming
            anchors can sit inline with the metadata line without nesting
            interactive elements inside a button. */}
        <div className="md:hidden flex items-center gap-3 px-3 py-4">
          <button
            type="button"
            onClick={() => onToggle(track.id)}
            aria-label={rowLabel}
            aria-pressed={isPlaying}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <span
              className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                isPlaying
                  ? "bg-gold border-gold text-washed-black"
                  : "border-sand/30 text-sand/60",
              )}
            >
              <PlayPauseIcon isActive={isPlaying} className="h-3.5 w-3.5" />
            </span>
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onToggle(track.id)}
            aria-label={rowLabel}
            aria-pressed={isPlaying}
            className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
          >
            <AlbumThumbnail track={track} />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "headline-secondary block truncate text-base transition-colors",
                  isActive ? "text-gold" : "text-warm-white",
                )}
                title={track.title}
              >
                {track.title}
              </span>
              <span
                className="body-text-small mt-0.5 block truncate text-xs text-ivory/55"
                title={`${track.artist} — ${recordingGenreLabel(track)} — ${recordingYearLabel(track)}`}
              >
                {track.artist} · {recordingGenreLabel(track)} ·{" "}
                {recordingYearLabel(track)}
              </span>
            </span>
          </button>
          {track.spotifyUrl || track.appleMusicUrl ? (
            <StreamingLinks track={track} className="shrink-0" />
          ) : null}
        </div>

        {/* In-playback duration UX — elapsed / total + progress bar, shown
            only for the active row so the required duration context is
            obvious during playback. */}
        {isActive ? (
          <div className="px-4 pb-4 md:px-6 md:pb-5">
            <div className="flex items-center gap-4">
              <span className="body-text-small tabular-nums text-ivory/75 text-xs min-w-[3.25rem]">
                {formatTime(currentTime)}
              </span>
              <div
                ref={sliderRef}
                role="slider"
                aria-label={`Seek — ${track.title}`}
                aria-valuemin={0}
                aria-valuemax={duration > 0 ? Math.floor(duration) : 0}
                aria-valuenow={Math.floor(currentTime)}
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                tabIndex={0}
                onPointerDown={handleSliderPointerDown}
                onPointerMove={handleSliderPointerMove}
                onPointerUp={handleSliderPointerEnd}
                onPointerCancel={handleSliderPointerEnd}
                onKeyDown={(e) => {
                  if (duration <= 0) return;
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    onSeekFraction(
                      Math.min(1, (currentTime + 5) / duration),
                    );
                  } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    onSeekFraction(
                      Math.max(0, (currentTime - 5) / duration),
                    );
                  } else if (e.key === "Home") {
                    e.preventDefault();
                    onSeekFraction(0);
                  } else if (e.key === "End") {
                    e.preventDefault();
                    onSeekFraction(1);
                  }
                }}
                className={cn(
                  "group/bar relative h-1 flex-1 rounded-full bg-sand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                  isScrubbing ? "cursor-grabbing" : "cursor-pointer",
                  "touch-none select-none",
                )}
                style={{ touchAction: "none" }}
              >
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-gold/85",
                    isScrubbing ? "" : "transition-[width]",
                  )}
                  style={{ width: `${progress * 100}%` }}
                />
                <div
                  aria-hidden
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-gold shadow-[0_0_0_3px_rgba(31,30,28,0.6)] transition-opacity",
                    isScrubbing
                      ? "opacity-100"
                      : "opacity-0 group-hover/bar:opacity-100 group-focus-visible/bar:opacity-100",
                  )}
                  style={{ left: `${progress * 100}%` }}
                />
              </div>
              <span className="body-text-small tabular-nums text-ivory/55 text-xs min-w-[3.25rem] text-right">
                {duration > 0 ? formatTime(duration) : "—:——"}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </li>
  );
}

interface RecordingsClientProps {
  readonly recordings: readonly Recording[];
  readonly marketing: MarketingFeatureFlags;
  /** Preview banner, aligned with `HomepageShell` / `AboutLayout`. */
  readonly banner?: ReactNode;
}

export function RecordingsClient({
  recordings,
  marketing,
  banner,
}: RecordingsClientProps) {
  const pathname = usePathname();
  const isPreview =
    pathname === "/preview" || pathname.startsWith("/preview/");
  const aboutHref = isPreview ? "/preview/about" : "/about";
  const homeSectionBase = isPreview ? "/preview" : "/";
  const recordingsNavHref = isPreview ? "/preview/recordings" : "/recordings";
  const backToHomeHref = isPreview ? "/preview" : "/";
  const showPricing = isHomepagePricingSectionEnabled(marketing);
  const showAbout = marketing.aboutPage === true;
  const showRecordings = marketing.recordingsPage === true;
  const showGallery = isGalleryPageEnabled(marketing);

  const { scrollY, containerRef } = useScrollAndReveal();
  const [active, setActive] = useState<ActiveTrackState | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  function handleToggle(id: string) {
    if (!audioEl) return;
    const track = recordings.find((r) => r.id === id);
    if (!track) return;

    if (active?.id === id) {
      // Same row — flip play/pause on the existing <audio>.
      if (active.isPlaying) {
        audioEl.pause();
      } else {
        void audioEl.play().catch(() => {
          // Autoplay/permission errors are swallowed so the UI stays
          // recoverable — the user can tap again.
        });
      }
      return;
    }

    // Switch tracks — stop the current one, point `<audio>` at the new URL,
    // then call play(). Browsers fire `loadedmetadata` when duration is
    // available; we sync state from that event.
    audioEl.pause();
    audioEl.src = track.audioUrl;
    audioEl.currentTime = 0;
    setActive({ id, duration: 0, currentTime: 0, isPlaying: false });
    void audioEl.play().catch(() => {
      // See above — keep the row selected even if play() rejects.
    });
  }

  function handleSeekFraction(fraction: number) {
    if (!audioEl || !active || active.duration <= 0) return;
    const clamped = Math.max(0, Math.min(1, fraction));
    const nextTime = clamped * active.duration;
    audioEl.currentTime = nextTime;
    setActive({ ...active, currentTime: nextTime });
  }

  // Media event handlers drive the single source of truth for playback
  // state. Using element event props (rather than useEffect wiring) keeps
  // us compliant with the project's no-`useEffect` convention.
  function handleLoadedMetadata(e: React.SyntheticEvent<HTMLAudioElement>) {
    const duration = e.currentTarget.duration;
    setActive((prev) =>
      prev ? { ...prev, duration: Number.isFinite(duration) ? duration : 0 } : prev,
    );
  }

  function handleTimeUpdate(e: React.SyntheticEvent<HTMLAudioElement>) {
    const currentTime = e.currentTarget.currentTime;
    setActive((prev) => (prev ? { ...prev, currentTime } : prev));
  }

  function handlePlay() {
    setActive((prev) => (prev ? { ...prev, isPlaying: true } : prev));
  }

  function handlePause() {
    setActive((prev) => (prev ? { ...prev, isPlaying: false } : prev));
  }

  function handleEnded() {
    setActive((prev) =>
      prev ? { ...prev, isPlaying: false, currentTime: 0 } : prev,
    );
  }

  return (
    <div
      ref={containerRef}
      className="dark min-h-screen bg-deep-forest text-ivory relative"
    >
      {banner}
      <Header
        scrollY={scrollY}
        showPricing={showPricing}
        showAbout={showAbout}
        aboutHref={aboutHref}
        showRecordings={showRecordings}
        showGallery={showGallery}
        homeSectionBase={homeSectionBase}
        recordingsHref={recordingsNavHref}
      />

      <main>
        <PageHeader
          eyebrow="Recordings"
          title="Selected Recordings"
          meta="Tracked · Mixed · Mastered"
          backHref={backToHomeHref}
          titleId="recordings-title"
          titleSize="standard"
        />

        <section
          className="relative bg-washed-black px-6 pb-24 md:px-16 md:pb-36"
          aria-label="Recordings list"
        >
          <div className="mx-auto max-w-6xl">
            <p
              className={cn(
                revealDelay(0),
                "editorial-lede max-w-2xl text-ivory/70",
              )}
            >
              A curated selection of projects tracked, mixed, or mastered at
              Lula Lake Sound. Each piece carries the character of the
              mountain — press play to hear the room.
            </p>

            {recordings.length === 0 ? (
              <div
                className={cn(
                  revealDelay(1),
                  "mt-16 border border-dashed border-sand/15 px-8 py-20 text-center",
                )}
              >
                <p className="label-text text-[11px] tracking-[0.2em] text-sand/50">
                  No recordings yet
                </p>
                <p className="body-text-small mt-4 text-ivory/55 max-w-md mx-auto">
                  We&rsquo;re finalizing the first wave of tracks. Check
                  back shortly, or get in touch to add your session to the
                  calendar.
                </p>
              </div>
            ) : (
              <div className={cn(revealDelay(1), "mt-14")}>
                {/* Column headers — desktop only */}
                <div
                  aria-hidden
                  className="hidden md:grid items-center gap-x-4 border-b border-sand/15 px-4 pb-3 lg:gap-x-5"
                  style={{
                    gridTemplateColumns:
                      "44px 48px minmax(0,1fr) minmax(0,160px) minmax(8.75rem, 13rem) minmax(5.5rem, 6rem) minmax(5.75rem, 7.25rem)",
                  }}
                >
                  <span />
                  <span />
                  <span className="label-text pl-3 text-[10px] tracking-[0.2em] text-sand/45">
                    Track · Artist
                  </span>
                  <span className="hidden lg:block" />
                  <span className="label-text pr-1 text-right text-[10px] tracking-[0.2em] text-sand/45">
                    Genre
                  </span>
                  <span className="label-text pl-1 text-right text-[10px] tracking-[0.2em] text-sand/45">
                    Year
                  </span>
                  <span className="label-text px-1 text-center text-[10px] tracking-[0.2em] text-sand/45">
                    Stream
                  </span>
                </div>

                <ul className="list-none">
                  {recordings.map((track, i) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={i}
                      active={active}
                      onToggle={handleToggle}
                      onSeekFraction={handleSeekFraction}
                    />
                  ))}
                </ul>
              </div>
            )}

            <div
              className={cn(
                revealDelay(2),
                "mt-20 border-t border-sand/10 pt-16 flex flex-col gap-8 md:flex-row md:items-center md:justify-between",
              )}
            >
              <div className="max-w-lg">
                <h2 className="headline-secondary text-2xl text-sand">
                  Hear yourself here
                </h2>
                <p className="body-text-small mt-3 text-ivory/55">
                  Whether you&rsquo;re tracking a full band or an intimate
                  solo project, the mountain makes a difference you can
                  hear.
                </p>
              </div>
              <Link
                href={`${backToHomeHref}#artist-inquiries`}
                className="label-text tracking-[0.2em] text-[11px] text-sand border-b border-sand/60 pb-1 self-start transition-colors hover:text-warm-white hover:border-warm-white"
              >
                Book a session
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Single shared audio element — hidden, no native controls, and
          intentionally not preloaded so idle tracks don't fetch audio. */}
      <audio
        ref={setAudioEl}
        preload="none"
        playsInline
        crossOrigin="anonymous"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        aria-hidden
      />

      <SiteFooter />
    </div>
  );
}
