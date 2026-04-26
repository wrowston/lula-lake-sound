"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AmenityCard } from "./ui/amenity-card";

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
  /** When provided (e.g. preview), skips the public Convex subscription. */
  readonly amenities?: PublishedAmenitiesNearby | null | undefined;
};

export function AmenitiesNearby({ amenities: amenitiesFromProps }: AmenitiesNearbyProps) {
  const live = useQuery(
    api.public.getPublishedAmenitiesNearby,
    amenitiesFromProps !== undefined ? "skip" : {},
  );
  const data =
    amenitiesFromProps !== undefined ? amenitiesFromProps : live;

  if (data === undefined) {
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

  if (data === null) {
    return null;
  }

  if (!data.isEnabled || data.rows.length === 0) {
    return null;
  }

  const eyebrow = data.eyebrow?.trim() || STATIC_EYEBROW;
  const heading = data.heading?.trim() || STATIC_HEADING;
  const intro = data.intro?.trim();

  return (
    <section
      id="local-favorites"
      className="relative overflow-hidden bg-forest px-6 py-28 md:py-40"
    >
      <div className="absolute inset-0 bg-texture-canvas opacity-14" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="reveal mb-20 text-center">
          <p className="eyebrow mb-6 text-sand/82">{eyebrow}</p>
          <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
            {heading}
          </h2>
          {intro ? (
            <p className="body-text-small mx-auto mb-8 max-w-2xl text-ivory/78">
              {intro}
            </p>
          ) : null}
          <div className="section-rule mx-auto max-w-[9rem]" />
        </div>

        <div className="reveal reveal-delay-2 grid grid-cols-1 divide-y divide-sand/14 border-y border-sand/14 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-sand/14 lg:[&>*:nth-child(n+3)]:border-t-0">
          {data.rows.map((amenity) => (
            <AmenityCard
              key={amenity.stableId}
              name={amenity.name}
              type={amenity.type}
              description={amenity.description}
              website={amenity.website}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
