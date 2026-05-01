import ReactDOM from "react-dom";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { HomeClient } from "./home-client";
import { HomepageShell } from "@/components/homepage-shell";
import { PublicConvexProvider } from "@/components/public-convex-provider";

// Preload the assets used in the hero section so the browser can start
// downloading them before React even begins rendering the tree. Both files
// already live in `/public` and are referenced verbatim by `Hero` (see
// `unoptimized` on the `<Image>`s) so the preloaded bytes are actually
// reused rather than discarded for a different `/_next/image?...` URL.
const HERO_BACKGROUND_SRC =
  "/Textured Backgrounds/LLS_Texture_Emerald.optimized.jpg";
const HERO_LOGO_SRC = "/Logos/Primary/LLS_Logo_Full_Ivory.png";

export default async function Home() {
  ReactDOM.preload(HERO_BACKGROUND_SRC, {
    as: "image",
    fetchPriority: "high",
  });
  ReactDOM.preload(HERO_LOGO_SRC, {
    as: "image",
    fetchPriority: "high",
  });
  try {
    const preloadedMarketing = await preloadQuery(
      api.public.getPublishedMarketingFeatureFlags,
    );

    return (
      <PublicConvexProvider>
        <HomeClient
          preloadedPricing={null}
          preloadedGear={null}
          preloadedPhotos={null}
          preloadedFaq={null}
          preloadedMarketing={preloadedMarketing}
          preloadedAmenities={null}
        />
      </PublicConvexProvider>
    );
  } catch {
    return (
      <PublicConvexProvider>
        <HomepageShell
          pricingFlags={null}
          marketingFeatureFlags={null}
          gear={null}
          photos={null}
          faqCategories={null}
          amenities={null}
        />
      </PublicConvexProvider>
    );
  }
}
