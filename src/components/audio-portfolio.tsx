"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PublishedAudioTrack = {
  stableId: string;
  url: string;
  title: string;
  artist: string | null;
  description: string;
  mimeType: string;
  durationSec: number | null;
  sortOrder: number;
  albumThumbnailUrl: string | null;
  albumThumbnailStorageUrl: string | null;
  albumThumbnailDisplayUrl: string | null;
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
};

function formatDuration(sec: number | null): string {
  if (sec === null || !Number.isFinite(sec) || sec < 0) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function useExclusiveAudioPlayback() {
  const activeRef = useRef<HTMLAudioElement | null>(null);

  const claimExclusive = useCallback((el: HTMLAudioElement | null) => {
    if (activeRef.current && activeRef.current !== el) {
      activeRef.current.pause();
    }
    activeRef.current = el;
  }, []);

  return claimExclusive;
}

function TrackAudioPlayer({
  stableId,
  trackTitle,
  src,
  claimExclusive,
}: {
  stableId: string;
  trackTitle: string;
  src: string;
  claimExclusive: (el: HTMLAudioElement | null) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastAssignedSrcRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const labelPlaying = `Pause audio sample: ${trackTitle}`;
  const labelPaused = `Play audio sample: ${trackTitle}`;

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (lastAssignedSrcRef.current !== src) {
      audio.src = src;
      lastAssignedSrcRef.current = src;
    }

    if (audio.paused) {
      claimExclusive(audio);
      void audio.play().catch(() => {
        /* Autoplay policy / decode errors — leave paused */
      });
    } else {
      audio.pause();
    }
  };

  return (
    <div className="rounded-sm border border-sage/30 bg-sage/10 p-3">
      <audio
        ref={audioRef}
        id={`audio-sample-${stableId}`}
        preload="none"
        playsInline
        crossOrigin="anonymous"
        aria-label={trackTitle}
        onPlay={() => {
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 w-full gap-2 border-sage/40 text-ivory hover:bg-sage/20"
        onClick={togglePlayback}
        aria-controls={`audio-sample-${stableId}`}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? labelPlaying : labelPaused}
      >
        {isPlaying ? (
          <Pause className="size-4 shrink-0" aria-hidden />
        ) : (
          <Play className="size-4 shrink-0" aria-hidden />
        )}
        <span className="font-titillium text-xs font-normal normal-case tracking-normal">
          {isPlaying ? "Pause sample" : "Play sample"}
        </span>
      </Button>
    </div>
  );
}

function AudioPortfolioEmpty() {
  return (
    <section
      id="audio-portfolio"
      className="relative bg-forest px-4 py-20"
      aria-labelledby="audio-portfolio-heading"
    >
      <div className="absolute inset-0 bg-texture-stone opacity-20" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2
            id="audio-portfolio-heading"
            className="mb-6 font-acumin text-3xl font-bold text-sand md:text-4xl"
          >
            STUDIO PORTFOLIO
          </h2>
          <p className="mx-auto max-w-3xl font-titillium text-lg leading-relaxed text-ivory/80">
            Listen to the quality and character that artists achieve at Lula Lake
            Sound. From intimate acoustic sessions to full band recordings, hear how
            our space and expertise bring out the best in every project.
          </p>
        </div>

        <div
          className="mb-12 flex min-h-[12rem] flex-col items-center justify-center rounded-sm border border-sage/25 bg-washed-black/40 px-6 py-16 text-center"
          role="status"
        >
          <p className="max-w-md font-titillium text-base text-ivory/70">
            New studio samples will appear here after they are published. Check back
            soon, or get in touch to hear more in person.
          </p>
        </div>

        <div className="text-center">
          <p className="mb-6 font-titillium text-ivory/70">
            Ready to create something extraordinary?
          </p>
          <Button
            variant="outline"
            size="lg"
            className="h-10 px-6"
            onClick={() =>
              document
                .getElementById("artist-inquiries")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            START YOUR PROJECT
          </Button>
        </div>
      </div>
    </section>
  );
}

export function AudioPortfolio({
  tracks,
}: {
  tracks: PublishedAudioTrack[] | null | undefined;
}) {
  const isLoading = tracks === undefined;
  const claimExclusive = useExclusiveAudioPlayback();

  if (isLoading) {
    return (
      <section
        id="audio-portfolio"
        className="relative bg-forest px-4 py-20"
        aria-busy="true"
      >
        <div className="absolute inset-0 bg-texture-stone opacity-20" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mb-16 h-10 max-w-md animate-pulse rounded bg-ivory/[0.08]" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-sm border border-sage/20 bg-washed-black/40"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const list = tracks ?? [];

  if (list.length === 0) {
    return <AudioPortfolioEmpty />;
  }

  return (
    <section
      id="audio-portfolio"
      className="relative bg-forest px-4 py-20"
      aria-labelledby="audio-portfolio-heading-loaded"
    >
      <div className="absolute inset-0 bg-texture-stone opacity-20" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2
            id="audio-portfolio-heading-loaded"
            className="mb-6 font-acumin text-3xl font-bold text-sand md:text-4xl"
          >
            STUDIO PORTFOLIO
          </h2>
          <p className="mx-auto max-w-3xl font-titillium text-lg leading-relaxed text-ivory/80">
            Listen to the quality and character that artists achieve at Lula Lake
            Sound. From intimate acoustic sessions to full band recordings, hear how
            our space and expertise bring out the best in every project.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {list.map((track) => (
            <article
              key={track.stableId}
              className="rounded-sm border border-sage/30 bg-washed-black/60 p-6 transition-colors hover:border-sand/50"
              aria-labelledby={`track-title-${track.stableId}`}
            >
              <div className="relative mb-4 aspect-square overflow-hidden rounded-sm bg-sage/20">
                {track.albumThumbnailDisplayUrl ? (
                  <Image
                    src={track.albumThumbnailDisplayUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center font-titillium text-sm text-sage/60"
                    aria-hidden
                  >
                    Album art
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h3
                  id={`track-title-${track.stableId}`}
                  className="mb-1 font-acumin text-lg font-bold text-sand"
                >
                  {track.title}
                </h3>
                {track.artist ? (
                  <p className="font-titillium text-sm text-ivory/70">{track.artist}</p>
                ) : null}
                {track.durationSec !== null && track.durationSec > 0 ? (
                  <p className="mt-1 font-titillium text-xs uppercase tracking-wide text-sage/80">
                    {formatDuration(track.durationSec)}
                  </p>
                ) : null}
              </div>

              <p className="mb-4 font-titillium text-sm leading-relaxed text-ivory/60">
                {track.description}
              </p>

              {(track.spotifyUrl ?? track.appleMusicUrl) ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {track.spotifyUrl ? (
                    <a
                      href={track.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-8 no-underline hover:no-underline",
                      )}
                    >
                      Spotify
                    </a>
                  ) : null}
                  {track.appleMusicUrl ? (
                    <a
                      href={track.appleMusicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-8 no-underline hover:no-underline",
                      )}
                    >
                      Apple Music
                    </a>
                  ) : null}
                </div>
              ) : null}

              <TrackAudioPlayer
                stableId={track.stableId}
                trackTitle={track.title}
                src={track.url}
                claimExclusive={claimExclusive}
              />
            </article>
          ))}
        </div>

        <div className="text-center">
          <p className="mb-6 font-titillium text-ivory/70">
            Ready to create something extraordinary?
          </p>
          <Button
            variant="outline"
            size="lg"
            className="h-10 px-6"
            onClick={() =>
              document
                .getElementById("artist-inquiries")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            START YOUR PROJECT
          </Button>
        </div>
      </div>
    </section>
  );
}
