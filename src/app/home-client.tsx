"use client";

import { type Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";
import {
  usePublicConvexQuery,
  useSafePreloadedQuery,
} from "@/lib/use-public-convex-query";
import type { PublishedAmenitiesNearby } from "@/components/amenities-nearby";
import type { GalleryPhoto } from "@/components/the-space";
import type { FaqCategoryProps } from "@/components/faq";
import type { MarketingFeatureFlags } from "@/lib/site-settings";

type PreloadedPricing = Preloaded<typeof api.public.getPublishedPricingFlags> | null;
type PreloadedGear = Preloaded<typeof api.public.getPublishedGear> | null;
type PreloadedPhotos = Preloaded<typeof api.public.getPublishedCarouselPhotos> | null;
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
  children: (photos: GalleryPhoto[] | undefined | null) => React.ReactNode;
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
  children: (photos: GalleryPhoto[] | undefined | null) => React.ReactNode;
}) {
  const photos = useSafePreloadedQuery(preloaded, { section: "home_photos" });
  return <>{children(photos)}</>;
}

function PhotosLive({
  children,
}: {
  children: (photos: GalleryPhoto[] | undefined | null) => React.ReactNode;
}) {
  const photos = usePublicConvexQuery(
    api.public.getPublishedCarouselPhotos,
    {},
    { section: "home_photos" },
  );
  return <>{children(photos)}</>;
}

function FaqData({
  preloaded,
  children,
}: {
  preloaded: PreloadedFaq;
  children: (faq: PublishedFaqPayload | undefined | null) => React.ReactNode;
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
  children: (faq: PublishedFaqPayload | undefined | null) => React.ReactNode;
}) {
  const faq = useSafePreloadedQuery(preloaded, { section: "home_faq" });
  return <>{children(faq)}</>;
}

function FaqLive({
  children,
}: {
  children: (faq: PublishedFaqPayload | undefined | null) => React.ReactNode;
}) {
  const faq = usePublicConvexQuery(api.public.getPublishedFaq, {}, {
    section: "home_faq",
  });
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
  const marketing = useSafePreloadedQuery(preloaded, {
    section: "home_marketing_flags",
  });
  return <>{children(marketing)}</>;
}

function MarketingLive({
  children,
}: {
  children: (
    marketing: MarketingFeatureFlags | null | undefined,
  ) => React.ReactNode;
}) {
  const marketing = usePublicConvexQuery(
    api.public.getPublishedMarketingFeatureFlags,
    {},
    { section: "home_marketing_flags" },
  );
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
  const amenities = useSafePreloadedQuery(preloaded, {
    section: "home_amenities",
  });
  return <>{children(amenities)}</>;
}

function AmenitiesLive({
  children,
}: {
  children: (
    amenities: PublishedAmenitiesNearby | null | undefined,
  ) => React.ReactNode;
}) {
  const amenities = usePublicConvexQuery(
    api.public.getPublishedAmenitiesNearby,
    {},
    { section: "home_amenities" },
  );
  return <>{children(amenities)}</>;
}

function BothPreloaded({
  preloadedPricing,
  preloadedGear,
  photos,
  faq,
  marketing,
  amenities,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  preloadedGear: NonNullable<PreloadedGear>;
  photos: GalleryPhoto[] | undefined | null;
  faq: PublishedFaqPayload | undefined | null;
  marketing: MarketingFeatureFlags | null | undefined;
  amenities: PublishedAmenitiesNearby | null | undefined;
}) {
  const pricingFlags = useSafePreloadedQuery(preloadedPricing, {
    section: "home_pricing",
  });
  const gear = useSafePreloadedQuery(preloadedGear, { section: "home_gear" });
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      marketingFeatureFlags={marketing}
      gear={gear}
      photos={photos}
      faqCategories={faq === null ? null : faq?.categories}
      amenities={amenities}
    />
  );
}

function PricingPreloadedGearLive({
  preloadedPricing,
  photos,
  faq,
  marketing,
  amenities,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  photos: GalleryPhoto[] | undefined | null;
  faq: PublishedFaqPayload | undefined | null;
  marketing: MarketingFeatureFlags | null | undefined;
  amenities: PublishedAmenitiesNearby | null | undefined;
}) {
  const pricingFlags = useSafePreloadedQuery(preloadedPricing, {
    section: "home_pricing",
  });
  const gear = usePublicConvexQuery(api.public.getPublishedGear, {}, {
    section: "home_gear",
  });
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      marketingFeatureFlags={marketing}
      gear={gear}
      photos={photos}
      faqCategories={faq === null ? null : faq?.categories}
      amenities={amenities}
    />
  );
}

function PricingLiveGearPreloaded({
  preloadedGear,
  photos,
  faq,
  marketing,
  amenities,
}: {
  preloadedGear: NonNullable<PreloadedGear>;
  photos: GalleryPhoto[] | undefined | null;
  faq: PublishedFaqPayload | undefined | null;
  marketing: MarketingFeatureFlags | null | undefined;
  amenities: PublishedAmenitiesNearby | null | undefined;
}) {
  const pricingFlags = usePublicConvexQuery(
    api.public.getPublishedPricingFlags,
    {},
    { section: "home_pricing" },
  );
  const gear = useSafePreloadedQuery(preloadedGear, { section: "home_gear" });
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      marketingFeatureFlags={marketing}
      gear={gear}
      photos={photos}
      faqCategories={faq === null ? null : faq?.categories}
      amenities={amenities}
    />
  );
}

function BothLive({
  photos,
  faq,
  marketing,
  amenities,
}: {
  photos: GalleryPhoto[] | undefined | null;
  faq: PublishedFaqPayload | undefined | null;
  marketing: MarketingFeatureFlags | null | undefined;
  amenities: PublishedAmenitiesNearby | null | undefined;
}) {
  const pricingFlags = usePublicConvexQuery(
    api.public.getPublishedPricingFlags,
    {},
    { section: "home_pricing" },
  );
  const gear = usePublicConvexQuery(api.public.getPublishedGear, {}, {
    section: "home_gear",
  });
  return (
    <HomepageShell
      pricingFlags={pricingFlags}
      marketingFeatureFlags={marketing}
      gear={gear}
      photos={photos}
      faqCategories={faq === null ? null : faq?.categories}
      amenities={amenities}
    />
  );
}

export function HomeClient({
  preloadedPricing,
  preloadedGear,
  preloadedPhotos,
  preloadedFaq,
  preloadedMarketing,
  preloadedAmenities,
}: {
  preloadedPricing: PreloadedPricing;
  preloadedGear: PreloadedGear;
  preloadedPhotos: PreloadedPhotos;
  preloadedFaq: PreloadedFaq;
  preloadedMarketing: PreloadedMarketing;
  preloadedAmenities: PreloadedAmenities;
}) {
  return (
    <MarketingData preloaded={preloadedMarketing}>
      {(marketing) => (
        <PhotosData preloaded={preloadedPhotos}>
          {(photos) => (
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
                          faq={faq}
                          marketing={marketing}
                          amenities={amenities}
                        />
                      );
                    }
                    return (
                      <BothLive
                        photos={photos}
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
        </PhotosData>
      )}
    </MarketingData>
  );
}
