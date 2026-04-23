"use client";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AboutLayout } from "../../about/about-layout";
import { PreviewBanner } from "@/components/preview-banner";
import { isHomepagePricingSectionEnabled } from "@/lib/site-settings";

/**
 * Owner-only preview of the About page using the draft CMS snapshot. Mirrors
 * `/preview` (homepage): unauthenticated visitors are told to sign in, and
 * the preview query itself returns `null` for non-owners so drafts never
 * leak. The `published` flag is taken from the draft so the owner can verify
 * how the public page will look with the feature flag either on or off.
 */
function AboutPreviewContent() {
  const about = useQuery(api.aboutPreviewDraft.getPreviewAbout);
  const pricingPreview = useQuery(
    api.pricingPreviewDraft.getPreviewPricingFlags,
  );
  const marketing = useQuery(
    api.marketingFeatureFlags.getPreviewMarketingFeatureFlags,
  );

  if (about === undefined || pricingPreview === undefined || marketing === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deep-forest">
        <p className="text-ivory/60">Loading preview…</p>
      </div>
    );
  }

  if (about === null || pricingPreview === null || marketing === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deep-forest">
        <p className="text-ivory/60">
          Preview is not available. You may not have permission to view draft
          content.
        </p>
      </div>
    );
  }

  const { hasDraftChanges: _aboutDrafty, ...data } = about;
  void _aboutDrafty;
  const showPricing = isHomepagePricingSectionEnabled(marketing);
  const hasDraftChanges =
    about.hasDraftChanges ||
    pricingPreview.hasDraftChanges ||
    marketing.hasDraftChanges;

  return (
    <AboutLayout
      data={data}
      showPricing={showPricing}
      marketing={{
        aboutPage: marketing.aboutPage,
        recordingsPage: marketing.recordingsPage,
        pricingSection: marketing.pricingSection,
      }}
      banner={<PreviewBanner hasDraftChanges={hasDraftChanges} />}
    />
  );
}

export default function AboutPreviewPage() {
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
        <AboutPreviewContent />
      </Authenticated>
    </>
  );
}
