import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { api } from "../../../convex/_generated/api";
import { GalleryPageClient } from "./gallery-page-client";
import { isGalleryPageEnabled } from "@/lib/site-settings";

/**
 * Public `/gallery` route (INF-47). When `cmsSections.photos.isEnabled` is
 * off (published), this route returns 404 — same pattern as `/recordings`.
 */

const preloadPublishedGallery = cache(() =>
  preloadQuery(api.public.getPublishedGalleryPhotos),
);

const preloadPublishedVideosForGallery = cache(() =>
  preloadQuery(api.public.getPublishedVideos),
);

const preloadMarketingForGallery = cache(() =>
  preloadQuery(api.public.getPublishedMarketingFeatureFlags),
);

export async function generateMetadata(): Promise<Metadata> {
  const preloaded = await preloadMarketingForGallery();
  const data = preloadedQueryResult(preloaded);
  if (!isGalleryPageEnabled(data)) {
    return { title: "Gallery" };
  }
  return {
    title: "Gallery — Lula Lake Sound",
    description:
      "Tour the rooms, gear, and grounds of Lula Lake Sound on Lookout Mountain — a curated photo gallery of the recording studio.",
    alternates: { canonical: "/gallery" },
    openGraph: {
      title: "Gallery — Lula Lake Sound",
      description:
        "Tour the rooms, gear, and grounds of Lula Lake Sound on Lookout Mountain — a curated photo gallery of the recording studio.",
      type: "website",
      url: "/gallery",
      siteName: "Lula Lake Sound",
    },
  };
}

export default async function GalleryPage() {
  const [photosPreloaded, videosPreloaded, marketingPreloaded] =
    await Promise.all([
      preloadPublishedGallery(),
      preloadPublishedVideosForGallery(),
      preloadMarketingForGallery(),
    ]);
  const marketing = preloadedQueryResult(marketingPreloaded);
  if (!isGalleryPageEnabled(marketing)) {
    notFound();
  }
  return (
    <GalleryPageClient
      photosPreloaded={photosPreloaded}
      videosPreloaded={videosPreloaded}
      marketingPreloaded={marketingPreloaded}
    />
  );
}
