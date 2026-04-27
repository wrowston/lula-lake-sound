"use client";

/**
 * FAQ admin editor (INF-123).
 *
 * Owner-facing CMS for the homepage FAQ. The category → question tree is
 * editable in two tiers — categories carry their own ordering and questions
 * order within each category. The editor reuses the shared CMS plumbing:
 *
 *   - `api.cms.getSection` for the published / draft snapshot
 *   - `api.cms.saveDraft` for autosave (drafts mid-edit)
 *   - `api.cms.publishSection` / `api.cms.discardDraft` for the toolbar
 *   - `api.cms.validatePublishSection` for live preflight issues
 *
 * Validation paths emitted by `collectFaqIssues` are parsed inline so each
 * blocker renders next to the offending field — the publish banner remains
 * the canonical list while the inline tags help locate problems in long
 * lists without scrolling.
 */

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
  useMutation,
} from "convex/react";
import { useUser } from "@clerk/nextjs";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Effect } from "effect";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  CircleHelp,
  Layers,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import {
  convexMutationEffect,
  type CmsAppError,
} from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { useRegisterCmsEditor } from "@/components/admin/cms-workspace";
import { useAutosaveDraft } from "@/lib/use-autosave-draft";
import type { FaqSnapshot } from "../../../../convex/cmsShared";
import { FAQ_DEFAULTS } from "../../../../convex/cmsShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Category = FaqSnapshot["categories"][number];
type Question = Category["questions"][number];

type ValidationIssue = { readonly path: string; readonly message: string };

interface ValidationView {
  readonly hasBlockers: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly categoryTitleErrors: ReadonlySet<string>;
  readonly categoryEmptyErrors: ReadonlySet<string>;
  readonly questionTextErrors: ReadonlyMap<string, ReadonlySet<"question" | "answer">>;
}

const EMPTY_VALIDATION: ValidationView = {
  hasBlockers: false,
  issues: [],
  categoryTitleErrors: new Set(),
  categoryEmptyErrors: new Set(),
  questionTextErrors: new Map(),
};

function newStableId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Map issues from `collectFaqIssues` onto the editor's UI atoms so each
 * field can render its own inline marker. Paths produced by the backend:
 *   - `categories[i].title`             → category whose title is empty
 *   - `categories.{id}.questions`       → category with no questions
 *   - `question.{id}.question` / `.answer` → question/answer empty
 *
 * `categories` must match the tree order the backend used when emitting
 * indexed paths (the persisted draft), not necessarily the in-memory local
 * order while unsaved edits exist.
 */
