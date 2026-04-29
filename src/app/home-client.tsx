"use client";

import { usePreloadedQuery, useQuery, type Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";
import type { PublishedAmenitiesNearby } from "@/components/amenities-nearby";
import type { GalleryPhoto } from "@/components/the-space";
import type { FaqCategoryProps } from "@/components/faq";
import type { PublishedVideo } from "@/components/video-showcase";
import type { MarketingFeatureFlags } from "@/lib/site-settings";

type PreloadedPricing = Preloaded<typeof api.public.getPublishedPricingFlags> | null;
type PreloadedGear = Preloaded<typeof api.public.getPublishedGear> | null;
type PreloadedPhotos = Preloaded<typeof api.public.getPublishedCarouselPhotos> | null;
type PreloadedVideos = Preloaded<typeof api.public.getPublishedVideos> | null;
type PreloadedFaq = Preloaded<typeof api.public.getPublishedFaq> | null;
type PreloadedMarketing =
  | Preloaded<typeof api.public.getPublishedMarketingFeatureFlags>
  | null;
type PreloadedAmenities =
  | Preloaded<typeof api.public.getPublishedAmenitiesNearby>
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
  const photos = useQuery(api.public.getPublishedCarouselPhotos);
  return <>{children(photos)}</>;
}

function VideosData({
  preloaded,
  children,
}: {
  preloaded: PreloadedVideos | null;
  children: (videos: readonly PublishedVideo[] | undefined) => React.ReactNode;
}) {
  if (preloaded) {
    return <VideosFromPreload preloaded={preloaded}>{children}</VideosFromPreload>;
  }
  return <VideosLive>{children}</VideosLive>;
}

function VideosFromPreload({
  preloaded,
  children,
}: {
  preloaded: NonNullable<PreloadedVideos>;
  children: (videos: readonly PublishedVideo[] | undefined) => React.ReactNode;
}) {
  const videos = usePreloadedQuery(preloaded);
  return <>{children(videos)}</>;
}

function VideosLive({
  children,
}: {
  children: (videos: readonly PublishedVideo[] | undefined) => React.ReactNode;
}) {
  const videos = useQuery(api.public.getPublishedVideos);
  return <>{children(videos)}</>;
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

function AmenitiesData({
  preloaded,
  children,
}: {
  preloaded: PreloadedAmenities;
  children: (
    amenities: PublishedAmenitiesNearby | null | undefined,
  ) => React.ReactNode;
}) {
  if (preloaded) {
    return (
      <AmenitiesFromPreload preloaded={preloaded}>
        {children}
      </AmenitiesFromPreload>
    );
  }
  return <AmenitiesLive>{children}</AmenitiesLive>;
}

function AmenitiesFromPreload({
  preloaded,
  children,
}: {
  preloaded: NonNullable<PreloadedAmenities>;
  children: (
    amenities: PublishedAmenitiesNearby | null | undefined,
  ) => React.ReactNode;
}) {
  const amenities = usePreloadedQuery(preloaded);
  return <>{children(amenities)}</>;
}

function AmenitiesLive({
  children,
}: {
  children: (
    amenities: PublishedAmenitiesNearby | null | undefined,
  ) => React.ReactNode;
}) {
  const amenities = useQuery(api.public.getPublishedAmenitiesNearby);
  return <>{children(amenities)}</>;
}

function BothPreloaded({
  preloadedPricing,
  preloadedGear,
  photos,
  videos,
  faq,
  marketing,
  amenities,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  preloadedGear: NonNullable<PreloadedGear>;
  photos: GalleryPhoto[] | undefined;
  videos: readonly PublishedVideo[] | undefined;
  faq: PublishedFaqPayload | undefined;
  marketing: MarketingFeatureFlags | null | undefined;
  amenities: PublishedAmenitiesNearby | null | undefined;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = usePreloadedQuery(preloadedGear);
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      marketingFeatureFlags={marketing}
      gear={gear}
      photos={photos}
      videos={videos}
      faqCategories={faq?.categories}
      amenities={amenities}
    />
  );
}

function PricingPreloadedGearLive({
  preloadedPricing,
  photos,
  videos,
  faq,
  marketing,
  amenities,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  photos: GalleryPhoto[] | undefined;
  videos: readonly PublishedVideo[] | undefined;
  faq: PublishedFaqPayload | undefined;
  marketing: MarketingFeatureFlags | null | undefined;
  amenities: PublishedAmenitiesNearby | null | undefined;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = useQuery(api.public.getPublishedGear);
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      marketingFeatureFlags={marketing}
      gear={gear}
      photos={photos}
      videos={videos}
      faqCategories={faq?.categories}
      amenities={amenities}
    />
  );
}

function PricingLiveGearPreloaded({
  preloadedGear,
  photos,
  videos,
  faq,
  marketing,
  amenities,
}: {
  preloadedGear: NonNullable<PreloadedGear>;
  photos: GalleryPhoto[] | undefined;
  videos: readonly PublishedVideo[] | undefined;
  faq: PublishedFaqPayload | undefined;
  marketing: MarketingFeatureFlags | null | undefined;
  amenities: PublishedAmenitiesNearby | null | undefined;
}) {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  const gear = usePreloadedQuery(preloadedGear);
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      marketingFeatureFlags={marketing}
      gear={gear}
      photos={photos}
      videos={videos}
      faqCategories={faq?.categories}
      amenities={amenities}
    />
  );
}

