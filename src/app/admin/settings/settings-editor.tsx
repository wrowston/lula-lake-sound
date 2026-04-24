"use client";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
  useMutation,
} from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { useCallback, useRef, useState } from "react";
import { Effect } from "effect";
import { toast } from "sonner";
import { convexMutationEffect, type CmsAppError } from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { useRegisterCmsEditor } from "@/components/admin/cms-workspace";
import { useAutosaveDraft } from "@/lib/use-autosave-draft";

type SettingsContent = {
  metadata?: { title?: string; description?: string };
  /** Carried through from legacy `settings` rows until a `pricing` row exists. */
  flags?: { priceTabEnabled: boolean };
};

const fieldClass =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/50";

export function SettingsEditor() {
  return (
    <>
      <AuthLoading>
        <p className="body-text text-muted-foreground">Authenticating…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="body-text text-muted-foreground">
          Sign in to manage site settings.
        </p>
      </Unauthenticated>

      <Authenticated>
        <SettingsForm />
      </Authenticated>
    </>
  );
}

/**
 * Normalize whatever is stored on the `settings` row (which may still contain
 * legacy `flags`) for the editor. Metadata is editable; legacy `flags` are
 * preserved on save/publish so public reads do not fall back to defaults.
 */
function toSettingsContent(raw: {
  metadata?: { title?: string; description?: string };
  flags?: { priceTabEnabled?: boolean };
}): SettingsContent {
  const out: SettingsContent = { metadata: raw.metadata };
  if (
    raw.flags &&
    typeof raw.flags.priceTabEnabled === "boolean"
  ) {
    out.flags = { priceTabEnabled: raw.flags.priceTabEnabled };
  }
  return out;
}

function SettingsForm() {
  const { user } = useUser();
  const section = useQuery(api.cms.getSection, { section: "settings" });
  const saveDraft = useMutation(api.cms.saveDraft);
  const publish = useMutation(api.cms.publishSection);
  const discard = useMutation(api.cms.discardDraft);

  const [localDraft, setLocalDraft] = useState<SettingsContent | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const kickAutosaveRef = useRef<() => void>(() => {});
  const cancelAutosaveRef = useRef<() => void>(() => {});

  const source: SettingsContent | undefined =
    localDraft ??
    (section
      ? toSettingsContent(
          (section.draftSnapshot ?? section.publishedSnapshot) as {
            metadata?: { title?: string; description?: string };
            flags?: { priceTabEnabled?: boolean };
          },
        )
      : undefined);

  const updateMetadata = useCallback(
    (metadata: SettingsContent["metadata"]) => {
      if (!source) return;
      setInlineError(null);
      setLocalDraft({ ...source, metadata });
      kickAutosaveRef.current();
    },
    [source],
  );

  const runAction = useCallback(
    async <A,>(label: string, program: Effect.Effect<A, CmsAppError>) => {
      cancelAutosaveRef.current();
      setInlineError(null);
      setBusy(label);
      const outcome = await runAdminEffect(program, {
        onErrorMessage: setInlineError,
      });
      if (outcome !== undefined) {
        setLocalDraft(null);
      }
      setBusy(null);
      return outcome;
    },
    [],
  );

  const hasDraftOnServer = section?.hasDraftChanges ?? false;
  const hasLocalEdits = localDraft !== null;

  const {
    status: autosaveStatus,
    flush: flushAutosave,
    kick: kickAutosave,
    cancel: cancelAutosave,
    onUnmount: autosaveOnUnmount,
  } = useAutosaveDraft({
    isDirty: hasLocalEdits && source !== undefined,
    pauseWhen: busy !== null,
    saveEffect: () =>
      convexMutationEffect(() =>
        saveDraft({
          section: "settings",
          content: source ?? {},
        }),
      ),
    onSaved: () => setLocalDraft(null),
  });
  kickAutosaveRef.current = kickAutosave;
  cancelAutosaveRef.current = cancelAutosave;

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
    cancelAutosaveRef.current();
    setInlineError(null);
    if (hasDraftOnServer) {
      setBusy("Discarding…");
      const outcome = await runAdminEffect(
        convexMutationEffect(() => discard({ section: "settings" })),
        { onErrorMessage: setInlineError },
      );
      setBusy(null);
      if (outcome === undefined) {
        return false;
      }
    }
    setLocalDraft(null);
    toast.success(
      hasDraftOnServer
        ? "Draft discarded. The editor now matches the published site."
        : "Unsaved changes discarded.",
    );
    return true;
  }, [discard, hasDraftOnServer]);

  const handlePublish = useCallback(() => {
    const publishOnce = convexMutationEffect(() =>
      publish({ section: "settings" }),
    );
    void (async () => {
      if (hasLocalEdits) {
        const flushed = await flushAutosave();
        if (!flushed) return;
      }
      await runAction("Publishing…", publishOnce);
    })();
  }, [flushAutosave, hasLocalEdits, publish, runAction]);

  const publishedByLabel =
    section?.publishedBy && user?.id === section.publishedBy ? "You" : undefined;

  const { toolbarPortal, editorRef } = useRegisterCmsEditor({
    section: "settings",
    sectionLabel: "site settings",
    hasDraftOnServer,
    hasLocalEdits,
    publishedAt: section?.publishedAt ?? null,
    publishedByLabel,
    busy,
    autosaveStatus,
    inlineError,
    onPublish: handlePublish,
    onDiscardConfirm: handleDiscardConfirm,
    flush: flushAutosave,
  });

  // Stable ref callback — see the matching comment in `about-editor.tsx`.
  // An inline arrow would be a new identity each render, causing React to
  // detach/reattach every render and kill the pending autosave debounce.
  const handleEditorRef = useCallback(
    (el: HTMLDivElement | null) => {
      autosaveOnUnmount(el);
      editorRef(el);
    },
    [autosaveOnUnmount, editorRef],
  );

  if (section === undefined) {
    return <p className="body-text text-muted-foreground">Loading settings…</p>;
  }

  if (!source) {
    return (
      <p className="body-text text-muted-foreground">No settings data available.</p>
    );
  }

  return (
    <div className="space-y-8 pb-24" ref={handleEditorRef}>
      <fieldset className="space-y-3">
        <legend className="label-text text-muted-foreground">Site Metadata</legend>
        <label className="block space-y-1">
          <span className="body-text-small text-muted-foreground">Title</span>
          <input
            type="text"
            value={source.metadata?.title ?? ""}
            onChange={(e) =>
              updateMetadata({
                ...source.metadata,
                title: e.target.value,
              })
            }
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="body-text-small text-muted-foreground">Description</span>
          <textarea
            rows={3}
            value={source.metadata?.description ?? ""}
            onChange={(e) =>
              updateMetadata({
                ...source.metadata,
                description: e.target.value,
              })
            }
            className={fieldClass}
          />
        </label>
      </fieldset>
      {toolbarPortal}
    </div>
  );
}
