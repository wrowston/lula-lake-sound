"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";

export function HomeClient({
  preloadedPricing,
}: {
  preloadedPricing: Preloaded<typeof api.public.getPublishedPricingFlags>;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  return <HomepageShell pricingFlags={pricingFlags} />;
}
