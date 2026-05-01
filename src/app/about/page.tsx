import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { api } from "../../../convex/_generated/api";
import { AboutClient } from "./about-client";
import { PublicConvexProvider } from "@/components/public-convex-provider";

/** One preload per request for metadata + page (same render pass). */
const preloadPublishedAbout = cache(() =>
  preloadQuery(api.public.getPublishedAbout),
);

const preloadMarketingFeatureFlags = cache(() =>
  preloadQuery(api.public.getPublishedMarketingFeatureFlags),
);

/**
 * Public `/about` route (INF-46).
 *
 * Renders when `marketingFeatureFlags.aboutPage` is on; returns 404 otherwise.
 * Content is sourced from the Convex `about` section.
 *
 * `generateMetadata` and the page share cached preloads per request.
 */

export async function generateMetadata(): Promise<Metadata> {
  const [aboutPreloaded, flagsPreloaded] = await Promise.all([
    preloadPublishedAbout(),
    preloadMarketingFeatureFlags(),
  ]);
  const data = preloadedQueryResult(aboutPreloaded);
  const flags = preloadedQueryResult(flagsPreloaded);
  if (!flags.aboutPage) {
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
  const [aboutPreloaded, flagsPreloaded] = await Promise.all([
    preloadPublishedAbout(),
    preloadMarketingFeatureFlags(),
  ]);

  const flags = preloadedQueryResult(flagsPreloaded);
  if (!flags.aboutPage) {
    notFound();
  }

  return (
    <PublicConvexProvider>
      <AboutClient
        aboutPreloaded={aboutPreloaded}
        marketingPreloaded={flagsPreloaded}
      />
    </PublicConvexProvider>
  );
}
