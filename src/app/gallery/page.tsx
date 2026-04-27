import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { cache } from "react";
import { api } from "../../../convex/_generated/api";
import { GalleryPageClient } from "./gallery-page-client";

/**
 * Public `/gallery` route (INF-47).
 *
 * Variant A "Cinematic Editorial" masonry grid + lightbox combined with the
 * Variant C header pattern (eyebrow + title + category filter pills). The
 * gallery is sourced from the same `galleryPhotos` table the homepage
 * carousel uses; categories live on each photo as lower-case slugs and are
 * authored from `/admin/photos`.
 *
 * The page is always reachable — there is no `cmsSections.gallery`
 * visibility flag — but the empty-state copy renders gracefully when
 * nothing has been published yet.
 */

const preloadPublishedGallery = cache(() =>
  preloadQuery(api.public.getPublishedGalleryPhotos),
);

const preloadMarketingForGallery = cache(() =>
  preloadQuery(api.public.getPublishedMarketingFeatureFlags),
);

export const metadata: Metadata = {
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

export default async function GalleryPage() {
  const [photosPreloaded, marketingPreloaded] = await Promise.all([
    preloadPublishedGallery(),
    preloadMarketingForGallery(),
  ]);
  return (
    <GalleryPageClient
      photosPreloaded={photosPreloaded}
      marketingPreloaded={marketingPreloaded}
    />
  );
}
