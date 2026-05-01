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

function VideoShowcaseSkeleton({
  variant,
}: {
  readonly variant: "marketing" | "gallery";
}) {
  const surface =
    variant === "gallery"
      ? "bg-deep-forest"
      : "bg-washed-black";
  return (
    <section
      aria-label="Loading videos"
      className={`relative overflow-hidden px-6 py-28 md:py-36 ${surface}`}
    >
      <div
        className={
          variant === "gallery"
            ? "absolute inset-0 bg-texture-emerald opacity-[0.12]"
            : "absolute inset-0 bg-texture-ink-wash opacity-20"
        }
      />
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
  layout = "grid",
}: {
  readonly video: PublishedVideo;
  readonly index: number;
  readonly isActive: boolean;
  readonly onPlay: () => void;
  readonly layout?: "grid" | "featured";
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

  const featured = layout === "featured";

  return (
    <article
      className={cn(
        "group relative",
        featured &&
          "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-700",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden border bg-[#11100d] shadow-[0_28px_80px_rgba(0,0,0,0.28)] transition-shadow duration-500 group-hover:shadow-[0_36px_100px_rgba(0,0,0,0.38)]",
          featured
            ? "border-sand/22 shadow-[0_40px_120px_rgba(0,0,0,0.45)] ring-1 ring-sand/[0.07]"
            : "border-sand/15",
        )}
      >
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
                className={cn(
                  "absolute left-6 top-5 label-text text-ivory/60",
                  featured ? "text-xs top-6 left-8" : "text-[10px]",
                )}
                aria-hidden
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "relative flex items-center justify-center rounded-full border border-sand/50 bg-washed-black/70 text-sand shadow-[0_0_40px_rgba(198,189,160,0.16)] backdrop-blur-sm transition duration-500 group-hover:scale-105 group-hover:border-sand",
                  featured
                    ? "h-24 w-24 md:h-28 md:w-28"
                    : "h-20 w-20",
                )}
              >
                {canPlay ? (
                  <Play
                    className={cn(
                      "ml-1 fill-current",
                      featured ? "h-9 w-9 md:h-10 md:w-10" : "h-7 w-7",
                    )}
                    aria-hidden
                  />
                ) : (
                  <Film
                    className={featured ? "h-9 w-9 md:h-10 md:w-10" : "h-7 w-7"}
                    aria-hidden
                  />
                )}
              </span>
            </button>
          )}
        </div>

        <div
          className={cn(
            "relative flex flex-col justify-between gap-6",
            featured ? "min-h-40 p-6 md:min-h-48 md:p-8 lg:p-10" : "min-h-44 p-6",
          )}
        >
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
            <h3
              className={cn(
                "headline-secondary text-warm-white",
                featured
                  ? "text-2xl md:text-3xl lg:text-[2.125rem] xl:text-4xl lg:max-w-[92%]"
                  : "text-xl md:text-2xl",
              )}
            >
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
  variant = "marketing",
}: {
  readonly videos: readonly PublishedVideo[] | null | undefined;
  readonly variant?: "marketing" | "gallery";
}) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  if (videos === undefined) {
    return <VideoShowcaseSkeleton variant={variant} />;
  }

  const availableVideos = [...(videos ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  if (availableVideos.length === 0) {
    return null;
  }

  const surface =
    variant === "gallery"
      ? "bg-deep-forest"
      : "bg-washed-black";
  const textureLayer =
    variant === "gallery"
      ? "absolute inset-0 bg-texture-emerald opacity-[0.12]"
      : "absolute inset-0 bg-texture-ink-wash opacity-[0.18]";

  const featuredSingle = availableVideos.length === 1;

  return (
    <section
      id="videos"
      className={`relative overflow-hidden px-5 py-28 sm:px-8 md:px-10 md:py-40 ${surface}`}
    >
      <div className={textureLayer} />
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sand/22 to-transparent"
        aria-hidden
      />
      <div
        className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-sand/[0.08] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[92rem]">
        <header className="reveal mb-12 max-w-[42rem] border-b border-sand/[0.12] pb-10 md:mb-16 md:pb-12 lg:pb-14">
          <p className="eyebrow mb-6 text-[0.6875rem] tracking-[var(--letter-spacing-wide)] text-sand/82">
            Watch
          </p>
          <h2 className="headline-primary reveal-axis text-[2.35rem] leading-[1.02] text-warm-white md:text-[3.1rem] lg:text-[3.65rem]">
            Sessions in Motion
          </h2>
        </header>

        <div
          className={cn(
            "grid gap-8 md:gap-10 xl:gap-12",
            featuredSingle ? "grid-cols-1" : "lg:grid-cols-2",
          )}
        >
          {availableVideos.map((video, index) => (
            <VideoCard
              key={video.stableId}
              video={video}
              index={index}
              isActive={activeVideoId === video.stableId}
              onPlay={() => setActiveVideoId(video.stableId)}
              layout={featuredSingle ? "featured" : "grid"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
