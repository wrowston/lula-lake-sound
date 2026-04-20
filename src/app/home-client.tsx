"use client";

import { usePreloadedQuery, useQuery, type Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";
import type { GalleryPhoto } from "@/components/the-space";

type PreloadedPricing = Preloaded<typeof api.public.getPublishedPricingFlags> | null;
type PreloadedGear = Preloaded<typeof api.public.getPublishedGear> | null;
type PreloadedPhotos = Preloaded<typeof api.public.getPublishedGalleryPhotos> | null;

function PhotosData({
  preloaded,
  children,
}: {
  preloaded: PreloadedPhotos;
  children: (photos: GalleryPhoto[] | undefined) => React.ReactNode;
}) {
  if (preloaded) {
    return <PhotosFromPreload preloaded={preloaded}>{children}</PhotosFromPreload>;
  }
  return <PhotosLive>{children}</PhotosLive>;
}

function PhotosFromPreload({
  preloaded,
  children,
}: {
  preloaded: NonNullable<PreloadedPhotos>;
  children: (photos: GalleryPhoto[] | undefined) => React.ReactNode;
}) {
  const photos = usePreloadedQuery(preloaded);
  return <>{children(photos)}</>;
}

function PhotosLive({
  children,
}: {
  children: (photos: GalleryPhoto[] | undefined) => React.ReactNode;
}) {
  const photos = useQuery(api.public.getPublishedGalleryPhotos);
  return <>{children(photos)}</>;
}

function BothPreloaded({
  preloadedPricing,
  preloadedGear,
  photos,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  preloadedGear: NonNullable<PreloadedGear>;
  photos: GalleryPhoto[] | undefined;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = usePreloadedQuery(preloadedGear);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} photos={photos} />;
}

function PricingPreloadedGearLive({
  preloadedPricing,
  photos,
}: {
  preloadedPricing: NonNullable<PreloadedPricing>;
  photos: GalleryPhoto[] | undefined;
}) {
  const pricingFlags = usePreloadedQuery(preloadedPricing);
  const gear = useQuery(api.public.getPublishedGear);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} photos={photos} />;
}

function PricingLiveGearPreloaded({
  preloadedGear,
  photos,
}: {
  preloadedGear: NonNullable<PreloadedGear>;
  photos: GalleryPhoto[] | undefined;
}) {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  const gear = usePreloadedQuery(preloadedGear);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} photos={photos} />;
}

function BothLive({ photos }: { photos: GalleryPhoto[] | undefined }) {
  const pricingFlags = useQuery(api.public.getPublishedPricingFlags);
  const gear = useQuery(api.public.getPublishedGear);
  return <HomepageShell pricingFlags={pricingFlags} gear={gear} photos={photos} />;
}

export function HomeClient({
  preloadedPricing,
  preloadedGear,
  preloadedPhotos,
}: {
  preloadedPricing: PreloadedPricing;
  preloadedGear: PreloadedGear;
  preloadedPhotos: PreloadedPhotos;
}) {
  return (
    <PhotosData preloaded={preloadedPhotos}>
      {(photos) => {
        if (preloadedPricing && preloadedGear) {
          return (
            <BothPreloaded
              preloadedPricing={preloadedPricing}
              preloadedGear={preloadedGear}
              photos={photos}
            />
          );
        }
        if (preloadedPricing) {
          return (
            <PricingPreloadedGearLive preloadedPricing={preloadedPricing} photos={photos} />
          );
        }
        if (preloadedGear) {
          return <PricingLiveGearPreloaded preloadedGear={preloadedGear} photos={photos} />;
        }
        return <BothLive photos={photos} />;
      }}
    </PhotosData>
  );
}
