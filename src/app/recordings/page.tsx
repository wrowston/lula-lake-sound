import type { Metadata } from "next";
import { RecordingsClient } from "./recordings-client";
import { RECORDINGS } from "./recordings-data";

/**
 * Public `/recordings` route (INF-48).
 *
 * Ships the client-approved Variant A "Cinematic Editorial" recordings list
 * with the four primary columns (title, artist, genre, year) and in-playback
 * duration UX required at launch. Data is a static fixture for now — when
 * INF-49 (CMS) and INF-50 (media uploads) land, swap the import in this file
 * for a Convex `preloadQuery` and pass the resolved list into the client.
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
