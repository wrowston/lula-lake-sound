"use client";

import { useMemo, useRef } from "react";
import * as Sentry from "@sentry/nextjs";
import {
  useQueries,
  type Preloaded,
  type RequestForQueries,
} from "convex/react";
import type { Value } from "convex/values";
import { jsonToConvex } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import { usePathname } from "next/navigation";

import { api } from "../../convex/_generated/api";
import {
  PUBLIC_CONVEX_QUERY_FAILED,
  type PublicConvexQueryResult,
} from "@/lib/use-public-convex-query";
import { computePreviewTag } from "@/lib/sentry";

export type HomePublishedPreloads = {
  readonly pricing:
    | Preloaded<typeof api.public.getPublishedPricingFlags>
    | null;
  readonly gear: Preloaded<typeof api.public.getPublishedGear> | null;
  readonly photos:
    | Preloaded<typeof api.public.getPublishedCarouselPhotos>
    | null;
  readonly faq: Preloaded<typeof api.public.getPublishedFaq> | null;
  readonly marketing:
    | Preloaded<typeof api.public.getPublishedMarketingFeatureFlags>
    | null;
  readonly amenities:
    | Preloaded<typeof api.public.getPublishedAmenitiesNearby>
    | null;
};

export type HomePublishedSnapshot = {
  readonly pricingFlags: PublicConvexQueryResult<
    FunctionReturnType<typeof api.public.getPublishedPricingFlags>
  >;
  readonly gear: PublicConvexQueryResult<
    FunctionReturnType<typeof api.public.getPublishedGear>
  >;
  readonly photos: PublicConvexQueryResult<
    FunctionReturnType<typeof api.public.getPublishedCarouselPhotos>
  >;
  readonly faq: PublicConvexQueryResult<
    FunctionReturnType<typeof api.public.getPublishedFaq>
  >;
  readonly marketing: PublicConvexQueryResult<
    FunctionReturnType<typeof api.public.getPublishedMarketingFeatureFlags>
  >;
  readonly amenities: PublicConvexQueryResult<
    FunctionReturnType<typeof api.public.getPublishedAmenitiesNearby>
  >;
};

/**
 * Single Convex subscription for all homepage published reads (SSR preload +
 * live updates). Avoids stacking many useQueries observers — Convex's internal
 * subscription helper can synchronously setState during render when identities
 * churn, tripping React's "Too many re-renders" guard.
 */
export function useHomePublishedQueries(
  preloaded: HomePublishedPreloads,
): HomePublishedSnapshot {
  const pathname = usePathname();
  const lastLoggedBySection = useRef<Partial<Record<string, string>>>({});

  const queries = useMemo(
    (): RequestForQueries => ({
      pricingFlags: {
        query: api.public.getPublishedPricingFlags,
        args: {} as Record<string, Value>,
      },
      gear: {
        query: api.public.getPublishedGear,
        args: {} as Record<string, Value>,
      },
      photos: {
        query: api.public.getPublishedCarouselPhotos,
        args: {} as Record<string, Value>,
      },
      faq: {
        query: api.public.getPublishedFaq,
        args: {} as Record<string, Value>,
      },
      marketing: {
        query: api.public.getPublishedMarketingFeatureFlags,
        args: {} as Record<string, Value>,
      },
      amenities: {
        query: api.public.getPublishedAmenitiesNearby,
        args: {} as Record<string, Value>,
      },
    }),
    [],
  );

  const results = useQueries(queries);

  const pricingSnap = useMemo(
    () =>
      preloaded.pricing
        ? (jsonToConvex(preloaded.pricing._valueJSON) as FunctionReturnType<
            typeof api.public.getPublishedPricingFlags
          >)
        : undefined,
    [preloaded.pricing],
  );
  const gearSnap = useMemo(
    () =>
      preloaded.gear
        ? (jsonToConvex(preloaded.gear._valueJSON) as FunctionReturnType<
            typeof api.public.getPublishedGear
          >)
        : undefined,
    [preloaded.gear],
  );
  const photosSnap = useMemo(
    () =>
      preloaded.photos
        ? (jsonToConvex(preloaded.photos._valueJSON) as FunctionReturnType<
            typeof api.public.getPublishedCarouselPhotos
          >)
        : undefined,
    [preloaded.photos],
  );
  const faqSnap = useMemo(
    () =>
      preloaded.faq
        ? (jsonToConvex(preloaded.faq._valueJSON) as FunctionReturnType<
            typeof api.public.getPublishedFaq
          >)
        : undefined,
    [preloaded.faq],
  );
  const marketingSnap = useMemo(
    () =>
      preloaded.marketing
        ? (jsonToConvex(preloaded.marketing._valueJSON) as FunctionReturnType<
            typeof api.public.getPublishedMarketingFeatureFlags
          >)
        : undefined,
    [preloaded.marketing],
  );
  const amenitiesSnap = useMemo(
    () =>
      preloaded.amenities
        ? (jsonToConvex(preloaded.amenities._valueJSON) as FunctionReturnType<
            typeof api.public.getPublishedAmenitiesNearby
          >)
        : undefined,
    [preloaded.amenities],
  );

  function mergeOne<T>(
    section: string,
    raw: unknown,
    snapshot: T | undefined,
  ): PublicConvexQueryResult<T> {
    if (raw instanceof Error) {
      const fingerprint = `${section}:${raw.message}`;
      if (lastLoggedBySection.current[section] !== fingerprint) {
        lastLoggedBySection.current[section] = fingerprint;
        const err = raw;
        const previewTag = computePreviewTag(pathname);
        queueMicrotask(() => {
          Sentry.captureException(err, {
            tags: { section, preview: previewTag },
          });
        });
      }
      return PUBLIC_CONVEX_QUERY_FAILED;
    }
    if (raw !== undefined) {
      delete lastLoggedBySection.current[section];
      return raw as T;
    }
    return snapshot as T | undefined;
  }

  return {
    pricingFlags: mergeOne(
      "home_pricing",
      results.pricingFlags,
      pricingSnap,
    ),
    gear: mergeOne("home_gear", results.gear, gearSnap),
    photos: mergeOne("home_photos", results.photos, photosSnap),
    faq: mergeOne("home_faq", results.faq, faqSnap),
    marketing: mergeOne(
      "home_marketing_flags",
      results.marketing,
      marketingSnap,
    ),
    amenities: mergeOne(
      "home_amenities",
      results.amenities,
      amenitiesSnap,
    ),
  };
}
