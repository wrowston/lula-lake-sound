"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Effect } from "effect";
import { api } from "../../convex/_generated/api";
import { useAutosaveDraft } from "@/lib/use-autosave-draft";
import { convexMutationEffect } from "@/lib/effect-errors";
import type { AutosaveStatus } from "@/components/admin/cms-publish-toolbar";
import type { MarketingFeatureFlags } from "@/lib/site-settings";

const FLAGS_DEFAULT: MarketingFeatureFlags = {
  aboutPage: false,
  recordingsPage: false,
  pricingSection: true,
  galleryPage: true,
};

/** Settings-UI marketing flags only (gallery page is edited in /admin/photos). */
type MarketingFlagKey = "aboutPage" | "recordingsPage" | "pricingSection";

const FLAG_TO_SECTION: Record<
  MarketingFlagKey,
  "about" | "recordings" | "pricing"
> = {
  aboutPage: "about",
  recordingsPage: "recordings",
  pricingSection: "pricing",
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
 * Marketing-site visibility flags. Internally reads/writes each flag as a
 * per-section `cmsSections.isEnabled` row; the hook preserves the
 * snapshot-shaped public API so the admin editors stay unchanged.
 */
export function useMarketingFeatureFlagsAdmin(pauseWhen: boolean) {
  const data = useQuery(api.cms.listMarketingFlagsDraft);
  const saveSectionFlag = useMutation(api.cms.saveSectionIsEnabledDraft);
  const publish = useMutation(api.cms.publishMarketingFlags);
  const discard = useMutation(api.cms.discardMarketingFlagsDraft);

  const [localDraft, setLocalDraft] = useState<MarketingFeatureFlags | null>(
    null,
  );
  const kickFFAutosaveRef = useRef<() => void>(() => {});

  const source: MarketingFeatureFlags | undefined =
    localDraft ?? data?.flags;

  const hasFFLocalEdits = localDraft !== null;
  const hasFFDraftOnServer = data?.hasDraftChanges ?? false;

  const saveEffect = useCallback(() => {
    if (source === undefined) return Effect.void;
    const base = data?.flags ?? FLAGS_DEFAULT;
    const dirtyKeys: MarketingFlagKey[] = (
      ["aboutPage", "recordingsPage", "pricingSection"] as const
    ).filter((k) => source[k] !== base[k]);
    if (dirtyKeys.length === 0) return Effect.void;
    return Effect.all(
      dirtyKeys.map((key) =>
        convexMutationEffect(() =>
          saveSectionFlag({
            section: FLAG_TO_SECTION[key],
            isEnabled: source[key],
          }),
        ),
      ),
      { concurrency: "unbounded" },
    );
  }, [source, data?.flags, saveSectionFlag]);

  const {
    status: ffAutosaveStatus,
    flush: flushFFAutosave,
    kick: kickFFAutosave,
    cancel: cancelFFAutosave,
    onUnmount: ffOnUnmount,
  } = useAutosaveDraft({
    isDirty: hasFFLocalEdits && source !== undefined,
    pauseWhen,
    saveEffect,
    onSaved: () => setLocalDraft(null),
  });
  kickFFAutosaveRef.current = kickFFAutosave;

  const patchFlags = useCallback(
    (partial: Partial<Pick<MarketingFeatureFlags, MarketingFlagKey>>) => {
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