function BothLive({
  photos,
  videos,
  faq,
  marketing,
  amenities,
}: {
  photos: GalleryPhoto[] | undefined;
  videos: readonly PublishedVideo[] | undefined;
  faq: PublishedFaqPayload | undefined;
  marketing: MarketingFeatureFlags | null | undefined;
  amenities: PublishedAmenitiesNearby | null | undefined;
}) {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  const gear = useQuery(api.public.getPublishedGear);
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      marketingFeatureFlags={marketing}
      gear={gear}
      photos={photos}
      videos={videos}
      faqCategories={faq?.categories}
      amenities={amenities}
    />
  );
}

export function HomeClient({
  preloadedPricing,
  preloadedGear,
  preloadedPhotos,
  preloadedVideos,
  preloadedFaq,
  preloadedMarketing,
  preloadedAmenities,
}: {
  preloadedPricing: PreloadedPricing;
  preloadedGear: PreloadedGear;
  preloadedPhotos: PreloadedPhotos;
  preloadedVideos: PreloadedVideos;
  preloadedFaq: PreloadedFaq;
  preloadedMarketing: PreloadedMarketing;
  preloadedAmenities: PreloadedAmenities;
}) {
  return (
    <MarketingData preloaded={preloadedMarketing}>
      {(marketing) => (
        <PhotosData preloaded={preloadedPhotos}>
          {(photos) => (
            <VideosData preloaded={preloadedVideos}>
              {(videos) => (
                <FaqData preloaded={preloadedFaq}>
                  {(faq) => (
                    <AmenitiesData preloaded={preloadedAmenities}>
                      {(amenities) => {
                        if (preloadedPricing && preloadedGear) {
                          return (
                            <BothPreloaded
                              preloadedPricing={preloadedPricing}
                              preloadedGear={preloadedGear}
                              photos={photos}
                              videos={videos}
                              faq={faq}
                              marketing={marketing}
                              amenities={amenities}
                            />
                          );
                        }
                        if (preloadedPricing) {
                          return (
                            <PricingPreloadedGearLive
                              preloadedPricing={preloadedPricing}
                              photos={photos}
                              videos={videos}
                              faq={faq}
                              marketing={marketing}
                              amenities={amenities}
                            />
                          );
                        }
                        if (preloadedGear) {
                          return (
                            <PricingLiveGearPreloaded
                              preloadedGear={preloadedGear}
                              photos={photos}
                              videos={videos}
                              faq={faq}
                              marketing={marketing}
                              amenities={amenities}
                            />
                          );
                        }
                        return (
                          <BothLive
                            photos={photos}
                            videos={videos}
                            faq={faq}
                            marketing={marketing}
                            amenities={amenities}
                          />
                        );
                      }}
                    </AmenitiesData>
                  )}
                </FaqData>
              )}
            </VideosData>
          )}
        </PhotosData>
      )}
    </MarketingData>
  );
}
