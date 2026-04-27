"use client";

import { usePreloadedQuery, useQuery, type Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";
import type { PublishedAudioTrack } from "@/components/audio-portfolio";
import type { GalleryPhoto } from "@/components/the-space";
import type { FaqCategoryProps } from "@/components/faq";
import type { MarketingFeatureFlags } from "@/lib/site-settings";

type PreloadedPricing = Preloaded<typeof api.public.getPublishedPricingFlags> | null;
type PreloadedGear = Preloaded<typeof api.public.getPublishedGear> | null;
type PreloadedPhotos = Preloaded<typeof api.public.getPublishedGalleryPhotos> | null;
type PreloadedAudio = Preloaded<typeof api.public.getPublishedAudioTracks> | null;
type PreloadedFaq = Preloaded<typeof api.public.getPublishedFaq> | null;
type PreloadedMarketing =
  | Preloaded<typeof api.public.getPublishedMarketingFeatureFlags>
  | null;

type PublishedFaqPayload = { categories: readonly FaqCategoryProps[] };

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
    albumThumbnailStorageUrl: string | null;
    albumThumbnailDisplayUrl: string | null;
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
      albumThumbnailStorageUrl: t.albumThumbnailStorageUrl,
      albumThumbnailDisplayUrl: t.albumThumbnailDisplayUrl,
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

function FaqData({
  preloaded,
  children,
}: {
  preloaded: PreloadedFaq;
  children: (faq: PublishedFaqPayload | undefined) => React.ReactNode;
}) {
  if (preloaded) {
    return <FaqFromPreload preloaded={preloaded}>{children}</FaqFromPreload>;
  }
  return <FaqLive>{children}</FaqLive>;
}

function FaqFromPreload({
  preloaded,
  children,
}: {
  preloaded: NonNullable<PreloadedFaq>;
  children: (faq: PublishedFaqPayload | undefined) => React.ReactNode;
}) {
  const faq = usePreloadedQuery(preloaded);
  return <>{children(faq)}</>;
}

function FaqLive({
  children,
}: {
  children: (faq: PublishedFaqPayload | undefined) => React.ReactNode;
}) {
  const faq = useQuery(api.public.getPublishedFaq);
  return <>{children(faq)}</>;
}

function MarketingData({
  preloaded,
  children,
}: {
  preloaded: PreloadedMarketing;
  children: (
    marketing: MarketingFeatureFlags | null | undefined,
  ) => React.ReactNode;
}) {
  if (preloaded) {
    return (
      <MarketingFromPreload preloaded={preloaded}>
        {children}
      </MarketingFromPreload>
    );
  }
  return <MarketingLive>{children}</MarketingLive>;
}

function MarketingFromPreload({
  preloaded,
  children,
}: {
  preloaded: NonNullable<PreloadedMarketing>;
  children: (
    marketing: MarketingFeatureFlags | null | undefined,
  ) => React.ReactNode;
}) {
  const marketing = usePreloadedQuery(preloaded);
  return <>{children(marketing)}</>;
}

function MarketingLive({
  children,
}: {
  children: (
    marketing: MarketingFeatureFlags | null | undefined,
  ) => React.ReactNode;
}) {
  const marketing = useQuery(api.public.getPublishedMarketingFeatureFlags);
  return <>{children(marketing)}</>;
}

function BothPreloaded({
  preloadedPricing,
  preloadedGear,
  photos,
  audioTracks,
  faq,
  marketing,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  preloadedGear: NonNullable<PreloadedGear>;
  photos: GalleryPhoto[] | undefined;
  audioTracks: PublishedAudioTrack[] | undefined;
  faq: PublishedFaqPayload | undefined;
  marketing: MarketingFeatureFlags | null | undefined;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = usePreloadedQuery(preloadedGear);
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      marketingFeatureFlags={marketing}
      gear={gear}
      photos={photos}
      audioTracks={audioTracks}
      faqCategories={faq?.categories}
    />
  );
}

function PricingPreloadedGearLive({
  preloadedPricing,
  photos,
  audioTracks,
  faq,
  marketing,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  photos: GalleryPhoto[] | undefined;
  audioTracks: PublishedAudioTrack[] | undefined;
  faq: PublishedFaqPayload | undefined;
  marketing: MarketingFeatureFlags | null | undefined;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = useQuery(api.public.getPublishedGear);
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      marketingFeatureFlags={marketing}
      gear={gear}
      photos={photos}
      audioTracks={audioTracks}
      faqCategories={faq?.categories}
    />
  );
}

function PricingLiveGearPreloaded({
  preloadedGear,
  photos,
  audioTracks,
  faq,
  marketing,
}: {
  preloadedGear: NonNullable<PreloadedGear>;
  photos: GalleryPhoto[] | undefined;
  audioTracks: PublishedAudioTrack[] | undefined;
  faq: PublishedFaqPayload | undefined;
  marketing: MarketingFeatureFlags | null | undefined;
}) {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  const gear = usePreloadedQuery(preloadedGear);
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      marketingFeatureFlags={marketing}
      gear={gear}
      photos={photos}
      audioTracks={audioTracks}
      faqCategories={faq?.categories}
    />
  );
}

