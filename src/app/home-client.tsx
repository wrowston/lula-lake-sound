"use client";

import { usePreloadedQuery, useQuery, type Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";

type PreloadedPricing = Preloaded<typeof api.public.getPublishedPricingFlags> | null;
type PreloadedGear = Preloaded<typeof api.public.getPublishedGear> | null;

function BothPreloaded({
  preloadedPricing,
  preloadedGear,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  preloadedGear: NonNullable<PreloadedGear>;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = usePreloadedQuery(preloadedGear);
  const photos = useQuery(api.public.getPublishedGalleryPhotos);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} photos={photos} />;
}

function PricingPreloadedGearLive({
  preloadedPricing,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = useQuery(api.public.getPublishedGear);
  const photos = useQuery(api.public.getPublishedGalleryPhotos);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} photos={photos} />;
}

function PricingLiveGearPreloaded({
  preloadedGear,
}: {
  preloadedGear: NonNullable<PreloadedGear>;
}) {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  const gear = usePreloadedQuery(preloadedGear);
  const photos = useQuery(api.public.getPublishedGalleryPhotos);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} photos={photos} />;
}

function BothLive() {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  const gear = useQuery(api.public.getPublishedGear);
  const photos = useQuery(api.public.getPublishedGalleryPhotos);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} photos={photos} />;
}

export function HomeClient({
  preloadedPricing,
  preloadedGear,
}: {
  preloadedPricing: PreloadedPricing;
  preloadedGear: PreloadedGear;
}) {
  if (preloadedPricing && preloadedGear) {
    return (
      <BothPreloaded
        preloadedPricing={preloadedPricing}
        preloadedGear={preloadedGear}
      />
    );
  }
  if (preloadedPricing) {
    return <PricingPreloadedGearLive preloadedPricing={preloadedPricing} />;
  }
  if (preloadedGear) {
    return <PricingLiveGearPreloaded preloadedGear={preloadedGear} />;
  }
  return <BothLive />;
}
