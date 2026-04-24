import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { api } from "../../../convex/_generated/api";
import { RecordingsClient } from "./recordings-client";
import { RECORDINGS } from "./recordings-data";

/** One preload per request for metadata + page (same render pass). */
const preloadMarketingForRecordings = cache(() =>
  preloadQuery(api.public.getPublishedMarketingFeatureFlags),
);

/**
 * Public `/recordings` route (INF-48).
 *
 * Renders when `marketingFeatureFlags.recordingsPage` is on; 404 otherwise.
 */

export async function generateMetadata(): Promise<Metadata> {
  const preloaded = await preloadMarketingForRecordings();
  const data = preloadedQueryResult(preloaded);
  if (!data.recordingsPage) {
    return { title: "Recordings" };
  }
  return {
    title: "Recordings — Lula Lake Sound",
    description:
      "Selected projects tracked, mixed, and mastered at Lula Lake Sound on Lookout Mountain.",
    alternates: { canonical: "/recordings" },
    openGraph: {
      title: "Recordings — Lula Lake Sound",
      description:
        "Selected projects tracked, mixed, and mastered at Lula Lake Sound on Lookout Mountain.",
      type: "website",
      url: "/recordings",
      siteName: "Lula Lake Sound",
    },
  };
}

export default async function RecordingsPage() {
  const preloaded = await preloadMarketingForRecordings();
  const data = preloadedQueryResult(preloaded);
  if (!data.recordingsPage) {
    notFound();
  }

  return (
    <RecordingsClient recordings={RECORDINGS} marketing={data} />
  );
}