function BothLive({
  photos,
  audioTracks,
  faq,
  marketing,
}: {
  photos: GalleryPhoto[] | undefined;
  audioTracks: PublishedAudioTrack[] | undefined;
  faq: PublishedFaqPayload | undefined;
  marketing: MarketingFeatureFlags | null | undefined;
}) {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  const gear = useQuery(api.public.getPublishedGear);
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      marketingFeatureFlags={marketing}
      gear={gear}
      photos={photos}
      audioTracks={audioTracks}
      faqCategories={faq?.categories}
    />
  );
}

export function HomeClient({
  preloadedPricing,
  preloadedGear,
  preloadedPhotos,
  preloadedAudio,
  preloadedFaq,
  preloadedMarketing,
}: {
  preloadedPricing: PreloadedPricing;
  preloadedGear: PreloadedGear;
  preloadedPhotos: PreloadedPhotos;
  preloadedAudio: PreloadedAudio;
  preloadedFaq: PreloadedFaq;
  preloadedMarketing: PreloadedMarketing;
}) {
  return (
    <MarketingData preloaded={preloadedMarketing}>
      {(marketing) => (
        <PhotosData preloaded={preloadedPhotos}>
          {(photos) => (
            <AudioData preloaded={preloadedAudio}>
              {(audioTracks) => (
                <FaqData preloaded={preloadedFaq}>
                  {(faq) => {
                    if (preloadedPricing && preloadedGear) {
                      return (
                        <BothPreloaded
                          preloadedPricing={preloadedPricing}
                          preloadedGear={preloadedGear}
                          photos={photos}
                          audioTracks={audioTracks}
                          faq={faq}
                          marketing={marketing}
                        />
                      );
                    }
                    if (preloadedPricing) {
                      return (
                        <PricingPreloadedGearLive
                          preloadedPricing={preloadedPricing}
                          photos={photos}
                          audioTracks={audioTracks}
                          faq={faq}
                          marketing={marketing}
                        />
                      );
                    }
                    if (preloadedGear) {
                      return (
                        <PricingLiveGearPreloaded
                          preloadedGear={preloadedGear}
                          photos={photos}
                          audioTracks={audioTracks}
                          faq={faq}
                          marketing={marketing}
                        />
                      );
                    }
                    return (
                      <BothLive
                        photos={photos}
                        audioTracks={audioTracks}
                        faq={faq}
                        marketing={marketing}
                      />
                    );
                  }}
                </FaqData>
              )}
            </AudioData>
          )}
        </PhotosData>
      )}
    </MarketingData>
  );
}
