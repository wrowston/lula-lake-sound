"use client";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { RecordingsClient } from "../../recordings/recordings-client";
import { RECORDINGS } from "../../recordings/recordings-data";
import { PreviewBanner } from "@/components/preview-banner";

function RecordingsPreviewContent() {
  const marketing = useQuery(
    api.marketingFeatureFlags.getPreviewMarketingFeatureFlags,
  );

  if (marketing === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-washed-black">
        <p className="text-ivory/60">Loading preview…</p>
      </div>
    );
  }

  if (marketing === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-washed-black">
        <p className="text-ivory/60">
          Preview is not available. You may not have permission to view draft
          content.
        </p>
      </div>
    );
  }

  const { hasDraftChanges, ...flags } = marketing;
  if (!flags.recordingsPage) {
    return (
      <div className="dark min-h-screen bg-washed-black text-ivory">
        <PreviewBanner hasDraftChanges={hasDraftChanges} />
        <div className="mx-auto max-w-lg px-6 pt-32 pb-24 text-center">
          <p className="body-text text-ivory/70">
            The Recordings page is off in your draft. Turn on{" "}
            <span className="text-ivory/90">Recordings page</span> in Marketing
            feature flags to preview it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <RecordingsClient
      recordings={RECORDINGS}
      marketing={flags}
      banner={<PreviewBanner hasDraftChanges={hasDraftChanges} />}
    />
  );
}

export default function RecordingsPreviewPage() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center bg-washed-black">
          <p className="text-ivory/60">Authenticating…</p>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center bg-washed-black">
          <p className="text-ivory/60">
            Sign in required to preview draft content.
          </p>
        </div>
      </Unauthenticated>

      <Authenticated>
        <RecordingsPreviewContent />
      </Authenticated>
    </>
  );
}
