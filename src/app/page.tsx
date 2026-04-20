import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { HomeClient } from "./home-client";
import { HomepageShell } from "@/components/homepage-shell";

export default async function Home() {
  try {
    const [pricingSettled, gearSettled] = await Promise.allSettled([
      preloadQuery(api.public.getPublishedPricingFlags),
      preloadQuery(api.public.getPublishedGear),
    ]);
    const preloadedPricing =
      pricingSettled.status === "fulfilled" ? pricingSettled.value : null;
    const preloadedGear =
      gearSettled.status === "fulfilled" ? gearSettled.value : null;
    if (preloadedPricing === null && preloadedGear === null) {
      return <HomepageShell pricingFlags={null} gear={null} />;
    }
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
