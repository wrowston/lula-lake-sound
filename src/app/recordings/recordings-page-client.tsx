"use client";

import { useMemo } from "react";
import { usePreloadedQuery, type Preloaded } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { RecordingsClient } from "./recordings-client";
import {
  mapPublishedAudioToRecordings,
  type Recording,
} from "./recordings-data";
import { type MarketingFeatureFlags } from "@/lib/site-settings";

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
  const raw = usePreloadedQuery(preloadedAudio);
  const recordings = useMemo(
    (): Recording[] => mapPublishedAudioToRecordings(raw),
    [raw],
  );

  return <RecordingsClient recordings={recordings} marketing={marketing} />;
}
