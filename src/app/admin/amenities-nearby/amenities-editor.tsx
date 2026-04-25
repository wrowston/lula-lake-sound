"use client";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useMutation,
  useQuery,
} from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { convexMutationEffect } from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { useRegisterCmsEditor } from "@/components/admin/cms-workspace";
import { useAutosaveDraft } from "@/lib/use-autosave-draft";
import {
  normalizeAmenitiesWebsiteInput,
  websiteForStorage,
} from "@/lib/amenities-url";
import { Effect } from "effect";
import { ValidationError } from "@/lib/effect-errors";

export type AmenityRow = {
  stableId: string;
  name: string;
  type: string;
  description: string;
  website: string;
};

export type AmenitiesNearbyEditorSnapshot = {
  eyebrow?: string;
  heading?: string;
  intro?: string;
  rows: AmenityRow[];
};

const FIELD_CLASS =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/50";

function generateStableId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `amenity_${crypto.randomUUID()}`;
  }
  return `amenity_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function cloneSnapshot(s: AmenitiesNearbyEditorSnapshot): AmenitiesNearbyEditorSnapshot {
  return {
    ...(s.eyebrow !== undefined ? { eyebrow: s.eyebrow } : {}),
    ...(s.heading !== undefined ? { heading: s.heading } : {}),
    ...(s.intro !== undefined ? { intro: s.intro } : {}),
    rows: s.rows.map((r) => ({ ...r })),
  };
}

function snapshotFromServer(
  published: AmenitiesNearbyEditorSnapshot,
  draft: AmenitiesNearbyEditorSnapshot | null,
): AmenitiesNearbyEditorSnapshot {
  if (draft) return cloneSnapshot(draft);
  return cloneSnapshot(published);
}

export function AmenitiesEditor() {
  return (
    <>
      <AuthLoading>
        <p className="body-text text-muted-foreground">Authenticating…</p>
      </AuthLoading>
      <Unauthenticated>
        <p className="body-text text-muted-foreground">
          Sign in to edit amenities.
        </p>
      </Unauthenticated>
      <Authenticated>
        <AmenitiesForm />
      </Authenticated>
    </>
  );
}

function AmenitiesForm() {
  const { user } = useUser();
  const data = useQuery(api.amenitiesNearbyCms.getAdminAmenitiesNearby);
  const saveDraft = useMutation(api.amenitiesNearbyCms.saveAmenitiesNearbyDraft);
  const saveFlag = useMutation(api.cms.saveSectionIsEnabledDraft);
  const publish = useMutation(api.admin.publish.publish);
  const discard = useMutation(api.cms.discardDraft);
  const validate = useQuery(api.cms.validatePublishSection, {
    section: "amenitiesNearby",
  });

  const [localSnapshot, setLocalSnapshot] =
    useState<AmenitiesNearbyEditorSnapshot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const kickAutosaveRef = useRef<() => void>(() => {});
  const cancelAutosaveRef = useRef<() => void>(() => {});

  const serverSnapshot = useMemo((): AmenitiesNearbyEditorSnapshot | undefined => {
    if (!data) return undefined;
    return snapshotFromServer(
      data.publishedSnapshot as AmenitiesNearbyEditorSnapshot,
      data.draftSnapshot as AmenitiesNearbyEditorSnapshot | null,
    );
  }, [data]);

  const source = localSnapshot ?? serverSnapshot;

  const hasLocalEdits = localSnapshot !== null;
  const hasDraftOnServer = data?.hasDraftChanges ?? false;

  const saveEffect = useCallback(() => {
    if (!source) {
      return Effect.fail(
        new ValidationError({
          message: "Nothing to save.",
          field: "snapshot",
        }),
      );
    }
    return convexMutationEffect(() =>
      saveDraft({ snapshot: source }),
    );
  }, [saveDraft, source]);

  const {
    status: autosaveStatus,
    kick,
    cancel: cancelAutosave,
    flush: flushAutosave,
    onUnmount: autosaveOnUnmount,
  } = useAutosaveDraft({
    isDirty: hasLocalEdits,
    saveEffect,
    onSaved: () => setLocalSnapshot(null),
    pauseWhen: busy !== null,
  });

  kickAutosaveRef.current = kick;
  cancelAutosaveRef.current = cancelAutosave;

  const mutate = useCallback(
    (next: AmenitiesNearbyEditorSnapshot) => {
      setInlineError(null);
      setLocalSnapshot(next);
      kickAutosaveRef.current();
    },
    [],
  );

  const setSectionVisible = useCallback(
    (enabled: boolean) => {
      void runAdminEffect(convexMutationEffect(() =>
        saveFlag({ section: "amenitiesNearby", isEnabled: enabled }),
      ), { onErrorMessage: setInlineError });
    },
    [saveFlag],
  );

  const addRow = useCallback(() => {
    if (!source) return;
    mutate({
      ...source,
      rows: [
        ...source.rows,
        {
          stableId: generateStableId(),
          name: "New place",
          type: "",
          description: "",
          website: "",
        },
      ],
    });
  }, [source, mutate]);

  const updateRow = useCallback(
    (stableId: string, patch: Partial<AmenityRow>) => {
      if (!source) return;
      mutate({
        ...source,
        rows: source.rows.map((r) =>
          r.stableId === stableId ? { ...r, ...patch } : r,
        ),
      });
    },
    [source, mutate],
  );

  const removeRow = useCallback(
    (stableId: string) => {
      if (!source) return;
      mutate({
        ...source,
        rows: source.rows.filter((r) => r.stableId !== stableId),
      });
    },
    [source, mutate],
  );

  const moveRow = useCallback(
    (index: number, dir: -1 | 1) => {
      if (!source) return;
      const j = index + dir;
      if (j < 0 || j >= source.rows.length) return;
      const next = [...source.rows];
      const t = next[index];
      const u = next[j];
      if (t === undefined || u === undefined) return;
      next[index] = u;
      next[j] = t;
      mutate({ ...source, rows: next });
    },
    [source, mutate],
  );

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
    cancelAutosaveRef.current();
    setInlineError(null);
    setBusy("Discarding…");
    const outcome = await runAdminEffect(
      convexMutationEffect(() =>
        discard({ section: "amenitiesNearby" }),
      ),
      { onErrorMessage: setInlineError },
    );
    setBusy(null);
    if (outcome === undefined) return false;
    setLocalSnapshot(null);
    toast.success("Draft discarded.");
    return true;
  }, [discard]);

  const handlePublish = useCallback(() => {
    void (async () => {
      cancelAutosaveRef.current();
      if (hasLocalEdits) {
        const flushed = await flushAutosave();
        if (!flushed) return;
      }
      setInlineError(null);
      setBusy("Publishing…");
      const outcome = await runAdminEffect(
        convexMutationEffect(() =>
          publish({ section: "amenitiesNearby" }),
        ),
        { onErrorMessage: setInlineError },
      );
      setBusy(null);
      if (outcome !== undefined) {
        setLocalSnapshot(null);
        toast.success("Amenities published.");
      }
    })();
  }, [flushAutosave, hasLocalEdits, publish]);

  const publishedByLabel =
    data?.publishedBy && user?.id === data.publishedBy ? "You" : undefined;

  const { toolbarPortal, editorRef } = useRegisterCmsEditor({
    section: "amenitiesNearby",
    sectionLabel: "amenities nearby",
    hasDraftOnServer,
    hasLocalEdits,
    publishedAt: data?.publishedAt ?? null,
    publishedByLabel,
    busy,
    autosaveStatus,
    inlineError,
    previewHref: "/preview#local-favorites",
    onPublish: handlePublish,
    onDiscardConfirm: handleDiscardConfirm,
    flush: flushAutosave,
  });

  const handleEditorRef = useCallback(
    (el: HTMLDivElement | null) => {
      autosaveOnUnmount(el);
      editorRef(el);
    },
    [autosaveOnUnmount, editorRef],
  );

  if (data === undefined) {
    return <p className="body-text text-muted-foreground">Loading…</p>;
  }

  if (!source) {
    return (
      <p className="body-text text-muted-foreground">No data available.</p>
    );
  }

  const sectionVisible = data.isEnabledDraft;

  return (
    <div className="space-y-10 pb-24" ref={handleEditorRef}>
      {toolbarPortal}

      <fieldset className="space-y-4">
        <legend className="label-text text-muted-foreground">Site visibility</legend>
        <div className="flex items-start gap-3">
          <Switch
            id="amenities-section-visible"
            checked={sectionVisible}
            onCheckedChange={setSectionVisible}
          />
          <div className="space-y-1">
            <label
              htmlFor="amenities-section-visible"
              className="body-text-small cursor-pointer text-foreground"
            >
              Show “Local favorites” block on homepage
            </label>
            <p className="body-text-small text-muted-foreground">
              When off, the block is hidden from the public site (preview still
              respects draft visibility for owners).
            </p>
          </div>
        </div>
      </fieldset>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Section labels (optional)</h2>
        <p className="body-text-small text-muted-foreground">
          Leave blank to use the default eyebrow, heading, and no intro paragraph
          on the marketing site.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Eyebrow
            </span>
            <Input
              className={FIELD_CLASS}
              value={source.eyebrow ?? ""}
              onChange={(e) =>
                mutate({ ...source, eyebrow: e.target.value })
              }
              placeholder="Local Favorites"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Heading
            </span>
            <Input
              className={FIELD_CLASS}
              value={source.heading ?? ""}
              onChange={(e) =>
                mutate({ ...source, heading: e.target.value })
              }
              placeholder="Amenities Nearby"
            />
          </label>
        </div>
        <label className="space-y-1 block">
          <span className="text-xs font-medium text-muted-foreground">
            Intro (optional)
          </span>
          <Textarea
            className={cn(FIELD_CLASS, "min-h-[88px]")}
            value={source.intro ?? ""}
            onChange={(e) => mutate({ ...source, intro: e.target.value })}
            placeholder="Short line under the heading…"
          />
        </label>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Places</h2>
            <p className="body-text-small text-muted-foreground">
              Ordered list of cards. Website must be a valid http(s) URL to
              publish (saved drafts may omit until you are ready).
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addRow}>
            <Plus className="mr-1 size-4" aria-hidden />
            Add place
          </Button>
        </div>

        {validate && !validate.ok ? (
          <div
            className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm"
            role="status"
          >
            <p className="font-medium text-destructive mb-2">
              Fix before publishing:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              {validate.issues.map((issue, i) => (
                <li key={i}>
                  <span className="font-mono text-xs">{issue.path}</span> —{" "}
                  {issue.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {source.rows.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No cards yet. Add a place or run the site seed to load defaults.
          </p>
        ) : (
          <ul className="space-y-6">
            {source.rows.map((row, index) => (
              <li
                key={row.stableId}
                className="rounded-lg border border-border bg-background p-4 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{index + 1}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => moveRow(index, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Move down"
                      disabled={index === source.rows.length - 1}
                      onClick={() => moveRow(index, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      aria-label="Remove"
                      onClick={() => removeRow(row.stableId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Name
                    </span>
                    <Input
                      className={FIELD_CLASS}
                      value={row.name}
                      onChange={(e) =>
                        updateRow(row.stableId, { name: e.target.value })
                      }
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Type / category line
                    </span>
                    <Input
                      className={FIELD_CLASS}
                      value={row.type}
                      onChange={(e) =>
                        updateRow(row.stableId, { type: e.target.value })
                      }
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Description
                    </span>
                    <Textarea
                      className={cn(FIELD_CLASS, "min-h-[100px]")}
                      value={row.description}
                      onChange={(e) =>
                        updateRow(row.stableId, {
                          description: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Website URL
                    </span>
                    <Input
                      className={FIELD_CLASS}
                      value={row.website}
                      onChange={(e) =>
                        updateRow(row.stableId, { website: e.target.value })
                      }
                      onBlur={() => {
                        const n = normalizeAmenitiesWebsiteInput(row.website);
                        if (n !== null) {
                          updateRow(row.stableId, {
                            website: websiteForStorage(n),
                          });
                        }
                      }}
                      placeholder="https://…"
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
