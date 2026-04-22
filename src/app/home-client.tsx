"use client";

import { usePreloadedQuery, useQuery, type Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";
import type { PublishedAudioTrack } from "@/components/audio-portfolio";
import type { GalleryPhoto } from "@/components/the-space";

type PreloadedPricing = Preloaded<typeof api.public.getPublishedPricingFlags> | null;
type PreloadedGear = Preloaded<typeof api.public.getPublishedGear> | null;
type PreloadedPhotos = Preloaded<typeof api.public.getPublishedGalleryPhotos> | null;
type PreloadedAudio = Preloaded<typeof api.public.getPublishedAudioTracks> | null;

function toPublishedAudioTracks(
  rows:
    | Array<{ stableId: string; title: string; url: string | null }>
    | undefined,
): PublishedAudioTrack[] | undefined {
  if (rows === undefined) {
    return undefined;
  }
  return rows
    .filter((r): r is typeof r & { url: string } => r.url !== null)
    .map((r) => ({
      stableId: r.stableId,
      title: r.title,
      url: r.url,
    }));
}

function PhotosData({
  preloaded,
  children,
}: {
  preloaded: PreloadedPhotos;
  children: (photos: GalleryPhoto[] | undefined) => React.ReactNode;
}) {
  if (preloaded) {
    return <PhotosFromPreload preloaded={preloaded}>{children}</PhotosFromPreload>;
  }
  return <PhotosLive>{children}</PhotosLive>;
}

function PhotosFromPreload({
  preloaded,
  children,
}: {
  preloaded: NonNullable<PreloadedPhotos>;
  children: (photos: GalleryPhoto[] | undefined) => React.ReactNode;
}) {
  const photos = usePreloadedQuery(preloaded);
  return <>{children(photos)}</>;
}

function PhotosLive({
  children,
}: {
  children: (photos: GalleryPhoto[] | undefined) => React.ReactNode;
}) {
  const photos = useQuery(api.public.getPublishedGalleryPhotos);
  return <>{children(photos)}</>;
}

function AudioData({
  preloaded,
  children,
}: {
  preloaded: PreloadedAudio;
  children: (
    audioTracks: PublishedAudioTrack[] | undefined,
  ) => React.ReactNode;
}) {
  if (preloaded) {
    return <AudioFromPreload preloaded={preloaded}>{children}</AudioFromPreload>;
  }
  return <AudioLive>{children}</AudioLive>;
}

function AudioFromPreload({
  preloaded,
  children,
}: {
  preloaded: NonNullable<PreloadedAudio>;
  children: (
    audioTracks: PublishedAudioTrack[] | undefined,
  ) => React.ReactNode;
}) {
  const rows = usePreloadedQuery(preloaded);
  return <>{children(toPublishedAudioTracks(rows))}</>;
}

function AudioLive({
  children,
}: {
  children: (
    audioTracks: PublishedAudioTrack[] | undefined,
  ) => React.ReactNode;
}) {
  const rows = useQuery(api.public.getPublishedAudioTracks);
  return <>{children(toPublishedAudioTracks(rows))}</>;
}

function BothPreloaded({
  preloadedPricing,
  preloadedGear,
  photos,
  audioTracks,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  preloadedGear: NonNullable<PreloadedGear>;
  photos: GalleryPhoto[] | undefined;
  audioTracks: PublishedAudioTrack[] | undefined;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = usePreloadedQuery(preloadedGear);
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      gear={gear}
      photos={photos}
      audioTracks={audioTracks}
    />
  );
}

function PricingPreloadedGearLive({
  preloadedPricing,
  photos,
  audioTracks,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  photos: GalleryPhoto[] | undefined;
  audioTracks: PublishedAudioTrack[] | undefined;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = useQuery(api.public.getPublishedGear);
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      gear={gear}
      photos={photos}
      audioTracks={audioTracks}
    />
  );
}

function PricingLiveGearPreloaded({
  preloadedGear,
  photos,
  audioTracks,
}: {
  preloadedGear: NonNullable<PreloadedGear>;
  photos: GalleryPhoto[] | undefined;
  audioTracks: PublishedAudioTrack[] | undefined;
}) {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  const gear = usePreloadedQuery(preloadedGear);
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      gear={gear}
      photos={photos}
      audioTracks={audioTracks}
    />
  );
}

function BothLive({
  photos,
  audioTracks,
}: {
  photos: GalleryPhoto[] | undefined;
  audioTracks: PublishedAudioTrack[] | undefined;
}) {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  const gear = useQuery(api.public.getPublishedGear);
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      gear={gear}
      photos={photos}
      audioTracks={audioTracks}
    />
  );
}

export function HomeClient({
  preloadedPricing,
  preloadedGear,
  preloadedPhotos,
  preloadedAudio,
}: {
  preloadedPricing: PreloadedPricing;
  preloadedGear: PreloadedGear;
  preloadedPhotos: PreloadedPhotos;
  preloadedAudio: PreloadedAudio;
}) {
  return (
    <PhotosData preloaded={preloadedPhotos}>
      {(photos) => (
        <AudioData preloaded={preloadedAudio}>
          {(audioTracks) => {
            if (preloadedPricing && preloadedGear) {
              return (
                <BothPreloaded
                  preloadedPricing={preloadedPricing}
                  preloadedGear={preloadedGear}
                  photos={photos}
                  audioTracks={audioTracks}
                />
              );
            }
            if (preloadedPricing) {
              return (
                <PricingPreloadedGearLive
                  preloadedPricing={preloadedPricing}
                  photos={photos}
                  audioTracks={audioTracks}
                />
              );
            }
            if (preloadedGear) {
              return (
                <PricingLiveGearPreloaded
                  preloadedGear={preloadedGear}
                  photos={photos}
                  audioTracks={audioTracks}
                />
              );
            }
            return <BothLive photos={photos} audioTracks={audioTracks} />;
          }}
        </AudioData>
      )}
    </PhotosData>
  );
}
