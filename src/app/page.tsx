import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { HomeClient } from "./home-client";

export default async function Home() {
  const [pricingSettled, gearSettled] = await Promise.allSettled([
    preloadQuery(api.public.getPublishedPricingFlags),
    preloadQuery(api.public.getPublishedGear),
  ]);

  return (
    <HomeClient
      preloadedPricing={
        pricingSettled.status === "fulfilled" ? pricingSettled.value : null
      }
      preloadedGear={
        gearSettled.status === "fulfilled" ? gearSettled.value : null
      }
    />
  );
}
