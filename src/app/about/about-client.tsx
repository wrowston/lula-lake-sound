"use client";

import type { Preloaded } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AboutLayout } from "./about-layout";
import {
  DEFAULT_MARKETING_FEATURE_FLAGS,
  isHomepagePricingSectionEnabled,
  type MarketingFeatureFlags,
} from "@/lib/site-settings";
import {
  PUBLIC_CONVEX_QUERY_FAILED,
  useSafePreloadedQuery,
} from "@/lib/use-public-convex-query";

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
  const data = useSafePreloadedQuery(aboutPreloaded, { section: "about_body" });
  const marketingLive = useSafePreloadedQuery(marketingPreloaded, {
    section: "about_marketing_flags",
  });
  const marketing: MarketingFeatureFlags =
    marketingLive === PUBLIC_CONVEX_QUERY_FAILED ||
    marketingLive === null ||
    marketingLive === undefined
      ? DEFAULT_MARKETING_FEATURE_FLAGS
      : marketingLive;
  const showPricing = isHomepagePricingSectionEnabled(marketing);

  return (
    <AboutLayout
      data={data === PUBLIC_CONVEX_QUERY_FAILED ? undefined : data}
      showPricing={showPricing}
      marketing={marketing}
      convexUnavailable={data === PUBLIC_CONVEX_QUERY_FAILED}
    />
  );
}
