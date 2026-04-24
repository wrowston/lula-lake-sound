"use client";

import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";
import { PreviewBanner } from "@/components/preview-banner";

function PreviewContent() {
  const pricingFlags = useQuery(
    api.pricingPreviewDraft.getPreviewPricingFlags,
  );
  const gearPreview = useQuery(api.gearPreviewDraft.getPreviewGear);
  const photoPreview = useQuery(api.photosPreviewDraft.getPreviewGalleryPhotos);
  // INF-46: surface the draft About visibility in the homepage nav so owners
  // can confirm the feature-flag toggle before publishing. Preview query is
  // owner-only and returns `null` for non-owners.
  const aboutPreview = useQuery(api.aboutPreviewDraft.getPreviewAbout);
  const marketingPreview = useQuery(api.cms.getPreviewMarketingFeatureFlags);

  if (
    pricingFlags === undefined ||
    gearPreview === undefined ||
    photoPreview === undefined ||
    aboutPreview === undefined ||
    marketingPreview === undefined
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
    aboutPreview === null ||
    marketingPreview === null
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
    aboutPreview.hasDraftChanges ||
    marketingPreview.hasDraftChanges;

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
      }}
      gear={{ categories: gearPreview.categories }}
      photos={photoPreview.photos}
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
