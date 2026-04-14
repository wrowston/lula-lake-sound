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
import { Switch } from "@/components/ui/switch";

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
  const [lastError, setLastError] = useState<string | null>(null);

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
    async (label: string, fn: () => Promise<unknown>) => {
      setBusy(label);
      setLastError(null);
      try {
        await fn();
        setLocalDraft(null);
      } catch (err) {
        setLastError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  if (section === undefined) {
    return <p className="body-text text-muted-foreground">Loading settings…</p>;
  }

  if (!source) {
    return (
      <p className="body-text text-muted-foreground">No settings data available.</p>
    );
  }

  const hasLocalEdits = localDraft !== null;
  const hasDraftOnServer = section.hasDraftChanges;

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

      {lastError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {lastError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          disabled={!hasLocalEdits || busy !== null}
          onClick={() =>
            runAction("Saving…", () =>
              saveDraft({
                section: "settings",
                content: {
                  flags: source.flags,
                  metadata: source.metadata,
                },
              }),
            )
          }
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "Saving…" ? "Saving…" : "Save Draft"}
        </button>

        <button
          disabled={(!hasDraftOnServer && !hasLocalEdits) || busy !== null}
          onClick={() =>
            runAction("Publishing…", async () => {
              if (hasLocalEdits) {
                await saveDraft({
                  section: "settings",
                  content: {
                    flags: source.flags,
                    metadata: source.metadata,
                  },
                });
              }
              await publish({ section: "settings" });
            })
          }
          className="rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "Publishing…" ? "Publishing…" : "Publish"}
        </button>

        <button
          disabled={(!hasDraftOnServer && !hasLocalEdits) || busy !== null}
          onClick={() =>
            runAction("Discarding…", async () => {
              await discard({ section: "settings" });
            })
          }
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "Discarding…" ? "Discarding…" : "Discard Draft"}
        </button>
      </div>
    </div>
  );
}
