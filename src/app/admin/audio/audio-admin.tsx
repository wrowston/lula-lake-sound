"use client";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CmsPublishToolbar } from "@/components/admin/cms-publish-toolbar";
import { Switch } from "@/components/ui/switch";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { useMarketingFeatureFlagsAdmin } from "@/lib/use-marketing-feature-flags-admin";

export function AudioAdmin() {
  return (
    <>
      <AuthLoading>
        <p className="body-text text-muted-foreground">Authenticating…</p>
      </AuthLoading>
      <Unauthenticated>
        <p className="body-text text-muted-foreground">Sign in to manage audio.</p>
      </Unauthenticated>
      <Authenticated>
        <AudioAdminForm />
      </Authenticated>
    </>
  );
}

function AudioAdminForm() {
  const { user } = useUser();
  const [busy, setBusy] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const {
    data: featureFlagsCms,
    source: featureFlagsSource,
    isLoading,
    hasFFLocalEdits,
    hasFFDraftOnServer,
    ffAutosaveStatus,
    flushFFAutosave,
    cancelFFAutosave: cancelFFAutosave,
    ffOnUnmount,
    setRecordingsPage,
    runPublishFF,
    runDiscardFF,
    clearFFLocal,
  } = useMarketingFeatureFlagsAdmin(busy !== null);

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
    cancelFFAutosave();
    setInlineError(null);
    if (hasFFDraftOnServer) {
      setBusy("Discarding…");
      const outcome = await runAdminEffect(runDiscardFF(), {
        onErrorMessage: setInlineError,
      });
      setBusy(null);
      if (outcome === undefined) {
        return false;
      }
    }
    clearFFLocal();
    toast.success(
      hasFFDraftOnServer
        ? "Draft discarded. The editor now matches the published site."
        : "Unsaved changes discarded.",
    );
    return true;
  }, [hasFFDraftOnServer, runDiscardFF, clearFFLocal, cancelFFAutosave]);

  if (isLoading) {
    return (
      <p className="body-text text-muted-foreground">Loading site visibility…</p>
    );
  }

  if (!featureFlagsSource) {
    return (
      <p className="body-text text-muted-foreground">
        No feature flag data available.
      </p>
    );
  }

  const publishedByLabel =
    featureFlagsCms?.publishedBy && user?.id === featureFlagsCms.publishedBy
      ? "You"
      : undefined;

  return (
    <div className="space-y-8 pb-24" ref={ffOnUnmount}>
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="body-text text-muted-foreground">
          Audio sample management coming soon.
        </p>
      </div>

      <fieldset className="space-y-4">
        <legend className="label-text text-muted-foreground">Site visibility</legend>
        <div className="flex items-start gap-3">
          <Switch
            id="ff-recordings-embedded"
            checked={featureFlagsSource.recordingsPage}
            onCheckedChange={setRecordingsPage}
          />
          <div className="space-y-1">
            <label
              htmlFor="ff-recordings-embedded"
              className="body-text-small cursor-pointer text-foreground"
            >
              Recordings page (<code className="text-xs">/recordings</code>)
            </label>
            <p className="body-text-small text-muted-foreground">
              When off, the route returns 404 and the header link is hidden.
            </p>
          </div>
        </div>
      </fieldset>

      <CmsPublishToolbar
        section="marketingFeatureFlags"
        sectionLabel="Recordings visibility"
        hasDraftOnServer={hasFFDraftOnServer}
        hasLocalEdits={hasFFLocalEdits}
        publishedAt={featureFlagsCms?.publishedAt ?? null}
        publishedByLabel={publishedByLabel}
        busy={busy}
        onPublish={() => {
          void (async () => {
            cancelFFAutosave();
            if (hasFFLocalEdits) {
              const flushed = await flushFFAutosave();
              if (!flushed) return;
            }
            setInlineError(null);
            setBusy("Publishing…");
            const outcome = await runAdminEffect(runPublishFF(), {
              onErrorMessage: setInlineError,
            });
            setBusy(null);
            if (outcome !== undefined) {
              clearFFLocal();
              toast.success("Changes published.");
            }
          })();
        }}
        onDiscardConfirm={handleDiscardConfirm}
        previewHref="/preview"
        inlineError={inlineError}
        autosaveStatus={ffAutosaveStatus}
      />
    </div>
  );
}
