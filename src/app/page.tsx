import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { HomeClient } from "./home-client";

export default async function Home() {
  const preloadedPricing = await preloadQuery(api.public.getPublishedPricingFlags);
  return <HomeClient preloadedPricing={preloadedPricing} />;
}
