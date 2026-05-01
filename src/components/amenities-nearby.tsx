"use client";

import { AmenityCard } from "./ui/amenity-card";
import { PublicSectionNotice } from "@/components/public-section-notice";
import { revealDelay } from "@/lib/reveal-delay";
import { PUBLIC_CONVEX_QUERY_FAILED } from "@/lib/use-public-convex-query";

const STATIC_EYEBROW = "Local Favorites";
const STATIC_HEADING = "Amenities Nearby";

export type PublishedAmenitiesNearby = {
  readonly isEnabled: boolean;
  readonly eyebrow: string | null;
  readonly heading: string | null;
  readonly intro: string | null;
  readonly rows: ReadonlyArray<{
    readonly stableId: string;
    readonly name: string;
    readonly type: string;
    readonly description: string;
    readonly website: string;
  }>;
};

type AmenitiesNearbyProps = {
  /** Published (or owner preview) amenities payload from Convex. */
  readonly amenities?:
    | PublishedAmenitiesNearby
    | null
    | undefined
    | typeof PUBLIC_CONVEX_QUERY_FAILED;
};

export function AmenitiesNearby({ amenities }: AmenitiesNearbyProps) {
  if (amenities === undefined) {
    return (
      <section
        id="local-favorites"
        className="relative overflow-hidden bg-forest px-6 py-28 md:py-40"
      >
        <div className="absolute inset-0 bg-texture-canvas opacity-14" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="h-48 animate-pulse rounded-md bg-warm-white/5" />
        </div>
      </section>
    );
  }

  if (amenities === null) {
    return null;
  }

  if (amenities === PUBLIC_CONVEX_QUERY_FAILED) {
    return (
      <section
        id="local-favorites"
        className="relative overflow-hidden bg-forest px-6 py-28 md:py-40"
      >
        <div className="absolute inset-0 bg-texture-canvas opacity-14" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <PublicSectionNotice title="Unable to load local favorites">
            Nearby dining and lodging picks will appear here when we can reach
            the server again.
          </PublicSectionNotice>
        </div>
      </section>
    );
  }

  if (!amenities.isEnabled || amenities.rows.length === 0) {
    return null;
  }

  const eyebrow = amenities.eyebrow?.trim() || STATIC_EYEBROW;
  const heading = amenities.heading?.trim() || STATIC_HEADING;
  const intro = amenities.intro?.trim();

  return (
    <section
      id="local-favorites"
      className="relative overflow-hidden bg-forest px-6 py-28 md:py-40"
    >
      <div className="parallax-soft absolute inset-0 bg-texture-canvas opacity-14" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-20 text-center">
          <p className="eyebrow reveal mb-6 text-sand/82">{eyebrow}</p>
          <h2 className="headline-primary reveal-axis reveal-delay-1 mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
            {heading}
          </h2>
          {intro ? (
            <p className="body-text-small reveal reveal-delay-2 mx-auto mb-8 max-w-2xl text-ivory/78">
              {intro}
            </p>
          ) : null}
          <div className="section-rule reveal-rule reveal-delay-3 mx-auto max-w-[9rem]" />
        </div>

        <div className="grid grid-cols-1 divide-y divide-sand/14 border-y border-sand/14 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-sand/14 lg:[&>*:nth-child(n+3)]:border-t-0">
          {amenities.rows.map((amenity, index) => (
            <AmenityCard
              key={amenity.stableId}
              name={amenity.name}
              type={amenity.type}
              description={amenity.description}
              website={amenity.website}
              className={revealDelay(index + 1)}
            />
          ))}
        </div>
      </div>
      {/* Cinematic seam into the washed-black FAQ section. */}
      <div aria-hidden className="section-fade-bottom" />
    </section>
  );
}
