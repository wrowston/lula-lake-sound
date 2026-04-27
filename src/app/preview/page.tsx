"use client";

import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";
import type { PublishedAmenitiesNearby } from "@/components/amenities-nearby";
import { PreviewBanner } from "@/components/preview-banner";

function PreviewContent() {
  const pricingFlags = useQuery(
    api.pricingPreviewDraft.getPreviewPricingFlags,
  );
  const gearPreview = useQuery(api.gearPreviewDraft.getPreviewGear);
  const photoPreview = useQuery(api.photosPreviewDraft.getPreviewGalleryPhotos);
  const audioPreview = useQuery(api.audioPreviewDraft.getPreviewAudioTracks);
  // Tracks whether the About section has unpublished draft content so the
  // preview banner can reflect it. Owner-only — returns `null` for non-owners.
  const aboutPreview = useQuery(api.aboutPreviewDraft.getPreviewAbout);
  const faqPreview = useQuery(api.faqPreviewDraft.getPreviewFaq);
  const marketingPreview = useQuery(api.cms.getPreviewMarketingFeatureFlags);
  const amenitiesPreview = useQuery(
    api.amenitiesPreviewDraft.getPreviewAmenitiesNearby,
  );

  if (
    pricingFlags === undefined ||
    gearPreview === undefined ||
    photoPreview === undefined ||
    audioPreview === undefined ||
    aboutPreview === undefined ||
    faqPreview === undefined ||
    marketingPreview === undefined ||
    amenitiesPreview === undefined
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-washed-black">
        <p className="text-ivory/60">Loading preview…</p>
      </div>
    );
  }

  if (
    pricingFlags === null ||
    gearPreview === null ||
    photoPreview === null ||
    audioPreview === null ||
    aboutPreview === null ||
    faqPreview === null ||
    marketingPreview === null ||
    amenitiesPreview === null
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-washed-black">
        <p className="text-ivory/60">
          Preview is not available. You may not have permission to view draft content.
        </p>
      </div>
    );
  }

  const hasDraftChanges =
    pricingFlags.hasDraftChanges ||
    gearPreview.hasDraftChanges ||
    photoPreview.hasDraftChanges ||
    audioPreview.hasDraftChanges ||
    aboutPreview.hasDraftChanges ||
    faqPreview.hasDraftChanges ||
    marketingPreview.hasDraftChanges ||
    amenitiesPreview.hasDraftChanges;

  const amenitiesPayload: PublishedAmenitiesNearby = {
    isEnabled: amenitiesPreview.isEnabled,
    eyebrow: amenitiesPreview.eyebrow,
    heading: amenitiesPreview.heading,
    intro: amenitiesPreview.intro,
    rows: amenitiesPreview.rows,
  };

  return (
    <HomepageShell
      pricingFlags={{
        flags: pricingFlags.flags,
        packages: pricingFlags.packages,
      }}
      marketingFeatureFlags={{
        aboutPage: marketingPreview.aboutPage,
        recordingsPage: marketingPreview.recordingsPage,
        pricingSection: marketingPreview.pricingSection,
        galleryPage: marketingPreview.galleryPage,
      }}
      gear={{ categories: gearPreview.categories }}
      photos={photoPreview.photos}
      faqCategories={faqPreview.categories}
      amenities={amenitiesPayload}
      banner={<PreviewBanner hasDraftChanges={hasDraftChanges} />}
    />
  );
}

export default function PreviewPage() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center bg-washed-black">
          <p className="text-ivory/60">Authenticating…</p>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center bg-washed-black">
          <p className="text-ivory/60">Sign in required to preview draft content.</p>
        </div>
      </Unauthenticated>

      <Authenticated>
        <PreviewContent />
      </Authenticated>
    </>
  );
}
