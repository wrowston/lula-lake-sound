"use client";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
  useMutation,
} from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCallback, useState } from "react";
import { Effect, pipe } from "effect";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { convexMutationEffect, type CmsAppError } from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";

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
  const section = useQuery(api.cms.getSection, { section: "settings" });
  const saveDraft = useMutation(api.cms.saveDraft);
  const publish = useMutation(api.cms.publishSection);
  const discard = useMutation(api.cms.discardDraft);

  const [localDraft, setLocalDraft] = useState<SettingsContent | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const source: SettingsContent | undefined =
    localDraft ??
    (section
      ? section.draftSnapshot ?? section.publishedSnapshot
      : undefined);

  const updateField = useCallback(
    <K extends keyof SettingsContent>(key: K, value: SettingsContent[K]) => {
      if (!source) return;
      setLocalDraft({ ...source, [key]: value });
    },
    [source],
  );

  const runAction = useCallback(
    async <A,>(label: string, program: Effect.Effect<A, CmsAppError>) => {
      setBusy(label);
      const outcome = await runAdminEffect(program);
      if (outcome !== undefined) {
        setLocalDraft(null);
      }
      setBusy(null);
      return outcome;
    },
    [],
  );

  const hasDraftOnServer = section?.hasDraftChanges ?? false;

  const confirmDiscard = useCallback(async () => {
    if (hasDraftOnServer) {
      setBusy("Discarding…");
      const outcome = await runAdminEffect(
        convexMutationEffect(() => discard({ section: "settings" })),
      );
      setBusy(null);
      if (outcome === undefined) {
        return;
      }
    }
    setLocalDraft(null);
    setDiscardDialogOpen(false);
    toast.success(
      hasDraftOnServer
        ? "Draft discarded. The editor now matches the published site."
        : "Unsaved changes discarded.",
    );
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

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {hasDraftOnServer && (
          <span className="rounded bg-primary/15 px-2 py-0.5 text-primary">
            Unpublished draft on server
          </span>
        )}
        {hasLocalEdits && (
          <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">
            Unsaved local edits
          </span>
        )}
        {section.publishedAt && (
          <span>
            Last published{" "}
            {new Date(section.publishedAt).toLocaleString()}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          disabled={!hasLocalEdits || busy !== null}
          onClick={() =>
            runAction(
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
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "Saving…" ? "Saving…" : "Save Draft"}
        </button>

        <button
          disabled={(!hasDraftOnServer && !hasLocalEdits) || busy !== null}
          onClick={() => {
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
            return runAction("Publishing…", program);
          }}
          className="rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "Publishing…" ? "Publishing…" : "Publish"}
        </button>

        <button
          type="button"
          disabled={(!hasDraftOnServer && !hasLocalEdits) || busy !== null}
          onClick={() => setDiscardDialogOpen(true)}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          Discard draft
        </button>
      </div>

      <AlertDialog
        open={discardDialogOpen}
        onOpenChange={(open, eventDetails) => {
          if (!open && busy === "Discarding…") {
            eventDetails.cancel()
            return
          }
          setDiscardDialogOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard draft changes?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasDraftOnServer
                ? "This removes unpublished edits from the server and resets the editor to the last published settings. The live site is not changed."
                : "This clears unsaved edits in your browser and shows the last published settings again."}
              {!section.publishedAt && hasDraftOnServer ? (
                <>
                  {" "}
                  Nothing has been published yet, so you will see the same default
                  baseline stored for the site until you publish.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "Discarding…"}>
              Cancel
            </AlertDialogCancel>
            <button
              type="button"
              disabled={busy === "Discarding…"}
              onClick={() => void confirmDiscard()}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-transparent bg-destructive/10 px-2.5 text-sm font-medium text-destructive outline-none transition hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-3 focus-visible:ring-destructive/20 disabled:pointer-events-none disabled:opacity-50 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40"
            >
              {busy === "Discarding…" ? "Discarding…" : "Discard"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
