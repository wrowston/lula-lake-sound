"use client";

import { useMemo } from "react";
import type { Preloaded } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { RecordingsClient } from "./recordings-client";
import {
  mapPublishedAudioToRecordings,
  type Recording,
} from "./recordings-data";
import { type MarketingFeatureFlags } from "@/lib/site-settings";
import { useSafePreloadedQuery } from "@/lib/use-public-convex-query";

type PreloadedAudio = Preloaded<typeof api.public.getPublishedAudioTracks>;

/**
 * Resolves preloaded published audio and passes table rows to {@link RecordingsClient}.
 * Subscribes to Convex so storage URLs stay fresh.
 */
export function RecordingsPageClient({
  preloadedAudio,
  marketing,
}: {
  readonly preloadedAudio: PreloadedAudio;
  readonly marketing: MarketingFeatureFlags;
}) {
  const raw = useSafePreloadedQuery(preloadedAudio, {
    section: "recordings_audio",
  });
  const recordings = useMemo((): Recording[] => {
    if (raw === null || raw === undefined) return [];
    return mapPublishedAudioToRecordings(raw);
  }, [raw]);

  return (
    <RecordingsClient
      recordings={recordings}
      marketing={marketing}
      convexUnavailable={raw === null}
    />
  );
}
