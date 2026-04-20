"use client";

import {
  usePreloadedQuery,
  useQuery,
  type Preloaded,
} from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";

type PreloadedPricing = Preloaded<typeof api.public.getPublishedPricingFlags>;
type PreloadedGear = Preloaded<typeof api.public.getPublishedGear>;

export function HomeClient({
  preloadedPricing,
  preloadedGear,
}: {
  preloadedPricing: PreloadedPricing | null;
  preloadedGear: PreloadedGear | null;
}) {
  if (preloadedPricing !== null && preloadedGear !== null) {
    return (
      <BothPreloaded
        preloadedPricing={preloadedPricing}
        preloadedGear={preloadedGear}
      />
    );
  }
  if (preloadedPricing !== null) {
    return <PricingPreloadedGearLive preloadedPricing={preloadedPricing} />;
  }
  if (preloadedGear !== null) {
    return <PricingLiveGearPreloaded preloadedGear={preloadedGear} />;
  }
  return <BothLive />;
}

function BothPreloaded({
  preloadedPricing,
  preloadedGear,
}: {
  preloadedPricing: PreloadedPricing;
  preloadedGear: PreloadedGear;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = usePreloadedQuery(preloadedGear);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} />;
}

function PricingPreloadedGearLive({
  preloadedPricing,
}: {
  preloadedPricing: PreloadedPricing;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = useQuery(api.public.getPublishedGear);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} />;
}

function PricingLiveGearPreloaded({
  preloadedGear,
}: {
  preloadedGear: PreloadedGear;
}) {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  const gear = usePreloadedQuery(preloadedGear);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} />;
}

function BothLive() {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  const gear = useQuery(api.public.getPublishedGear);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} />;
}
