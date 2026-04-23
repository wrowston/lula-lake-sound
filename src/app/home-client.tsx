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

function PhotosData({
  preloaded,
  children,
}: {
  preloaded: PreloadedPhotos | null;
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

function materializePublishedAudio(
  rows: Array<{
    stableId: string;
    url: string | null;
    title: string;
    artist: string | null;
    description: string;
    mimeType: string;
    durationSec: number | null;
    sortOrder: number;
    albumThumbnailUrl: string | null;
    spotifyUrl: string | null;
    appleMusicUrl: string | null;
  }>,
): PublishedAudioTrack[] {
  return rows
    .filter((t): t is typeof t & { url: string } => t.url !== null)
    .map((t) => ({
      stableId: t.stableId,
      url: t.url,
      title: t.title,
      artist: t.artist,
      description: t.description,
      mimeType: t.mimeType,
      durationSec: t.durationSec,
      sortOrder: t.sortOrder,
      albumThumbnailUrl: t.albumThumbnailUrl,
      spotifyUrl: t.spotifyUrl,
      appleMusicUrl: t.appleMusicUrl,
    }));
}

function AudioData({
  preloaded,
  children,
}: {
  preloaded: PreloadedAudio | null;
  children: (audio: PublishedAudioTrack[] | undefined) => React.ReactNode;
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
  children: (audio: PublishedAudioTrack[] | undefined) => React.ReactNode;
}) {
  const raw = usePreloadedQuery(preloaded);
  const audio = raw === undefined ? undefined : materializePublishedAudio(raw);
  return <>{children(audio)}</>;
}

function AudioLive({
  children,
}: {
  children: (audio: PublishedAudioTrack[] | undefined) => React.ReactNode;
}) {
  const raw = useQuery(api.public.getPublishedAudioTracks);
  const audio =
    raw === undefined ? undefined : materializePublishedAudio(raw);
  return <>{children(audio)}</>;
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
            return (
              <BothLive photos={photos} audioTracks={audioTracks} />
            );
          }}
        </AudioData>
      )}
    </PhotosData>
  );
}
