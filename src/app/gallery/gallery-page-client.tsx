"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { GalleryPhoto } from "@/components/the-space";
import { GalleryClient } from "./gallery-client";
import type { MarketingFeatureFlags } from "@/lib/site-settings";

type PreloadedPhotos = Preloaded<typeof api.public.getPublishedGalleryPhotos>;
type PreloadedMarketing = Preloaded<
  typeof api.public.getPublishedMarketingFeatureFlags
>;

/**
 * Resolves preloaded published gallery photos + marketing flags and hands
 * plain data to the shared {@link GalleryClient} layout. Subscribing keeps
 * Convex storage URLs fresh across navigations.
 */
export function GalleryPageClient({
  photosPreloaded,
  marketingPreloaded,
}: {
  readonly photosPreloaded: PreloadedPhotos;
  readonly marketingPreloaded: PreloadedMarketing;
}) {
  const photos = usePreloadedQuery(photosPreloaded) as GalleryPhoto[];
  const marketing: MarketingFeatureFlags =
    usePreloadedQuery(marketingPreloaded);

  return <GalleryClient photos={photos} marketing={marketing} />;
}