function buildValidationView(
  issues: readonly ValidationIssue[] | undefined,
  categories: readonly Category[],
): ValidationView {
  if (!issues || issues.length === 0) return EMPTY_VALIDATION;

  const categoryTitleErrors = new Set<string>();
  const categoryEmptyErrors = new Set<string>();
  const questionTextErrors = new Map<string, Set<"question" | "answer">>();

  const categoryByIndex = new Map<number, Category>();
  categories.forEach((c, i) => categoryByIndex.set(i, c));

  for (const issue of issues) {
    const indexedTitle = /^categories\[(\d+)\]\.title$/.exec(issue.path);
    if (indexedTitle) {
      const idx = Number(indexedTitle[1]);
      const cat = categoryByIndex.get(idx);
      if (cat) {
        categoryTitleErrors.add(cat.stableId);
        continue;
      }
    }

    const emptyCategory = /^categories\.([^.]+)\.questions$/.exec(issue.path);
    if (emptyCategory) {
      const id = emptyCategory[1];
      if (id) {
        categoryEmptyErrors.add(id);
        continue;
      }
    }

    const questionField = /^question\.([^.]+)\.(question|answer)$/.exec(
      issue.path,
    );
    if (questionField) {
      const id = questionField[1];
      const field = questionField[2] as "question" | "answer";
      if (id) {
        const set = questionTextErrors.get(id) ?? new Set();
        set.add(field);
        questionTextErrors.set(id, set);
        continue;
      }
    }
  }

  return {
    hasBlockers: true,
    issues,
    categoryTitleErrors,
    categoryEmptyErrors,
    questionTextErrors,
  };
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
  const validation = useQuery(api.cms.validatePublishSection, {
    section: "faq",
  });
  const saveDraft = useMutation(api.cms.saveDraft);
  const publish = useMutation(api.cms.publishSection);
  const discard = useMutation(api.cms.discardDraft);

  const [localDraft, setLocalDraft] = useState<FaqSnapshot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const kickAutosaveRef = useRef<() => void>(() => {});
  const cancelAutosaveRef = useRef<() => void>(() => {});

  const source: FaqSnapshot | undefined =
    localDraft ??
    (section
      ? ((section.draftSnapshot ?? section.publishedSnapshot) as FaqSnapshot)
      : undefined);

  // ---------------------------------------------------------------------
  // Editing helpers
  // ---------------------------------------------------------------------

  const setCategories = useCallback(
    (categories: Category[]) => {
      if (!source) return;
      setInlineError(null);
      setLocalDraft({ categories });
      kickAutosaveRef.current();
    },
    [source],
  );

  const addCategory = useCallback(() => {
    if (!source) return;
    const stableId = newStableId("cat");
    setCategories([
      ...source.categories,
      {
        stableId,
        title: "",
        questions: [
          {
            stableId: newStableId("q"),
            question: "",
            answer: "",
          },
        ],
      },
    ]);
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(stableId);
      return next;
    });
  }, [setCategories, source]);

  const restoreDefaults = useCallback(() => {
    setCategories(
      FAQ_DEFAULTS.categories.map((c) => ({
        stableId: c.stableId,
        title: c.title,
        questions: c.questions.map((q) => ({ ...q })),
      })),
    );
    toast.success(
      "Default FAQ loaded. Tweak as needed, then publish to go live.",
    );
  }, [setCategories]);

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

  const moveCategory = useCallback(
    (index: number, dir: -1 | 1) => {
      if (!source) return;
      const j = index + dir;
      if (j < 0 || j >= source.categories.length) return;
      const next = [...source.categories];
      const a = next[index];
      const b = next[j];
      if (!a || !b) return;
      next[index] = b;
      next[j] = a;
      setCategories(next);
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
      setCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(categoryStableId);
        return next;
      });
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

  const moveQuestion = useCallback(
    (categoryStableId: string, index: number, dir: -1 | 1) => {
      if (!source) return;
      setCategories(
        source.categories.map((c) => {
          if (c.stableId !== categoryStableId) return c;
          const j = index + dir;
          if (j < 0 || j >= c.questions.length) return c;
          const next = [...c.questions];
          const a = next[index];
          const b = next[j];
          if (!a || !b) return c;
          next[index] = b;
          next[j] = a;
          return { ...c, questions: next };
        }),
      );
    },
    [setCategories, source],
  );

  const toggleCategoryCollapsed = useCallback((stableId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(stableId)) next.delete(stableId);
      else next.add(stableId);
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------
  // Autosave + publish/discard plumbing (matches About / Amenities)
  // ---------------------------------------------------------------------

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

  // Live validation lookup — paths from `collectFaqIssues` are mapped to
  // per-field markers so the user can fix issues without leaving context.
  // Indexed paths (`categories[i].title`) refer to the server draft order;
  // when there are unsaved local edits (including reorder), map those using
  // the section snapshot, not `source.categories`.
  const validationView = useMemo(() => {
    const categoriesForPaths =
      localDraft !== null && section
        ? ((section.draftSnapshot ?? section.publishedSnapshot) as FaqSnapshot)
            .categories
        : (source?.categories ?? []);
    return buildValidationView(
      validation && !validation.ok ? validation.issues : undefined,
      categoriesForPaths,
    );
  }, [validation, localDraft, section, source?.categories]);

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
    previewHref: "/preview#faq",
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

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  const totalQuestions = source.categories.reduce(
    (acc, c) => acc + c.questions.length,
    0,
  );

  return (
    <>
      {toolbarPortal}
      <div ref={handleEditorRef} className="space-y-8 pb-24">
        <FaqIntro
          categoryCount={source.categories.length}
          questionCount={totalQuestions}
        />

        {validationView.hasBlockers ? (
          <ValidationBanner issues={validationView.issues} />
        ) : null}

        {source.categories.length === 0 ? (
          <FaqEmptyState
            onAddCategory={addCategory}
            onRestoreDefaults={restoreDefaults}
          />
        ) : (
          <div className="space-y-8">
            {source.categories.map((cat, i) => (
              <CategoryCard
                key={cat.stableId}
                category={cat}
                index={i}
                total={source.categories.length}
                isCollapsed={collapsed.has(cat.stableId)}
                hasTitleError={validationView.categoryTitleErrors.has(
                  cat.stableId,
                )}
                hasEmptyError={validationView.categoryEmptyErrors.has(
                  cat.stableId,
                )}
                questionErrors={validationView.questionTextErrors}
                onToggle={() => toggleCategoryCollapsed(cat.stableId)}
                onMoveUp={() => moveCategory(i, -1)}
                onMoveDown={() => moveCategory(i, 1)}
                onRemove={() => removeCategory(cat.stableId)}
                onTitleChange={(t) => updateCategoryTitle(cat.stableId, t)}
                onAddQuestion={() => addQuestion(cat.stableId)}
                onUpdateQuestion={(qid, patch) =>
                  updateQuestion(cat.stableId, qid, patch)
                }
                onRemoveQuestion={(qid) => removeQuestion(cat.stableId, qid)}
                onMoveQuestion={(idx, dir) =>
                  moveQuestion(cat.stableId, idx, dir)
                }
              />
            ))}
          </div>
        )}

        {source.categories.length > 0 ? (
          <div className="flex flex-col items-stretch gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="body-text-small text-muted-foreground">
              Categories appear on the homepage in the order shown above.
              Re-order with the arrow buttons.
            </p>
            <Button
              type="button"
              variant="default"
              className="gap-1.5"
              onClick={addCategory}
            >
              <Plus className="size-4" aria-hidden />
              Add category
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FaqIntro({
  categoryCount,
  questionCount,
}: {
  categoryCount: number;
  questionCount: number;
}) {
  return (
    <header className="space-y-4 border-b border-border pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Homepage · Frequently Asked
          </p>
          <h2 className="headline-secondary text-foreground text-xl">
            Question Codex
          </h2>
        </div>
        <dl className="flex gap-6 text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <div>
            <dt>Categories</dt>
            <dd className="mt-0.5 text-2xl text-foreground tabular-nums">
              {pad(categoryCount)}
            </dd>
          </div>
          <div>
            <dt>Questions</dt>
            <dd className="mt-0.5 text-2xl text-foreground tabular-nums">
              {pad(questionCount)}
            </dd>
          </div>
        </dl>
      </div>
      <p className="body-text-small max-w-2xl text-muted-foreground">
        Group related questions under a category. Answers are plain text; line
        breaks are preserved on the public site. Drafts autosave — publish to
        push them live, or discard to revert to what visitors currently see.
      </p>
    </header>
  );
}

function ValidationBanner({
  issues,
}: {
  issues: readonly ValidationIssue[];
}) {
  return (
    <div
      role="status"
      className="rounded-md border border-destructive/40 bg-destructive/5 p-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-destructive"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-destructive">
            {issues.length === 1
              ? "Fix 1 issue before publishing:"
              : `Fix ${issues.length} issues before publishing:`}
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {issues.map((issue, i) => (
              <li key={`${issue.path}-${i}`} className="flex gap-2">
                <span
                  className="mt-1 size-1.5 shrink-0 rounded-full bg-destructive/60"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block font-mono text-[11px] tracking-tight text-muted-foreground/80">
                    {issue.path}
                  </span>
                  <span className="text-foreground">{issue.message}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function FaqEmptyState({
  onAddCategory,
  onRestoreDefaults,
}: {
  onAddCategory: () => void;
  onRestoreDefaults: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center">
      <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
        <Layers className="size-5" aria-hidden />
      </div>
      <h3 className="headline-secondary text-foreground text-lg">
        No categories yet
      </h3>
      <p className="body-text-small mx-auto mt-2 max-w-md text-muted-foreground">
        Categories group related questions on the homepage. Start with the
        bundled defaults or build your own from scratch.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
        <Button
          type="button"
          variant="default"
          className="gap-1.5"
          onClick={onRestoreDefaults}
        >
          <RotateCcw className="size-4" aria-hidden />
          Load default FAQ
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={onAddCategory}
        >
          <Plus className="size-4" aria-hidden />
          Start blank
        </Button>
      </div>
    </div>
  );
}

interface CategoryCardProps {
  readonly category: Category;
  readonly index: number;
  readonly total: number;
  readonly isCollapsed: boolean;
  readonly hasTitleError: boolean;
  readonly hasEmptyError: boolean;
  readonly questionErrors: ReadonlyMap<
    string,
    ReadonlySet<"question" | "answer">
  >;
  readonly onToggle: () => void;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
  readonly onRemove: () => void;
  readonly onTitleChange: (value: string) => void;
  readonly onAddQuestion: () => void;
  readonly onUpdateQuestion: (
    questionId: string,
    patch: Partial<{ question: string; answer: string }>,
  ) => void;
  readonly onRemoveQuestion: (questionId: string) => void;
  readonly onMoveQuestion: (index: number, dir: -1 | 1) => void;
}

function CategoryCard({
  category,
  index,
  total,
  isCollapsed,
  hasTitleError,
  hasEmptyError,
  questionErrors,
  onToggle,
  onMoveUp,
  onMoveDown,
  onRemove,
  onTitleChange,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onMoveQuestion,
}: CategoryCardProps) {
  const titleId = `faq-cat-title-${category.stableId}`;
  const positionLabel = `${pad(index + 1)} / ${pad(total)}`;
  const questionCount = category.questions.length;

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "rounded-lg border bg-card shadow-sm transition-colors",
        hasTitleError || hasEmptyError
          ? "border-destructive/50"
          : "border-border",
      )}
    >
      <header className="flex flex-wrap items-start gap-3 border-b border-border/70 p-5 sm:flex-nowrap">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-controls={`faq-cat-body-${category.stableId}`}
          className="mt-0.5 flex shrink-0 items-center gap-2 rounded-sm px-1 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <span className="tabular-nums">CATEGORY {positionLabel}</span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              isCollapsed && "-rotate-90",
            )}
            aria-hidden
          />
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor={titleId} className="sr-only">
            Category title
          </label>
          <Input
            id={titleId}
            value={category.title}
            placeholder="Category title (e.g. Studio Sessions & Recording)"
            aria-invalid={hasTitleError || undefined}
            className={cn(
              "h-11 text-base font-medium",
              hasTitleError && "border-destructive",
            )}
            onChange={(e) => onTitleChange(e.target.value)}
          />
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {questionCount === 1
                ? "1 question"
                : `${questionCount} questions`}
            </span>
            {hasTitleError ? (
              <span className="font-medium text-destructive">
                Title is required
              </span>
            ) : null}
            {hasEmptyError ? (
              <span className="font-medium text-destructive">
                Add at least one question
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Move "${category.title || "category"}" up`}
            disabled={index === 0}
            onClick={onMoveUp}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Move "${category.title || "category"}" down`}
            disabled={index === total - 1}
            onClick={onMoveDown}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Remove "${category.title || "category"}"`}
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </header>

      {isCollapsed ? null : (
        <div
          id={`faq-cat-body-${category.stableId}`}
          className="space-y-4 p-5"
        >
          {category.questions.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              This category is empty. Add at least one question to publish.
            </p>
          ) : (
            <ol className="space-y-4">
              {category.questions.map((q, qi) => (
                <QuestionRow
                  key={q.stableId}
                  question={q}
                  index={qi}
                  total={category.questions.length}
                  errors={questionErrors.get(q.stableId)}
                  onUpdate={(patch) => onUpdateQuestion(q.stableId, patch)}
                  onRemove={() => onRemoveQuestion(q.stableId)}
                  onMoveUp={() => onMoveQuestion(qi, -1)}
                  onMoveDown={() => onMoveQuestion(qi, 1)}
                />
              ))}
            </ol>
          )}

          <div className="pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={onAddQuestion}
            >
              <Plus className="size-3.5" aria-hidden />
              Add question
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

interface QuestionRowProps {
  readonly question: Question;
  readonly index: number;
  readonly total: number;
  readonly errors: ReadonlySet<"question" | "answer"> | undefined;
  readonly onUpdate: (
    patch: Partial<{ question: string; answer: string }>,
  ) => void;
  readonly onRemove: () => void;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
}

function QuestionRow({
  question,
  index,
  total,
  errors,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: QuestionRowProps) {
  const questionId = `faq-q-${question.stableId}`;
  const answerId = `faq-a-${question.stableId}`;
  const questionInvalid = errors?.has("question") ?? false;
  const answerInvalid = errors?.has("answer") ?? false;

  return (
    <li
      className={cn(
        "rounded-md border p-4 transition-colors",
        questionInvalid || answerInvalid
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-muted/30",
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          <CircleHelp className="size-3" aria-hidden />
          <span className="tabular-nums">Q · {pad(index + 1)}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Move question ${index + 1} up`}
            disabled={index === 0}
            onClick={onMoveUp}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Move question ${index + 1} down`}
            disabled={index === total - 1}
            onClick={onMoveDown}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Remove question ${index + 1}`}
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <FieldLabel htmlFor={questionId} required invalid={questionInvalid}>
          Question
        </FieldLabel>
        <Input
          id={questionId}
          value={question.question}
          placeholder="What should I bring to my recording session?"
          aria-invalid={questionInvalid || undefined}
          className={cn("h-10", questionInvalid && "border-destructive")}
          onChange={(e) => onUpdate({ question: e.target.value })}
        />
        {questionInvalid ? (
          <p className="text-xs text-destructive">Question text is required.</p>
        ) : null}

        <FieldLabel htmlFor={answerId} required invalid={answerInvalid}>
          Answer
        </FieldLabel>
        <Textarea
          id={answerId}
          value={question.answer}
          placeholder="Plain text. Line breaks are preserved on the public site."
          aria-invalid={answerInvalid || undefined}
          className={cn(
            "min-h-[140px] resize-y",
            answerInvalid && "border-destructive",
          )}
          onChange={(e) => onUpdate({ answer: e.target.value })}
        />
        {answerInvalid ? (
          <p className="text-xs text-destructive">Answer text is required.</p>
        ) : null}
      </div>
    </li>
  );
}

function FieldLabel({
  htmlFor,
  required,
  invalid,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-xs font-medium tracking-wide",
        invalid ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {children}
      {required ? (
        <span aria-hidden className="ml-0.5 text-destructive/80">
          *
        </span>
      ) : null}
    </label>
  );
}
