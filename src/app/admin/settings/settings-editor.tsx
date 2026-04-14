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

type SettingsContent = {
  flags: { priceTabEnabled: boolean };
  metadata?: { title?: string; description?: string };
};

export function SettingsEditor() {
  return (
    <>
      <AuthLoading>
        <p className="body-text text-ivory/40">Authenticating…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="body-text text-ivory/40">
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
    return <p className="body-text text-ivory/40">Loading settings…</p>;
  }

  if (!source) {
    return <p className="body-text text-ivory/40">No settings data available.</p>;
  }

  const hasLocalEdits = localDraft !== null;
  const hasDraftOnServer = section.hasDraftChanges;

  return (
    <div className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="label-text text-ivory/40">Feature Flags</legend>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={source.flags.priceTabEnabled}
            onChange={(e) =>
              updateField("flags", {
                ...source.flags,
                priceTabEnabled: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-sand/20 bg-charcoal accent-gold"
          />
          <span className="body-text-small text-ivory/70">
            Show pricing tab
          </span>
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="label-text text-ivory/40">Site Metadata</legend>
        <label className="block space-y-1">
          <span className="body-text-small text-ivory/50">Title</span>
          <input
            type="text"
            value={source.metadata?.title ?? ""}
            onChange={(e) =>
              updateField("metadata", {
                ...source.metadata,
                title: e.target.value,
              })
            }
            className="block w-full rounded-md border border-sand/12 bg-charcoal/60 px-3 py-2 text-sm text-ivory/80 placeholder:text-ivory/30 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/30"
          />
        </label>
        <label className="block space-y-1">
          <span className="body-text-small text-ivory/50">Description</span>
          <textarea
            rows={3}
            value={source.metadata?.description ?? ""}
            onChange={(e) =>
              updateField("metadata", {
                ...source.metadata,
                description: e.target.value,
              })
            }
            className="block w-full rounded-md border border-sand/12 bg-charcoal/60 px-3 py-2 text-sm text-ivory/80 placeholder:text-ivory/30 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/30"
          />
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 text-xs text-ivory/40">
        {hasDraftOnServer && (
          <span className="rounded bg-gold/15 px-2 py-0.5 text-gold">
            Unpublished draft on server
          </span>
        )}
        {hasLocalEdits && (
          <span className="rounded bg-sage/20 px-2 py-0.5 text-sage">
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
        <p className="rounded-md border border-fire/30 bg-fire/10 px-3 py-2 text-sm text-fire">
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
          className="rounded-md bg-sand px-4 py-2 text-sm font-medium text-washed-black transition hover:bg-warm-white disabled:cursor-not-allowed disabled:opacity-40"
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
          className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-sand border border-sand/20 transition hover:border-sand/40 disabled:cursor-not-allowed disabled:opacity-40"
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
          className="rounded-md border border-sand/20 px-4 py-2 text-sm font-medium text-ivory/60 transition hover:bg-sand/5 hover:text-ivory/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "Discarding…" ? "Discarding…" : "Discard Draft"}
        </button>
      </div>
    </div>
  );
}
