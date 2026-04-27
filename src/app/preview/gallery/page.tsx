"use client";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GalleryClient } from "../../gallery/gallery-client";
import { PreviewBanner } from "@/components/preview-banner";

/**
 * Owner-only preview of the public Gallery page using draft photos. Mirrors
 * `/preview/about` — non-owners get a friendly notice; the underlying
 * `getPreviewGalleryPhotos` query returns `null` for unauthenticated /
 * non-owner callers so drafts never leak.
 */
function GalleryPreviewContent() {
  const photoPreview = useQuery(
    api.photosPreviewDraft.getPreviewGalleryPhotos,
  );
  const marketing = useQuery(api.cms.getPreviewMarketingFeatureFlags);

  if (photoPreview === undefined || marketing === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deep-forest">
        <p className="text-ivory/60">Loading preview…</p>
      </div>
    );
  }

  if (photoPreview === null || marketing === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deep-forest">
        <p className="text-ivory/60">
          Preview is not available. You may not have permission to view draft
          content.
        </p>
      </div>
    );
  }

  return (
    <GalleryClient
      photos={photoPreview.photos}
      marketing={{
        aboutPage: marketing.aboutPage,
        recordingsPage: marketing.recordingsPage,
        pricingSection: marketing.pricingSection,
      }}
      banner={<PreviewBanner hasDraftChanges={photoPreview.hasDraftChanges} />}
    />
  );
}

export default function GalleryPreviewPage() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center bg-deep-forest">
          <p className="text-ivory/60">Authenticating…</p>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center bg-deep-forest">
          <p className="text-ivory/60">
            Sign in required to preview draft content.
          </p>
        </div>
      </Unauthenticated>

      <Authenticated>
        <GalleryPreviewContent />
      </Authenticated>
    </>
  );
}
