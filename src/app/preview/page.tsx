"use client";

import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { HomepageShell } from "@/components/homepage-shell";
import { PreviewBanner } from "@/components/preview-banner";

function PreviewContent() {
  const settings = useQuery(
    api.siteSettingsPreviewDraft.getPreviewSiteSettings,
  );

  if (settings === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-washed-black">
        <p className="text-ivory/60">Loading preview…</p>
      </div>
    );
  }

  if (settings === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-washed-black">
        <p className="text-ivory/60">
          Preview is not available. You may not have permission to view draft content.
        </p>
      </div>
    );
  }

  return (
    <HomepageShell
      settings={settings}
      banner={<PreviewBanner hasDraftChanges={settings.hasDraftChanges} />}
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
