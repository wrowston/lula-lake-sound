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
import { Plus, Trash2 } from "lucide-react";
import { convexMutationEffect, type CmsAppError } from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { useRegisterCmsEditor } from "@/components/admin/cms-workspace";
import { useAutosaveDraft } from "@/lib/use-autosave-draft";
import type { FaqSnapshot } from "../../../../convex/cmsShared";
import { Button } from "@/components/ui/button";

const fieldClass =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/50";

function newStableId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function FaqEditor() {
  return (
    <>
      <AuthLoading>
        <p className="body-text text-muted-foreground">Authenticating…</p>
      </AuthLoading>
      <Unauthenticated>
        <p className="body-text text-muted-foreground">
          Sign in to manage FAQ content.
        </p>
      </Unauthenticated>
      <Authenticated>
        <FaqForm />
      </Authenticated>
    </>
  );
}

function FaqForm() {
  const { user } = useUser();
  const section = useQuery(api.cms.getSection, { section: "faq" });
  const saveDraft = useMutation(api.cms.saveDraft);
  const publish = useMutation(api.cms.publishSection);
  const discard = useMutation(api.cms.discardDraft);

  const [localDraft, setLocalDraft] = useState<FaqSnapshot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const kickAutosaveRef = useRef<() => void>(() => {});
  const cancelAutosaveRef = useRef<() => void>(() => {});

  const source: FaqSnapshot | undefined =
    localDraft ??
    (section
      ? ((section.draftSnapshot ?? section.publishedSnapshot) as FaqSnapshot)
      : undefined);

  const setCategories = useCallback(
    (categories: FaqSnapshot["categories"]) => {
      if (!source) return;
      setInlineError(null);
      setLocalDraft({ categories });
      kickAutosaveRef.current();
    },
    [source],
  );

  const addCategory = useCallback(() => {
    if (!source) return;
    setCategories([
      ...source.categories,
      {
        stableId: newStableId("cat"),
        title: "New category",
        questions: [
          {
            stableId: newStableId("q"),
            question: "",
            answer: "",
          },
        ],
      },
    ]);
  }, [setCategories, source]);

  const removeCategory = useCallback(
    (stableId: string) => {
      if (!source) return;
      setCategories(source.categories.filter((c) => c.stableId !== stableId));
    },
    [setCategories, source],
  );

  const updateCategoryTitle = useCallback(
    (stableId: string, title: string) => {
      if (!source) return;
      setCategories(
        source.categories.map((c) =>
          c.stableId === stableId ? { ...c, title } : c,
        ),
      );
    },
    [setCategories, source],
  );

  const addQuestion = useCallback(
    (categoryStableId: string) => {
      if (!source) return;
      setCategories(
        source.categories.map((c) =>
          c.stableId === categoryStableId
            ? {
                ...c,
                questions: [
                  ...c.questions,
                  {
                    stableId: newStableId("q"),
                    question: "",
                    answer: "",
                  },
                ],
              }
            : c,
        ),
      );
    },
    [setCategories, source],
  );

  const removeQuestion = useCallback(
    (categoryStableId: string, questionStableId: string) => {
      if (!source) return;
      setCategories(
        source.categories.map((c) =>
          c.stableId === categoryStableId
            ? {
                ...c,
                questions: c.questions.filter(
                  (q) => q.stableId !== questionStableId,
                ),
              }
            : c,
        ),
      );
    },
    [setCategories, source],
  );

  const updateQuestion = useCallback(
    (
      categoryStableId: string,
      questionStableId: string,
      patch: Partial<{ question: string; answer: string }>,
    ) => {
      if (!source) return;
      setCategories(
        source.categories.map((c) =>
          c.stableId === categoryStableId
            ? {
                ...c,
                questions: c.questions.map((q) =>
                  q.stableId === questionStableId ? { ...q, ...patch } : q,
                ),
              }
            : c,
        ),
      );
    },
    [setCategories, source],
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
          section: "faq",
          content: source ?? { categories: [] },
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
        convexMutationEffect(() => discard({ section: "faq" })),
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
      publish({ section: "faq" }),
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
    section: "faq",
    sectionLabel: "homepage FAQ",
    hasDraftOnServer,
    hasLocalEdits,
    publishedAt: section?.publishedAt ?? null,
    publishedByLabel,
    busy,
    autosaveStatus,
    inlineError,
    previewHref: "/preview",
    onPublish: handlePublish,
    onDiscardConfirm: handleDiscardConfirm,
    flush: flushAutosave,
  });

  const handleEditorRef = useCallback(
    (node: HTMLDivElement | null) => {
      editorRef(node);
      autosaveOnUnmount(node);
    },
    [autosaveOnUnmount, editorRef],
  );

  if (source === undefined) {
    return (
      <div className="body-text text-muted-foreground" ref={handleEditorRef}>
        Loading FAQ…
      </div>
    );
  }

  return (
    <>
      {toolbarPortal}
      <div ref={handleEditorRef} className="mx-auto max-w-3xl space-y-10 p-6">
        <div>
          <h2 className="headline-secondary text-foreground mb-1 text-lg">
            Homepage FAQ
          </h2>
          <p className="body-text-small text-muted-foreground">
            Categories and Q&amp;A appear on the marketing homepage. Answers are
            plain text (no HTML). Publish to go live.
          </p>
        </div>

        <div className="space-y-12">
          {source.categories.map((cat) => (
            <div
              key={cat.stableId}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <label className="body-text-small text-muted-foreground">
                    Category title
                  </label>
                  <input
                    className={fieldClass}
                    value={cat.title}
                    onChange={(e) =>
                      updateCategoryTitle(cat.stableId, e.target.value)
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={() => removeCategory(cat.stableId)}
                >
                  <Trash2 className="size-3.5" />
                  Remove category
                </Button>
              </div>

              <div className="space-y-6 border-t border-border pt-5">
                {cat.questions.map((q) => (
                  <div
                    key={q.stableId}
                    className="space-y-3 rounded-md bg-muted/30 p-4"
                  >
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-muted-foreground"
                        onClick={() =>
                          removeQuestion(cat.stableId, q.stableId)
                        }
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <label className="body-text-small text-muted-foreground">
                        Question
                      </label>
                      <input
                        className={fieldClass}
                        value={q.question}
                        onChange={(e) =>
                          updateQuestion(cat.stableId, q.stableId, {
                            question: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="body-text-small text-muted-foreground">
                        Answer
                      </label>
                      <textarea
                        className={`${fieldClass} min-h-[100px] resize-y`}
                        value={q.answer}
                        onChange={(e) =>
                          updateQuestion(cat.stableId, q.stableId, {
                            answer: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  onClick={() => addQuestion(cat.stableId)}
                >
                  <Plus className="size-3.5" />
                  Add question
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="default" className="gap-1" onClick={addCategory}>
          <Plus className="size-4" />
          Add category
        </Button>
      </div>
    </>
  );
}
