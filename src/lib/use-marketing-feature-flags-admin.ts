"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAutosaveDraft } from "@/lib/use-autosave-draft";
import { convexMutationEffect } from "@/lib/effect-errors";
import type { AutosaveStatus } from "@/components/admin/cms-publish-toolbar";
import type { MarketingFeatureFlags } from "@/lib/site-settings";

const FLAGS_DEFAULT: MarketingFeatureFlags = {
  aboutPage: false,
  recordingsPage: false,
  pricingSection: true,
};

export function mergeAutosaveStatus(
  a: AutosaveStatus,
  b: AutosaveStatus,
): AutosaveStatus {
  if (a === "saving" || b === "saving") return "saving";
  if (a === "error" || b === "error") return "error";
  if (a === "saved" || b === "saved") return "saved";
  return "idle";
}

/**
 * Marketing site visibility flags (`marketingFeatureFlags` singleton) with
 * the same draft/autosave pattern as other CMS admin editors.
 */
export function useMarketingFeatureFlagsAdmin(pauseWhen: boolean) {
  const data = useQuery(api.marketingFeatureFlags.listDraft);
  const saveDraft = useMutation(
    api.marketingFeatureFlags.saveMarketingFeatureFlagsDraft,
  );
  const publish = useMutation(
    api.marketingFeatureFlags.publishMarketingFeatureFlags,
  );
  const discard = useMutation(
    api.marketingFeatureFlags.discardMarketingFeatureFlagsDraft,
  );

  const [localDraft, setLocalDraft] = useState<MarketingFeatureFlags | null>(
    null,
  );
  const kickFFAutosaveRef = useRef<() => void>(() => {});

  const source: MarketingFeatureFlags | undefined =
    localDraft ?? data?.flags;

  const hasFFLocalEdits = localDraft !== null;
  const hasFFDraftOnServer = data?.hasDraftChanges ?? false;

  const {
    status: ffAutosaveStatus,
    flush: flushFFAutosave,
    kick: kickFFAutosave,
    cancel: cancelFFAutosave,
    onUnmount: ffOnUnmount,
  } = useAutosaveDraft({
    isDirty: hasFFLocalEdits && source !== undefined,
    pauseWhen,
    saveEffect: () =>
      convexMutationEffect(() =>
        saveDraft({
          snapshot: source ?? FLAGS_DEFAULT,
        }),
      ),
    onSaved: () => setLocalDraft(null),
  });
  kickFFAutosaveRef.current = kickFFAutosave;

  const patchFlags = useCallback(
    (partial: Partial<MarketingFeatureFlags>) => {
      if (!source) return;
      setLocalDraft({ ...source, ...partial });
      kickFFAutosaveRef.current();
    },
    [source],
  );

  const setAboutPage = useCallback(
    (aboutPage: boolean) => {
      patchFlags({ aboutPage });
    },
    [patchFlags],
  );
  const setRecordingsPage = useCallback(
    (recordingsPage: boolean) => {
      patchFlags({ recordingsPage });
    },
    [patchFlags],
  );
  const setPricingSection = useCallback(
    (pricingSection: boolean) => {
      patchFlags({ pricingSection });
    },
    [patchFlags],
  );

  const runPublishFF = useCallback(
    () => convexMutationEffect(() => publish({})),
    [publish],
  );

  const runDiscardFF = useCallback(
    () => convexMutationEffect(() => discard({})),
    [discard],
  );

  const clearFFLocal = useCallback(() => setLocalDraft(null), []);

  return {
    data,
    source,
    isLoading: data === undefined,
    hasFFLocalEdits,
    hasFFDraftOnServer,
    ffAutosaveStatus,
    flushFFAutosave,
    cancelFFAutosave,
    ffOnUnmount,
    setAboutPage,
    setRecordingsPage,
    setPricingSection,
    runPublishFF,
    runDiscardFF,
    clearFFLocal,
  };
}
