import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { HomeClient } from "./home-client";
import { HomepageShell } from "@/components/homepage-shell";

export default async function Home() {
  try {
    const preloadedPricing = await preloadQuery(
      api.public.getPublishedPricingFlags,
    );
    return <HomeClient preloadedPricing={preloadedPricing} />;
  } catch {
    return <HomepageShell pricingFlags={null} />;
  }
}
