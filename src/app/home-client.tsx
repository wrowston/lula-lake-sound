"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";

export function HomeClient({
  preloadedPricing,
  preloadedGear,
}: {
  preloadedPricing: Preloaded<typeof api.public.getPublishedPricingFlags>;
  preloadedGear: Preloaded<typeof api.public.getPublishedGear>;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = usePreloadedQuery(preloadedGear);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} />;
}
