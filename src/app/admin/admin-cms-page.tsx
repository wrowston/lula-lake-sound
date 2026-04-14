"use client";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
  useMutation,
} from "convex/react";
import { UserButton } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { useCallback, useState } from "react";

export function AdminCmsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Studio CMS</h1>
        <Authenticated>
          <UserButton />
        </Authenticated>
      </header>

      <AuthLoading>
        <p className="text-neutral-500">Authenticating…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="text-neutral-600">
          Convex is not authenticated. Sign in to manage site settings.
        </p>
      </Unauthenticated>

      <Authenticated>
        <SettingsEditor />
      </Authenticated>
    </div>
  );
}

type SettingsContent = {
  flags: { priceTabEnabled: boolean };
  metadata?: { title?: string; description?: string };
};

function SettingsEditor() {
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
    <K extends keyof SettingsContent>(
      key: K,
      value: SettingsContent[K],
    ) => {
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
    return <p className="text-neutral-500">Loading settings…</p>;
  }

  if (!source) {
    return <p className="text-neutral-500">No settings data available.</p>;
  }

  const hasLocalEdits = localDraft !== null;
  const hasDraftOnServer = section.hasDraftChanges;

  return (
    <div className="space-y-8">
      {/* ---------- flags ---------- */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Feature Flags
        </legend>

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
            className="h-4 w-4 rounded border-neutral-300"
          />
          <span className="text-sm">Show pricing tab</span>
        </label>
      </fieldset>

      {/* ---------- metadata ---------- */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Site Metadata
        </legend>

        <label className="block space-y-1">
          <span className="text-sm text-neutral-700">Title</span>
          <input
            type="text"
            value={source.metadata?.title ?? ""}
            onChange={(e) =>
              updateField("metadata", {
                ...source.metadata,
                title: e.target.value,
              })
            }
            className="block w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-neutral-700">Description</span>
          <textarea
            rows={3}
            value={source.metadata?.description ?? ""}
            onChange={(e) =>
              updateField("metadata", {
                ...source.metadata,
                description: e.target.value,
              })
            }
            className="block w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </label>
      </fieldset>

      {/* ---------- status ---------- */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
        {hasDraftOnServer && (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">
            Unpublished draft on server
          </span>
        )}
        {hasLocalEdits && (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-800">
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
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {lastError}
        </p>
      )}

      {/* ---------- actions ---------- */}
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
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
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
          className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-40"
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
          className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "Discarding…" ? "Discarding…" : "Discard Draft"}
        </button>
      </div>
    </div>
  );
}
