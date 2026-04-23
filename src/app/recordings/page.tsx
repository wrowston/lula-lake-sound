import type { Metadata } from "next";
import { RecordingsClient } from "./recordings-client";
import { RECORDINGS } from "./recordings-data";

/**
 * Public `/recordings` route (INF-48).
 *
 * Ships the client-approved Variant A "Cinematic Editorial" recordings list
 * with columns for track/artist, genre, year, optional cover art & streaming
 * links, and in-playback duration (progress bar) when a row is playing — no
 * idle duration column. List is populated in `recordings-data` (or replace with
 * a Convex `preloadQuery` when CMS/media are wired).
 */

export const metadata: Metadata = {
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

export default function RecordingsPage() {
  return <RecordingsClient recordings={RECORDINGS} />;
}
