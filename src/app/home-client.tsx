"use client";

import { usePreloadedQuery, useQuery, type Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";
import type { GalleryPhoto } from "@/components/the-space";
import type { FaqCategoryProps } from "@/components/faq";
import type { MarketingFeatureFlags } from "@/lib/site-settings";

type PreloadedPricing = Preloaded<typeof api.public.getPublishedPricingFlags> | null;
type PreloadedGear = Preloaded<typeof api.public.getPublishedGear> | null;
type PreloadedPhotos = Preloaded<typeof api.public.getPublishedGalleryPhotos> | null;
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
  faq,
  marketing,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  preloadedGear: NonNullable<PreloadedGear>;
  photos: GalleryPhoto[] | undefined;
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
      faqCategories={faq?.categories}
    />
  );
}

function PricingPreloadedGearLive({
  preloadedPricing,
  photos,
  faq,
  marketing,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  photos: GalleryPhoto[] | undefined;
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
      faqCategories={faq?.categories}
    />
  );
}

function PricingLiveGearPreloaded({
  preloadedGear,
  photos,
  faq,
  marketing,
}: {
  preloadedGear: NonNullable<PreloadedGear>;
  photos: GalleryPhoto[] | undefined;
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
      faqCategories={faq?.categories}
    />
  );
}

function BothLive({
  photos,
  faq,
  marketing,
}: {
  photos: GalleryPhoto[] | undefined;
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
      faqCategories={faq?.categories}
    />
  );
}

export function HomeClient({
  preloadedPricing,
  preloadedGear,
  preloadedPhotos,
  preloadedFaq,
  preloadedMarketing,
}: {
  preloadedPricing: PreloadedPricing;
  preloadedGear: PreloadedGear;
  preloadedPhotos: PreloadedPhotos;
  preloadedFaq: PreloadedFaq;
  preloadedMarketing: PreloadedMarketing;
}) {
  return (
    <MarketingData preloaded={preloadedMarketing}>
      {(marketing) => (
        <PhotosData preloaded={preloadedPhotos}>
          {(photos) => (
            <FaqData preloaded={preloadedFaq}>
              {(faq) => {
                if (preloadedPricing && preloadedGear) {
                  return (
                    <BothPreloaded
                      preloadedPricing={preloadedPricing}
                      preloadedGear={preloadedGear}
                      photos={photos}
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
                      faq={faq}
                      marketing={marketing}
                    />
                  );
                }
                return (
                  <BothLive
                    photos={photos}
                    faq={faq}
                    marketing={marketing}
                  />
                );
              }}
            </FaqData>
          )}
        </PhotosData>
      )}
    </MarketingData>
  );
}
