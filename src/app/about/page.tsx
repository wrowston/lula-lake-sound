import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { api } from "../../../convex/_generated/api";
import { AboutClient } from "./about-client";

/** One preload per request for metadata + page (same render pass). */
const preloadPublishedAbout = cache(() =>
  preloadQuery(api.public.getPublishedAbout),
);

/**
 * Public `/about` route (INF-46).
 *
 * Renders the redesigned Variant A "Cinematic Editorial" About page when the
 * CMS-controlled `published` flag is on; returns a 404 when it is off so the
 * page stays hidden behind the feature flag as required by the client
 * acceptance criteria. Content (hero copy, body HTML, pull quote, team
 * headshots) is sourced from the Convex `about` section.
 *
 * `generateMetadata` and the page share one cached preload of
 * `public.getPublishedAbout` per request. Preload failures are not caught so
 * Convex/network errors surface as request failures instead of being
 * misreported as a 404 via `notFound()`.
 */

export async function generateMetadata(): Promise<Metadata> {
  const preloaded = await preloadPublishedAbout();
  const data = preloadedQueryResult(preloaded);
  if (!data.published) {
    return { title: "About" };
  }
  const title =
    data.seoTitle && data.seoTitle.trim().length > 0
      ? data.seoTitle
      : `${data.heroTitle} — Lula Lake Sound`;
  const description =
    data.seoDescription && data.seoDescription.trim().length > 0
      ? data.seoDescription
      : (data.heroSubtitle ??
        "Learn about Lula Lake Sound — a creative recording and production studio on Lookout Mountain.");
  return {
    title,
    description,
    alternates: { canonical: "/about" },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/about",
      siteName: "Lula Lake Sound",
    },
  };
}

export default async function AboutPage() {
  const [aboutPreloaded, pricingPreloaded] = await Promise.all([
    preloadPublishedAbout(),
    preloadQuery(api.public.getPublishedPricingFlags),
  ]);

  const data = preloadedQueryResult(aboutPreloaded);
  if (!data.published) {
    notFound();
  }

  return (
    <AboutClient
      aboutPreloaded={aboutPreloaded}
      pricingPreloaded={pricingPreloaded}
    />
  );
}
