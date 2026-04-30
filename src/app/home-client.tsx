"use client";

import { type Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";
import {
  type HomePublishedPreloads,
  useHomePublishedQueries,
} from "@/lib/use-home-published-queries";
import {
  PUBLIC_CONVEX_QUERY_FAILED,
  type PublicConvexQueryResult,
} from "@/lib/use-public-convex-query";
import type { PublishedAmenitiesNearby } from "@/components/amenities-nearby";
import type { GalleryPhoto } from "@/components/the-space";
import type { FaqCategoryProps } from "@/components/faq";
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

function faqCategoriesFromFaq(
  faq: PublicConvexQueryResult<PublishedFaqPayload>,
):
  | readonly FaqCategoryProps[]
  | null
  | undefined
  | typeof PUBLIC_CONVEX_QUERY_FAILED {
  if (faq === PUBLIC_CONVEX_QUERY_FAILED) {
    return PUBLIC_CONVEX_QUERY_FAILED;
  }
  if (faq === null) {
    return null;
  }
  if (faq === undefined) {
    return undefined;
  }
  return faq.categories;
}

function HomeInner({ preloads }: { readonly preloads: HomePublishedPreloads }) {
  const q = useHomePublishedQueries(preloads);
  return (
    <HomepageShell
      pricingFlags={q.pricingFlags}
      marketingFeatureFlags={q.marketing}
      gear={q.gear}
      photos={q.photos as PublicConvexQueryResult<GalleryPhoto[]>}
      faqCategories={faqCategoriesFromFaq(q.faq)}
      amenities={
        q.amenities as PublicConvexQueryResult<
          PublishedAmenitiesNearby | null
        >
      }
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
  const preloads: HomePublishedPreloads = {
    pricing: preloadedPricing,
    gear: preloadedGear,
    photos: preloadedPhotos,
    faq: preloadedFaq,
    marketing: preloadedMarketing,
    amenities: preloadedAmenities,
  };
  return <HomeInner preloads={preloads} />;
}
