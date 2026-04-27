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
      audioSettled,
      faqSettled,
      marketingSettled,
    ] = await Promise.allSettled([
      preloadQuery(api.public.getPublishedPricingFlags),
      preloadQuery(api.public.getPublishedGear),
      preloadQuery(api.public.getPublishedGalleryPhotos),
      preloadQuery(api.public.getPublishedAudioTracks),
      preloadQuery(api.public.getPublishedFaq),
      preloadQuery(api.public.getPublishedMarketingFeatureFlags),
    ]);
    const preloadedPricing =
      pricingSettled.status === "fulfilled" ? pricingSettled.value : null;
    const preloadedGear =
      gearSettled.status === "fulfilled" ? gearSettled.value : null;
    const preloadedPhotos =
      photosSettled.status === "fulfilled" ? photosSettled.value : null;
    const preloadedAudio =
      audioSettled.status === "fulfilled" ? audioSettled.value : null;
    const preloadedFaq =
      faqSettled.status === "fulfilled" ? faqSettled.value : null;
    const preloadedMarketing =
      marketingSettled.status === "fulfilled" ? marketingSettled.value : null;
    if (
      preloadedPricing === null &&
      preloadedGear === null &&
      preloadedPhotos === null &&
      preloadedAudio === null &&
      preloadedFaq === null &&
      preloadedMarketing === null
    ) {
      return (
        <HomepageShell
          pricingFlags={null}
          marketingFeatureFlags={null}
          gear={null}
          photos={null}
          audioTracks={null}
          faqCategories={null}
        />
      );
    }
    return (
      <HomeClient
        preloadedPricing={preloadedPricing}
        preloadedGear={preloadedGear}
        preloadedPhotos={preloadedPhotos}
        preloadedAudio={preloadedAudio}
        preloadedFaq={preloadedFaq}
        preloadedMarketing={preloadedMarketing}
      />
    );
  } catch {
    return (
      <HomepageShell
        pricingFlags={null}
        marketingFeatureFlags={null}
        gear={null}
        photos={null}
        audioTracks={null}
        faqCategories={null}
      />
    );
  }
}
