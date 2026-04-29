"use client";

import { Film, Play } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  formatDuration,
  resolveVideoPreview,
  type VideoProvider,
} from "@/lib/video-embed";

export type PublishedVideo = {
  readonly stableId: string;
  readonly title: string;
  readonly description: string | null;
  readonly sortOrder: number;
  readonly provider: VideoProvider;
  readonly externalId: string | null;
  readonly playbackUrl: string | null;
  readonly videoUrl: string | null;
  readonly thumbnailUrl: string | null;
  readonly resolvedThumbnailUrl: string | null;
  readonly durationSec: number | null;
};

function VideoShowcaseSkeleton() {
  return (
    <section
      aria-label="Loading videos"
      className="relative overflow-hidden bg-washed-black px-6 py-28 md:py-36"
    >
      <div className="absolute inset-0 bg-texture-ink-wash opacity-20" />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="aspect-video animate-pulse border border-sand/10 bg-ivory/[0.04]"
          />
        ))}
      </div>
    </section>
  );
}

function VideoCard({
  video,
  index,
  isActive,
  onPlay,
}: {
  readonly video: PublishedVideo;
  readonly index: number;
  readonly isActive: boolean;
  readonly onPlay: () => void;
}) {
  const embed = resolveVideoPreview(
    {
      provider: video.provider,
      externalId: video.externalId,
      playbackUrl: video.playbackUrl,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.resolvedThumbnailUrl,
    },
    { title: video.title },
  );
  const duration = formatDuration(video.durationSec);
  const thumbnail = video.resolvedThumbnailUrl?.trim();
  const canPlay = embed.kind !== "missing";

  return (
    <article className="group relative">
      <div className="relative overflow-hidden border border-sand/15 bg-[#11100d] shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
        <div
          className="absolute -inset-px opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          aria-hidden
        >
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sand/80 to-transparent" />
          <div className="absolute inset-y-10 right-0 w-px bg-gradient-to-b from-transparent via-sand/55 to-transparent" />
        </div>

        <div className="relative aspect-video w-full overflow-hidden bg-washed-black">
          {isActive && embed.kind === "iframe" ? (
            <iframe
              title={video.title}
              src={embed.src}
              loading="lazy"
              allow={embed.allow}
              allowFullScreen={embed.allowFullScreen}
              className="absolute inset-0 h-full w-full"
            />
          ) : isActive && embed.kind === "video" ? (
            <video
              src={embed.src}
              poster={embed.poster}
              controls
              preload="metadata"
              playsInline
              className="absolute inset-0 h-full w-full bg-black object-contain"
            />
          ) : (
            <button
              type="button"
              onClick={canPlay ? onPlay : undefined}
              disabled={!canPlay}
              className={cn(
                "absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden text-left",
                canPlay
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-70",
              )}
              aria-label={canPlay ? `Play ${video.title}` : embed.reason}
            >
              {thumbnail ? (
                <span
                  className="absolute inset-0 bg-cover bg-center opacity-[0.78] grayscale-[18%] transition duration-700 group-hover:scale-105 group-hover:opacity-95"
                  style={{ backgroundImage: `url("${thumbnail}")` }}
                  aria-hidden
                />
              ) : (
                <span
                  className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(198,189,160,0.20),transparent_34%),linear-gradient(135deg,rgba(198,189,160,0.10),rgba(12,12,10,0.94)_54%)]"
                  aria-hidden
                />
              )}
              <span
                className="absolute inset-0 bg-[linear-gradient(120deg,rgba(12,12,10,0.18),rgba(12,12,10,0.72))]"
                aria-hidden
              />
              <span
                className="absolute left-6 top-5 label-text text-[10px] text-ivory/60"
                aria-hidden
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-sand/50 bg-washed-black/70 text-sand shadow-[0_0_40px_rgba(198,189,160,0.16)] backdrop-blur-sm transition duration-500 group-hover:scale-105 group-hover:border-sand">
                {canPlay ? (
                  <Play className="ml-1 h-7 w-7 fill-current" aria-hidden />
                ) : (
                  <Film className="h-7 w-7" aria-hidden />
                )}
              </span>
            </button>
          )}
        </div>

        <div className="relative flex min-h-44 flex-col justify-between gap-6 p-6">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="label-text text-[10px] text-sand/78">
                {embed.providerLabel}
              </p>
              {duration ? (
                <p className="label-text text-[10px] text-ivory/48">
                  {duration}
                </p>
              ) : null}
            </div>
            <h3 className="headline-secondary text-xl text-warm-white md:text-2xl">
              {video.title}
            </h3>
            {video.description ? (
              <p className="body-text-small mt-4 line-clamp-3 text-ivory/72">
                {video.description}
              </p>
            ) : null}
          </div>
          {embed.kind === "missing" ? (
            <p className="body-text-small text-ivory/45">{embed.reason}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function VideoShowcase({
  videos,
}: {
  readonly videos: readonly PublishedVideo[] | null | undefined;
}) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  if (videos === undefined) {
    return <VideoShowcaseSkeleton />;
  }

  const availableVideos = [...(videos ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  if (availableVideos.length === 0) {
    return null;
  }

  return (
    <section
      id="videos"
      className="relative overflow-hidden bg-washed-black px-6 py-28 md:py-40"
    >
      <div className="absolute inset-0 bg-texture-ink-wash opacity-[0.18]" />
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sand/22 to-transparent"
        aria-hidden
      />
      <div
        className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-sand/[0.08] blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="reveal mb-16 grid gap-8 md:grid-cols-[0.86fr_1.14fr] md:items-end">
          <div>
            <p className="eyebrow mb-6 text-sand/82">Watch</p>
            <h2 className="headline-primary text-[2.2rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
              Sessions in Motion
            </h2>
          </div>
          <p className="editorial-lede max-w-2xl font-normal text-ivory/86 md:justify-self-end">
            A look inside the room, the artists, and the performances shaped at
            Lula Lake Sound. Players load only when you press play.
          </p>
        </div>

        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {availableVideos.map((video, index) => (
            <VideoCard
              key={video.stableId}
              video={video}
              index={index}
              isActive={activeVideoId === video.stableId}
              onPlay={() => setActiveVideoId(video.stableId)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
