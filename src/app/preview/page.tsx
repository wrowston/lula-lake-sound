"use client";

import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";
import { PreviewBanner } from "@/components/preview-banner";
import type { PublishedAudioTrack } from "@/components/audio-portfolio";

function PreviewContent() {
  const pricingFlags = useQuery(
    api.pricingPreviewDraft.getPreviewPricingFlags,
  );
  const gearPreview = useQuery(api.gearPreviewDraft.getPreviewGear);
  const photoPreview = useQuery(api.photosPreviewDraft.getPreviewGalleryPhotos);
  const audioPreview = useQuery(api.audioPreviewDraft.getPreviewAudioTracks);
  // INF-46: surface the draft About visibility in the homepage nav so owners
  // can confirm the feature-flag toggle before publishing. Preview query is
  // owner-only and returns `null` for non-owners.
  const aboutPreview = useQuery(api.aboutPreviewDraft.getPreviewAbout);

  if (
    pricingFlags === undefined ||
    gearPreview === undefined ||
    photoPreview === undefined ||
    audioPreview === undefined ||
    aboutPreview === undefined
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
    aboutPreview === null
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
    aboutPreview.hasDraftChanges;

  const audioTracks: PublishedAudioTrack[] = audioPreview.tracks
    .filter((t): t is typeof t & { url: string } => t.url !== null)
    .map((t) => ({
      stableId: t.stableId,
      url: t.url,
      title: t.title,
      artist: t.artist,
      description: t.description,
      mimeType: t.mimeType,
      durationSec: t.durationSec,
      sortOrder: t.sortOrder,
    }));

  return (
    <HomepageShell
      pricingFlags={{
        flags: pricingFlags.flags,
        packages: pricingFlags.packages,
      }}
      gear={{ categories: gearPreview.categories }}
      photos={photoPreview.photos}
      audioTracks={audioTracks}
      aboutVisibility={{ published: aboutPreview.published === true }}
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
