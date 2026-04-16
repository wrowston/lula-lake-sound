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
import { useCallback, useState } from "react";
import { Effect, pipe } from "effect";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { convexMutationEffect, type CmsAppError } from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { CmsPublishToolbar } from "@/components/admin/cms-publish-toolbar";

type SettingsContent = {
  flags: { priceTabEnabled: boolean };
  metadata?: { title?: string; description?: string };
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

function SettingsForm() {
  const { user } = useUser();
  const section = useQuery(api.cms.getSection, { section: "settings" });
  const saveDraft = useMutation(api.cms.saveDraft);
  const publish = useMutation(api.cms.publishSection);
  const discard = useMutation(api.cms.discardDraft);

  const [localDraft, setLocalDraft] = useState<SettingsContent | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const source: SettingsContent | undefined =
    localDraft ??
    (section
      ? section.draftSnapshot ?? section.publishedSnapshot
      : undefined);

  const updateField = useCallback(
    <K extends keyof SettingsContent>(key: K, value: SettingsContent[K]) => {
      if (!source) return;
      setInlineError(null);
      setLocalDraft({ ...source, [key]: value });
    },
    [source],
  );

  const runAction = useCallback(
    async <A,>(label: string, program: Effect.Effect<A, CmsAppError>) => {
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

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
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

  if (section === undefined) {
    return <p className="body-text text-muted-foreground">Loading settings…</p>;
  }

  if (!source) {
    return (
      <p className="body-text text-muted-foreground">No settings data available.</p>
    );
  }

  const hasLocalEdits = localDraft !== null;

  const publishedByLabel =
    section.publishedBy && user?.id === section.publishedBy ? "You" : undefined;

  return (
    <div className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="label-text text-muted-foreground">Feature Flags</legend>
        <div className="flex items-center gap-3">
          <Switch
            id="settings-price-tab-enabled"
            checked={source.flags.priceTabEnabled}
            onCheckedChange={(checked) =>
              updateField("flags", {
                ...source.flags,
                priceTabEnabled: checked,
              })
            }
          />
          <label
            htmlFor="settings-price-tab-enabled"
            className="body-text-small cursor-pointer text-foreground"
          >
            Show pricing tab
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="label-text text-muted-foreground">Site Metadata</legend>
        <label className="block space-y-1">
          <span className="body-text-small text-muted-foreground">Title</span>
          <input
            type="text"
            value={source.metadata?.title ?? ""}
            onChange={(e) =>
              updateField("metadata", {
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
              updateField("metadata", {
                ...source.metadata,
                description: e.target.value,
              })
            }
            className={fieldClass}
          />
        </label>
      </fieldset>

      <CmsPublishToolbar
        section="settings"
        sectionLabel="site settings"
        hasDraftOnServer={hasDraftOnServer}
        hasLocalEdits={hasLocalEdits}
        publishedAt={section.publishedAt ?? null}
        publishedByLabel={publishedByLabel}
        busy={busy}
        inlineError={inlineError}
        onSaveDraft={() =>
          void runAction(
            "Saving…",
            convexMutationEffect(() =>
              saveDraft({
                section: "settings",
                content: {
                  flags: source.flags,
                  metadata: source.metadata,
                },
              }),
            ),
          )
        }
        onPublish={() => {
          const publishOnce = convexMutationEffect(() =>
            publish({ section: "settings" }),
          );
          const program = hasLocalEdits
            ? pipe(
                convexMutationEffect(() =>
                  saveDraft({
                    section: "settings",
                    content: {
                      flags: source.flags,
                      metadata: source.metadata,
                    },
                  }),
                ),
                Effect.flatMap(() => publishOnce),
              )
            : publishOnce;
          return void runAction("Publishing…", program);
        }}
        onDiscardConfirm={handleDiscardConfirm}
      />
    </div>
  );
}
