import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { HomeClient } from "./home-client";
import { HomepageShell } from "@/components/homepage-shell";

export default async function Home() {
  try {
    const [pricingSettled, gearSettled, photosSettled] = await Promise.allSettled([
      preloadQuery(api.public.getPublishedPricingFlags),
      preloadQuery(api.public.getPublishedGear),
      preloadQuery(api.public.getPublishedGalleryPhotos),
    ]);
    const preloadedPricing =
      pricingSettled.status === "fulfilled" ? pricingSettled.value : null;
    const preloadedGear =
      gearSettled.status === "fulfilled" ? gearSettled.value : null;
    const preloadedPhotos =
      photosSettled.status === "fulfilled" ? photosSettled.value : null;
    if (preloadedPricing === null && preloadedGear === null) {
      return <HomepageShell pricingFlags={null} gear={null} photos={null} />;
    }
    return (
      <HomeClient
        preloadedPricing={preloadedPricing}
        preloadedGear={preloadedGear}
        preloadedPhotos={preloadedPhotos}
      />
    );
  } catch {
    return <HomepageShell pricingFlags={null} gear={null} photos={null} />;
  }
}
