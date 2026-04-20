import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { HomeClient } from "./home-client";
import { HomepageShell } from "@/components/homepage-shell";

export default async function Home() {
  try {
    const [preloadedPricing, preloadedGear] = await Promise.all([
      preloadQuery(api.public.getPublishedPricingFlags),
      preloadQuery(api.public.getPublishedGear),
    ]);
    return (
      <HomeClient
        preloadedPricing={preloadedPricing}
        preloadedGear={preloadedGear}
      />
    );
  } catch {
    return <HomepageShell pricingFlags={null} gear={null} />;
  }
}
