"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AboutLayout } from "./about-layout";
import { isHomepagePricingSectionEnabled } from "@/lib/site-settings";

type PreloadedAbout = Preloaded<typeof api.public.getPublishedAbout>;
type PreloadedMarketing = Preloaded<
  typeof api.public.getPublishedMarketingFeatureFlags
>;

/**
 * Public `/about` client. Resolves preloaded queries from the server
 * component and hands plain data to the shared {@link AboutLayout}, which is
 * also reused by the owner-only `/preview/about` route.
 */
export function AboutClient({
  aboutPreloaded,
  marketingPreloaded,
}: {
  readonly aboutPreloaded: PreloadedAbout;
  readonly marketingPreloaded: PreloadedMarketing;
}) {
  const data = usePreloadedQuery(aboutPreloaded);
  const marketing = usePreloadedQuery(marketingPreloaded);
  const showPricing = isHomepagePricingSectionEnabled(marketing);

  return <AboutLayout data={data} showPricing={showPricing} marketing={marketing} />;
}
