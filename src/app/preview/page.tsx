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

  if (
    pricingFlags === undefined ||
    gearPreview === undefined ||
    photoPreview === undefined
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
    photoPreview === null
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
    photoPreview.hasDraftChanges;

  return (
    <HomepageShell
      pricingFlags={{
        flags: pricingFlags.flags,
        packages: pricingFlags.packages,
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
