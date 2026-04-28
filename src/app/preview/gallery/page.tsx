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

  const publicGalleryDisabled = !marketing.galleryPagePublished;

  return (
    <GalleryClient
      photos={photoPreview.photos}
      marketing={{
        aboutPage: marketing.aboutPage,
        recordingsPage: marketing.recordingsPage,
        pricingSection: marketing.pricingSection,
        galleryPage: marketing.galleryPage,
      }}
      banner={
        <>
          <PreviewBanner hasDraftChanges={photoPreview.hasDraftChanges} />
          {publicGalleryDisabled ? (
            <div
              className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100"
              role="status"
            >
              The public Gallery page and nav link are currently{" "}
              <span className="font-medium">hidden</span> for visitors. Turn
              on &quot;Gallery page visibility&quot; in{" "}
              <span className="font-mono">/admin/photos</span> (Gallery tab) and
              publish to go live.
            </div>
          ) : null}
        </>
      }
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
