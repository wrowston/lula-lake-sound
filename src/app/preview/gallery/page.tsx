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
import type { PublishedVideo } from "@/components/video-showcase";

/**
 * Owner-only preview of the public Gallery page using draft photos. Mirrors
 * `/preview/about` — non-owners get a friendly notice; the underlying
 * `getPreviewGalleryPhotos` query returns `null` for unauthenticated /
 * non-owner callers so drafts never leak.
 *
 * Video preview normally uses `photosPreviewDraft.getPreviewVideos`. If that
 * subscription cannot open (e.g. deployment mismatch), we fall back to
 * `public.getPublishedVideos` so the gallery route still renders.
 */
function GalleryPreviewContent() {
  const photoPreview = useQuery(
    api.photosPreviewDraft.getPreviewGalleryPhotos,
  );
  const previewVideos = useQuery(api.photosPreviewDraft.getPreviewVideos);
  const publishedVideos = useQuery(api.public.getPublishedVideos);
  const marketing = useQuery(api.cms.getPreviewMarketingFeatureFlags);

  let mergedVideos: readonly PublishedVideo[] | undefined;
  let videoDraftChanges = false;
  if (previewVideos !== undefined && previewVideos !== null) {
    mergedVideos = previewVideos.videos;
    videoDraftChanges = previewVideos.hasDraftChanges;
  } else if (publishedVideos !== undefined) {
    mergedVideos = publishedVideos;
  }

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

  if (mergedVideos === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deep-forest">
        <p className="text-ivory/60">Loading preview…</p>
      </div>
    );
  }

  const publicGalleryDisabled = !marketing.galleryPagePublished;

  return (
    <GalleryClient
      photos={photoPreview.photos}
      videos={mergedVideos}
      marketing={{
        aboutPage: marketing.aboutPage,
        recordingsPage: marketing.recordingsPage,
        pricingSection: marketing.pricingSection,
        galleryPage: marketing.galleryPage,
      }}
      banner={
        <>
          <PreviewBanner
            hasDraftChanges={
              photoPreview.hasDraftChanges || videoDraftChanges
            }
          />
          {publicGalleryDisabled ? (
            <div
              className="relative z-[45] mx-auto w-full max-w-7xl px-6 pt-[4.75rem] md:px-12 md:pt-[5.25rem]"
              role="status"
            >
              <div className="rounded-sm border border-sand/20 border-l-[3px] border-l-sand/55 bg-charcoal/90 px-4 py-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md md:px-5">
                <div className="flex flex-col gap-2.5 md:flex-row md:items-baseline md:gap-5">
                  <span className="label-text shrink-0 text-[10px] tracking-[0.22em] text-sand/80">
                    Draft visibility
                  </span>
                  <p className="body-text-small text-pretty text-[13px] leading-relaxed text-ivory/85 md:text-sm">
                    Visitors don&apos;t see the Gallery route or nav link yet.
                    Enable{" "}
                    <span className="font-medium text-warm-white">
                      Gallery page visibility
                    </span>{" "}
                    in{" "}
                    <span className="rounded-sm bg-ivory/[0.07] px-1.5 py-0.5 font-mono text-[12px] text-sand/95">
                      /admin/photos
                    </span>{" "}
                    (Gallery tab), then publish.
                  </p>
                </div>
              </div>
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
