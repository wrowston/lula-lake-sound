import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { HomeClient } from "./home-client";
import { HomepageShell } from "@/components/homepage-shell";

export default async function Home() {
  try {
    const [
      pricingSettled,
      gearSettled,
      photosSettled,
      faqSettled,
      marketingSettled,
      amenitiesSettled,
    ] = await Promise.allSettled([
      preloadQuery(api.public.getPublishedPricingFlags),
      preloadQuery(api.public.getPublishedGear),
      preloadQuery(api.public.getPublishedCarouselPhotos),
      preloadQuery(api.public.getPublishedFaq),
      preloadQuery(api.public.getPublishedMarketingFeatureFlags),
      preloadQuery(api.public.getPublishedAmenitiesNearby),
    ]);
    const preloadedPricing =
      pricingSettled.status === "fulfilled" ? pricingSettled.value : null;
    const preloadedGear =
      gearSettled.status === "fulfilled" ? gearSettled.value : null;
    const preloadedPhotos =
      photosSettled.status === "fulfilled" ? photosSettled.value : null;
    const preloadedFaq =
      faqSettled.status === "fulfilled" ? faqSettled.value : null;
    const preloadedMarketing =
      marketingSettled.status === "fulfilled" ? marketingSettled.value : null;
    const preloadedAmenities =
      amenitiesSettled.status === "fulfilled" ? amenitiesSettled.value : null;
    if (
      preloadedPricing === null &&
      preloadedGear === null &&
      preloadedPhotos === null &&
      preloadedFaq === null &&
      preloadedMarketing === null &&
      preloadedAmenities === null
    ) {
      return (
        <HomepageShell
          pricingFlags={null}
          marketingFeatureFlags={null}
          gear={null}
          photos={null}
          faqCategories={null}
          amenities={null}
        />
      );
    }
    return (
      <HomeClient
        preloadedPricing={preloadedPricing}
        preloadedGear={preloadedGear}
        preloadedPhotos={preloadedPhotos}
        preloadedFaq={preloadedFaq}
        preloadedMarketing={preloadedMarketing}
        preloadedAmenities={preloadedAmenities}
      />
    );
  } catch {
    return (
      <HomepageShell
        pricingFlags={null}
        marketingFeatureFlags={null}
        gear={null}
        photos={null}
        faqCategories={null}
        amenities={null}
      />
    );
  }
}
