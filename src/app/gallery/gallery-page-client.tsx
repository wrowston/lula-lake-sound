"use client";

import type { Preloaded } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { GalleryPhoto } from "@/components/the-space";
import { GalleryClient } from "./gallery-client";
import type { PublishedVideo } from "@/components/video-showcase";
import {
  type MarketingFeatureFlags,
  DEFAULT_MARKETING_FEATURE_FLAGS,
} from "@/lib/site-settings";
import {
  PUBLIC_CONVEX_QUERY_FAILED,
  useSafePreloadedQuery,
  type PublicConvexQueryResult,
} from "@/lib/use-public-convex-query";

type PreloadedPhotos = Preloaded<typeof api.public.getPublishedGalleryPhotos>;
type PreloadedVideos = Preloaded<typeof api.public.getPublishedVideos>;
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
  videosPreloaded,
  marketingPreloaded,
}: {
  readonly photosPreloaded: PreloadedPhotos;
  readonly videosPreloaded: PreloadedVideos;
  readonly marketingPreloaded: PreloadedMarketing;
}) {
  const photos = useSafePreloadedQuery(photosPreloaded, {
    section: "gallery_photos",
  }) as PublicConvexQueryResult<GalleryPhoto[]>;
  const videos = useSafePreloadedQuery(videosPreloaded, {
    section: "gallery_videos",
  }) as PublicConvexQueryResult<PublishedVideo[]>;
  const marketingLive = useSafePreloadedQuery(marketingPreloaded, {
    section: "gallery_marketing_flags",
  }) as PublicConvexQueryResult<MarketingFeatureFlags | null>;

  const marketing: MarketingFeatureFlags =
    marketingLive === PUBLIC_CONVEX_QUERY_FAILED ||
    marketingLive === null ||
    marketingLive === undefined
      ? DEFAULT_MARKETING_FEATURE_FLAGS
      : marketingLive;

  const photosResolved: readonly GalleryPhoto[] =
    photos === PUBLIC_CONVEX_QUERY_FAILED ||
    photos === null ||
    photos === undefined
      ? []
      : photos;
  const videosResolved: readonly PublishedVideo[] | undefined =
    videos === PUBLIC_CONVEX_QUERY_FAILED || videos === null
      ? undefined
      : videos;

  return (
    <GalleryClient
      photos={photosResolved}
      videos={videosResolved}
      marketing={marketing}
      convexUnavailable={
        photos === PUBLIC_CONVEX_QUERY_FAILED ||
        videos === PUBLIC_CONVEX_QUERY_FAILED
      }
    />
  );
}
