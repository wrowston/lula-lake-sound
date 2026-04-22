import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { AboutClient } from "./about-client";

/**
 * Public `/about` route (INF-46).
 *
 * Renders the redesigned Variant A "Cinematic Editorial" About page when the
 * CMS-controlled `published` flag is on; returns a 404 when it is off so the
 * page stays hidden behind the feature flag as required by the client
 * acceptance criteria. Content (hero copy, body HTML, pull quote, team
 * headshots) is sourced from the Convex `about` section.
 *
 * Metadata and the visibility check share the single preload below so we
 * never double-hit the `public.getPublishedAbout` query for a single request.
 */

async function safePreloadAbout() {
  try {
    return await preloadQuery(api.public.getPublishedAbout);
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const preloaded = await safePreloadAbout();
  if (!preloaded) {
    return { title: "About" };
  }
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
    safePreloadAbout(),
    preloadQuery(api.public.getPublishedPricingFlags),
  ]);

  if (!aboutPreloaded) {
    notFound();
  }

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
