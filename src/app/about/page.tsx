import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { api } from "../../../convex/_generated/api";
import { AboutClient } from "./about-client";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Lula Lake Sound — a creative recording and production studio.",
};

export default async function AboutPage() {
  const [aboutPreloaded, pricingPreloaded] = await Promise.all([
    preloadQuery(api.public.getPublishedAbout),
    preloadQuery(api.public.getPublishedPricingFlags),
  ]);
  return (
    <AboutClient
      aboutPreloaded={aboutPreloaded}
      pricingPreloaded={pricingPreloaded}
    />
  );
}
