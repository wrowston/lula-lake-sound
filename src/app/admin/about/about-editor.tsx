"use client";

/**
 * About admin editor (INF-98).
 *
 * A WYSIWYG rich text editor (Tiptap) styled like the public About page.
 * Output is serialized to HTML
 * and stored in `aboutContentValidator.bodyHtml`; the old paragraph/heading
 * block array (`body`) is still accepted by the schema for back-compat and
 * is migrated to HTML transparently when the user first edits.
 *
 * Editor features (via Tiptap `StarterKit` + `Link`):
 *   - Bold, italic, strike, inline code
 *   - Headings H1 / H2 / H3
 *   - Blockquote
 *   - Bullet + ordered lists, horizontal rule
 *   - Links (restricted to http/https/mailto/tel protocols)
 *   - Markdown shortcuts (e.g. `## `, `**bold**`, `> `, `- `)
 *   - Undo / redo
 *
 * Safety: Tiptap only emits nodes/marks from its fixed schema, and Link
 * protocols are restricted in `rich-text-editor.tsx`.
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
  memo,
  startTransition,
} from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Plus, Trash2, X } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SiteVisibilityRow } from "@/components/admin/site-visibility-row";
import { cn } from "@/lib/utils";
import { convexMutationEffect } from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { useRegisterCmsEditor } from "@/components/admin/cms-workspace";
import { useAutosaveDraft } from "@/lib/use-autosave-draft";
import {
  mergeAutosaveStatus,
  useMarketingFeatureFlagsAdmin,
} from "@/lib/use-marketing-feature-flags-admin";
import { RichTextEditor, type RichTextEditorHandle } from "./rich-text-editor";

type AboutBlock = { type: "paragraph" | "heading"; text: string };

/** Mirrors CMS team rows; `storageId` set after upload. */
export type AboutTeamMemberRow = {
  id: string;
  name: string;
  title: string;
  storageId?: Id<"_storage">;
};

type AboutContent = {
  /**
   * INF-46 follow-up — storage id of the hero image. The owner picks from
   * the existing studio gallery; we intentionally reuse already-uploaded
   * blobs rather than adding a bespoke upload surface here.
   */
  heroImageStorageId?: Id<"_storage">;
  heroTitle: string;
  heroSubtitle?: string;
  /** Rich-text body (Tiptap HTML). Preferred over legacy `body` blocks. */
  bodyHtml?: string;
  /** Kept for back-compat with pre-INF-98 stored rows. Not edited anymore. */
  body: AboutBlock[];
  /** INF-46 editorial pull quote rendered below the headshots. */
  pullQuote?: string;
  highlights?: string[];
  seoTitle?: string;
  seoDescription?: string;
  teamMembers: AboutTeamMemberRow[];
};

/** Keep in sync with `MAX_ABOUT_TEAM_MEMBERS` in `convex/aboutTeamStorage.ts`. */
const MAX_TEAM_MEMBERS = 20;

/**
 * Debounce HTML for the publish-issues panel so typing the body doesn't
 * force full-form validation work on every pause.
 */
const ISSUES_BODY_HTML_DEBOUNCE_MS = 1500;

/** SEO character guidance — typical search-engine display limits. */
const SEO_TITLE_RECOMMENDED = 60;
const SEO_DESCRIPTION_RECOMMENDED = 160;

const fieldClass =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/50";

export function trimToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : value;
}

/**
 * Convert legacy paragraph/heading block arrays to Tiptap-compatible HTML
 * so existing rows upgrade cleanly the first time the owner edits them.
 */
export function blocksToHtml(blocks: AboutBlock[]): string {
  if (blocks.length === 0) return "";
  return blocks
    .map((b) => {
      const text = escapeHtml(b.text);
      return b.type === "heading" ? `<h2>${text}</h2>` : `<p>${text}</p>`;
    })
    .join("");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

async function uploadHeadshotToConvex(
  uploadUrl: string,
  file: File,
): Promise<Id<"_storage">> {
  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as {
            storageId: Id<"_storage">;
          };
          resolve(parsed.storageId);
        } catch {
          reject(new Error("Upload succeeded but response was malformed."));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status}).`));
      }
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload.")),
    );
    xhr.send(file);
  });
}

/** Normalize whatever came off the wire to the editor shape. */
export function toAboutContent(raw: unknown): AboutContent {
  const r = (raw ?? {}) as Partial<AboutContent> & Record<string, unknown>;
  const body: AboutBlock[] = Array.isArray(r.body)
    ? r.body
        .filter(
          (b): b is AboutBlock =>
            typeof b === "object" &&
            b !== null &&
            typeof (b as AboutBlock).text === "string" &&
            ((b as AboutBlock).type === "paragraph" ||
              (b as AboutBlock).type === "heading"),
        )
        .map((b) => ({ type: b.type, text: b.text }))
    : [];
  const storedHtml =
    typeof r.bodyHtml === "string" && r.bodyHtml.trim().length > 0
      ? r.bodyHtml
      : undefined;
  const teamMembers: AboutTeamMemberRow[] = Array.isArray(r.teamMembers)
    ? (r.teamMembers as unknown[])
        .filter(
          (m): m is AboutTeamMemberRow =>
            typeof m === "object" &&
            m !== null &&
            typeof (m as AboutTeamMemberRow).id === "string" &&
            typeof (m as AboutTeamMemberRow).name === "string" &&
            typeof (m as AboutTeamMemberRow).title === "string",
        )
        .map((m) => ({
          id: m.id,
          name: m.name,
          title: m.title,
          ...(m.storageId !== undefined ? { storageId: m.storageId } : {}),
        }))
    : [];

  return {
    heroImageStorageId:
      typeof r.heroImageStorageId === "string" &&
      r.heroImageStorageId.length > 0
        ? (r.heroImageStorageId as Id<"_storage">)
        : undefined,
    heroTitle: typeof r.heroTitle === "string" ? r.heroTitle : "",
    heroSubtitle:
      typeof r.heroSubtitle === "string" ? r.heroSubtitle : undefined,
    // Seed `bodyHtml` from legacy blocks so the editor shows existing content
    // even on rows that haven't been re-saved since INF-98.
    bodyHtml: storedHtml ?? (body.length > 0 ? blocksToHtml(body) : undefined),
    body,
    pullQuote:
      typeof r.pullQuote === "string" && r.pullQuote.trim().length > 0
        ? r.pullQuote
        : undefined,
    highlights: Array.isArray(r.highlights)
      ? (r.highlights as unknown[]).filter(
          (h): h is string => typeof h === "string",
        )
      : undefined,
    seoTitle: typeof r.seoTitle === "string" ? r.seoTitle : undefined,
    seoDescription:
      typeof r.seoDescription === "string" ? r.seoDescription : undefined,
    teamMembers,
  };
}

/**
 * Publish-validation mirror (kept in sync with `collectAboutIssues` in
 * `convex/cmsPublishHelpers.ts`) so blocking issues surface live.
 */
export function collectAboutIssues(
  draft: AboutContent,
): { path: string; message: string }[] {
  const issues: { path: string; message: string }[] = [];
  if (draft.heroTitle.trim().length === 0) {
    issues.push({
      path: "heroTitle",
      message: "Hero title is required to publish.",
    });
  }
  const richBodyLen = draft.bodyHtml
    ? htmlToPlainText(draft.bodyHtml).length
    : 0;
  if (richBodyLen === 0) {
    issues.push({
      path: "bodyHtml",
      message: "Body content is required to publish.",
    });
  }
  (draft.highlights ?? []).forEach((h, i) => {
    if (h.trim().length === 0) {
      const n = i + 1;
      issues.push({
        path: `highlights[${i}]`,
        message: `Highlight ${n} cannot be empty.`,
      });
    }
  });

  const team = draft.teamMembers;
  if (team.length > 0) {
    if (team.length > MAX_TEAM_MEMBERS) {
      issues.push({
        path: "teamMembers",
        message: `At most ${MAX_TEAM_MEMBERS} team members are allowed.`,
      });
    }
    for (let i = 0; i < team.length; i++) {
      const base = `teamMembers[${i}]`;
      const who = `Team member ${i + 1}`;
      if (team[i].name.trim().length === 0) {
        issues.push({
          path: `${base}.name`,
          message: `${who} needs a name.`,
        });
      }
      if (team[i].title.trim().length === 0) {
        issues.push({
          path: `${base}.title`,
          message: `${who} needs a title.`,
        });
      }
      if (team[i].storageId === undefined) {
        issues.push({
          path: `${base}.storageId`,
          message: `${who} needs a headshot image to publish.`,
        });
      }
    }
  }

  return issues;
}

const AboutIssuesPanel = memo(function AboutIssuesPanel({
  base,
  debouncedBodyHtml,
  bodyDirty,
}: {
  readonly base: AboutContent;
  readonly debouncedBodyHtml: string | null;
  readonly bodyDirty: boolean;
}) {
  const issuesSource = useMemo((): AboutContent => {
    if (!bodyDirty) return base;
    return {
      ...base,
      bodyHtml: debouncedBodyHtml ?? base.bodyHtml ?? "",
      body: [],
    };
  }, [base, bodyDirty, debouncedBodyHtml]);

  const issues = useMemo(
    () => collectAboutIssues(issuesSource),
    [issuesSource],
  );

  if (issues.length === 0) return null;

  return (
    <div
      role="status"
      className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm"
    >
      <p className="mb-1 font-medium text-amber-700 dark:text-amber-300">
        {issues.length === 1
          ? "1 issue blocks publish"
          : `${issues.length} issues block publish`}
      </p>
      <ul className="list-disc space-y-0.5 pl-5 text-amber-800/90 dark:text-amber-200/90">
        {issues.slice(0, 6).map((issue, i) => (
          <li key={`${issue.path}-${i}`}>{issue.message}</li>
        ))}
        {issues.length > 6 ? (
          <li className="text-amber-900/70 dark:text-amber-100/70">
            …and {issues.length - 6} more.
          </li>
        ) : null}
      </ul>
    </div>
  );
});

export function AboutEditor() {
  return (
    <>
      <AuthLoading>
        <p className="body-text text-muted-foreground">Authenticating…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="body-text text-muted-foreground">
          Sign in to edit the About page.
        </p>
      </Unauthenticated>

      <Authenticated>
        <AboutForm />
      </Authenticated>
    </>
  );
}

function AboutForm() {
  const { user } = useUser();
  const section = useQuery(api.cms.getSection, { section: "about" });
  const saveDraft = useMutation(api.cms.saveDraft);
  const publish = useMutation(api.cms.publishSection);
  const discard = useMutation(api.cms.discardDraft);
  const generateUploadUrl = useMutation(api.admin.photos.generateUploadUrl);

  const [localDraft, setLocalDraft] = useState<AboutContent | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const kickAutosaveRef = useRef<() => void>(() => {});
  const cancelAutosaveRef = useRef<() => void>(() => {});
  /** Body lives in Tiptap; this flag drives autosave + merged validation. */
  const [bodyDirty, setBodyDirty] = useState(false);
  /** Debounced HTML for publish-issue panel (avoids parent re-render per key). */
  const [debouncedBodyHtml, setDebouncedBodyHtml] = useState<string | null>(
    null,
  );
  const bodyRef = useRef<RichTextEditorHandle>(null);
  const issuesBodyHtmlDebounceRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const {
    data: featureFlagsCms,
    source: featureFlagsSource,
    isLoading: featureFlagsLoading,
    hasFFLocalEdits,
    hasFFDraftOnServer,
    ffAutosaveStatus,
    flushFFAutosave,
    cancelFFAutosave: cancelFFAutosave,
    ffOnUnmount,
    setAboutPage,
    runPublishFF,
    runDiscardFF,
    clearFFLocal,
  } = useMarketingFeatureFlagsAdmin(busy !== null);

  const serverContent: AboutContent | undefined = useMemo(() => {
    if (!section) return undefined;
    return toAboutContent(section.draftSnapshot ?? section.publishedSnapshot);
  }, [section]);

  const base: AboutContent | undefined = localDraft ?? serverContent;

  const initialHtml = base?.bodyHtml ?? "";

  const setHeroImageStorageId = useCallback(
    (value: Id<"_storage"> | undefined) => {
      setInlineError(null);
      setLocalDraft((prev) => {
        const current = prev ?? serverContent;
        if (!current) return prev;
        return { ...current, heroImageStorageId: value };
      });
      kickAutosaveRef.current();
    },
    [serverContent],
  );

  const setHeroTitle = useCallback(
    (value: string) => {
      setInlineError(null);
      setLocalDraft((prev) => {
        const current = prev ?? serverContent;
        if (!current) return prev;
        return { ...current, heroTitle: value };
      });
      kickAutosaveRef.current();
    },
    [serverContent],
  );

  const setPullQuote = useCallback(
    (value: string) => {
      setInlineError(null);
      setLocalDraft((prev) => {
        const current = prev ?? serverContent;
        if (!current) return prev;
        return { ...current, pullQuote: trimToUndefined(value) };
      });
      kickAutosaveRef.current();
    },
    [serverContent],
  );

  const setHeroSubtitle = useCallback(
    (value: string) => {
      setInlineError(null);
      setLocalDraft((prev) => {
        const current = prev ?? serverContent;
        if (!current) return prev;
        return { ...current, heroSubtitle: trimToUndefined(value) };
      });
      kickAutosaveRef.current();
    },
    [serverContent],
  );

  const setSeoTitle = useCallback(
    (value: string) => {
      setInlineError(null);
      setLocalDraft((prev) => {
        const current = prev ?? serverContent;
        if (!current) return prev;
        return { ...current, seoTitle: trimToUndefined(value) };
      });
      kickAutosaveRef.current();
    },
    [serverContent],
  );

  const setSeoDescription = useCallback(
    (value: string) => {
      setInlineError(null);
      setLocalDraft((prev) => {
        const current = prev ?? serverContent;
        if (!current) return prev;
        return { ...current, seoDescription: trimToUndefined(value) };
      });
      kickAutosaveRef.current();
    },
    [serverContent],
  );

  const setHighlights = useCallback(
    (next: string[]) => {
      setInlineError(null);
      setLocalDraft((prev) => {
        const current = prev ?? serverContent;
        if (!current) return prev;
        return {
          ...current,
          highlights: next.length > 0 ? next : undefined,
        };
      });
      kickAutosaveRef.current();
    },
    [serverContent],
  );

  const setTeamMembers = useCallback(
    (next: AboutTeamMemberRow[]) => {
      setInlineError(null);
      setLocalDraft((prev) => {
        const current = prev ?? serverContent;
        if (!current) return prev;
        return { ...current, teamMembers: next };
      });
      kickAutosaveRef.current();
    },
    [serverContent],
  );

  const [uploadBusy, setUploadBusy] = useState<string | null>(null);

  const clearLocalBodyUiState = useCallback(() => {
    setBodyDirty(false);
    setDebouncedBodyHtml(null);
    if (issuesBodyHtmlDebounceRef.current !== null) {
      clearTimeout(issuesBodyHtmlDebounceRef.current);
      issuesBodyHtmlDebounceRef.current = null;
    }
  }, []);

  const hasAboutLocalEdits = localDraft !== null || bodyDirty;
  const hasDraftOnServer =
    (section?.hasDraftChanges ?? false) || hasFFDraftOnServer;
  /** Shown in toolbar: any unpublished edits (about body or feature flags). */
  const hasLocalEdits = hasAboutLocalEdits || hasFFLocalEdits;

  const {
    status: autosaveStatus,
    flush: flushAutosave,
    kick: kickAutosave,
    cancel: cancelAutosave,
    onUnmount: autosaveOnUnmount,
  } = useAutosaveDraft({
    isDirty: hasAboutLocalEdits && base !== undefined,
    pauseWhen: busy !== null,
    saveEffect: () => {
        const contentBase = (localDraft ?? serverContent)!;
        const bodyHtml = bodyDirty
          ? (bodyRef.current?.getHTML() ?? "")
          : (contentBase.bodyHtml ?? "");
        const bodyBlocks = bodyDirty ? [] : (contentBase.body ?? []);
        return convexMutationEffect(() =>
          saveDraft({
            section: "about",
            content: {
              ...(contentBase.heroImageStorageId !== undefined
                ? { heroImageStorageId: contentBase.heroImageStorageId }
                : {}),
              heroTitle: contentBase.heroTitle,
              heroSubtitle: contentBase.heroSubtitle,
              bodyHtml,
              body: bodyBlocks,
              pullQuote: contentBase.pullQuote,
              highlights: contentBase.highlights,
              seoTitle: contentBase.seoTitle,
              seoDescription: contentBase.seoDescription,
              teamMembers: (contentBase.teamMembers ?? []).map((m) => ({
                id: m.id,
                name: m.name,
                title: m.title,
                ...(m.storageId !== undefined ? { storageId: m.storageId } : {}),
              })),
            },
          }),
        );
      },
      onSaved: () => {
        setLocalDraft(null);
        clearLocalBodyUiState();
      },
    });
  kickAutosaveRef.current = kickAutosave;
  cancelAutosaveRef.current = cancelAutosave;

  const handleBodyDirty = useCallback(() => {
    setBodyDirty(true);
    kickAutosave();
    if (issuesBodyHtmlDebounceRef.current !== null) {
      clearTimeout(issuesBodyHtmlDebounceRef.current);
    }
    issuesBodyHtmlDebounceRef.current = setTimeout(() => {
      issuesBodyHtmlDebounceRef.current = null;
      startTransition(() => {
        setDebouncedBodyHtml(bodyRef.current?.getHTML() ?? "");
      });
    }, ISSUES_BODY_HTML_DEBOUNCE_MS);
  }, [kickAutosave]);

  const hasAboutDraftOnServer = section?.hasDraftChanges ?? false;

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
    cancelAutosaveRef.current();
    cancelFFAutosave();
    setInlineError(null);
    const publishedHtml =
      section !== undefined
        ? (toAboutContent(section.publishedSnapshot).bodyHtml ?? "")
        : "";
    if (hasAboutDraftOnServer) {
      setBusy("Discarding…");
      const outcome = await runAdminEffect(
        convexMutationEffect(() => discard({ section: "about" })),
        { onErrorMessage: setInlineError },
      );
      setBusy(null);
      if (outcome === undefined) {
        return false;
      }
    }
    if (hasFFDraftOnServer) {
      setBusy("Discarding…");
      const outcome = await runAdminEffect(runDiscardFF(), {
        onErrorMessage: setInlineError,
      });
      setBusy(null);
      if (outcome === undefined) {
        return false;
      }
    }
    setLocalDraft(null);
    clearFFLocal();
    clearLocalBodyUiState();
    bodyRef.current?.reset(publishedHtml);
    toast.success(
      hasAboutDraftOnServer || hasFFDraftOnServer
        ? "Draft discarded. The editor now matches the published site."
        : "Unsaved changes discarded.",
    );
    return true;
  }, [
    clearLocalBodyUiState,
    discard,
    hasAboutDraftOnServer,
    hasFFDraftOnServer,
    runDiscardFF,
    clearFFLocal,
    cancelFFAutosave,
    section,
  ]);

  const mergedPublishedAt = useMemo((): number | null => {
    const a = section?.publishedAt;
    const b = featureFlagsCms?.publishedAt;
    if (a == null && b == null) return null;
    if (a == null) return b ?? null;
    if (b == null) return a;
    return Math.max(a, b);
  }, [section?.publishedAt, featureFlagsCms?.publishedAt]);

  const combinedAutosaveStatus = mergeAutosaveStatus(
    autosaveStatus,
    ffAutosaveStatus,
  );

  const publishedByLabel =
    section?.publishedBy && user?.id === section.publishedBy ? "You" : undefined;

  const handlePublish = useCallback(() => {
    if (!base) return;
    const liveBody = bodyDirty
      ? (bodyRef.current?.getHTML() ?? "")
      : (base.bodyHtml ?? "");
    const publishSnapshot: AboutContent = {
      ...base,
      bodyHtml: liveBody,
      body: [],
    };
    const publishIssues = collectAboutIssues(publishSnapshot);
    if (publishIssues.length > 0) {
      setInlineError("Fix the blocking issues above before publishing.");
      return;
    }
    void (async () => {
      cancelAutosaveRef.current();
      cancelFFAutosave();
      if (hasAboutLocalEdits) {
        const flushed = await flushAutosave();
        if (!flushed) return;
      }
      if (hasFFLocalEdits) {
        const flushed = await flushFFAutosave();
        if (!flushed) return;
      }
      setInlineError(null);
      setBusy("Publishing…");
      const aboutOutcome = await runAdminEffect(
        convexMutationEffect(() => publish({ section: "about" })),
        { onErrorMessage: setInlineError },
      );
      if (aboutOutcome === undefined) {
        setBusy(null);
        return;
      }
      setLocalDraft(null);
      clearLocalBodyUiState();
      const ffOutcome = await runAdminEffect(runPublishFF(), {
        onErrorMessage: setInlineError,
      });
      setBusy(null);
      if (ffOutcome !== undefined) {
        clearFFLocal();
        toast.success("Changes published.");
      }
    })();
  }, [
    base,
    bodyDirty,
    cancelFFAutosave,
    clearFFLocal,
    clearLocalBodyUiState,
    flushAutosave,
    flushFFAutosave,
    hasAboutLocalEdits,
    hasFFLocalEdits,
    publish,
    runPublishFF,
  ]);

  /**
   * Composite flush awaited by the sidebar nav guard. Silently persists any
   * in-memory About edits and marketing-flag edits before navigation so the
   * user never loses a one-shot change (e.g. a freshly-toggled switch within
   * the 1s autosave debounce window).
   */
  const flushAllAutosaves = useCallback(async (): Promise<boolean> => {
    if (hasAboutLocalEdits) {
      const ok = await flushAutosave();
      if (!ok) return false;
    }
    if (hasFFLocalEdits) {
      const ok = await flushFFAutosave();
      if (!ok) return false;
    }
    return true;
  }, [flushAutosave, flushFFAutosave, hasAboutLocalEdits, hasFFLocalEdits]);

  const { toolbarPortal, editorRef } = useRegisterCmsEditor({
    section: "about",
    sectionLabel: "the About page",
    hasDraftOnServer,
    hasLocalEdits,
    publishedAt: mergedPublishedAt,
    publishedByLabel,
    busy,
    autosaveStatus: combinedAutosaveStatus,
    inlineError,
    previewHref: "/preview/about",
    onPublish: handlePublish,
    onDiscardConfirm: handleDiscardConfirm,
    flush: flushAllAutosaves,
  });

  // The wrapping `<div>` needs a *stable* ref callback. An inline arrow is a
  // new function on every render, which makes React detach (call old ref with
  // `null`) and reattach (call new ref with the element) every time. The
  // detach path runs `dispose()` inside `useAutosaveDraft`, clearing the
  // pending debounce timer — so a one-shot edit (e.g. flipping the visibility
  // toggle) never gets to fire its autosave because the next render kills the
  // timer before the 1s debounce elapses. Wrapping in `useCallback` keeps the
  // ref identity stable so detach only happens at real unmount.
  const handleEditorRef = useCallback(
    (el: HTMLDivElement | null) => {
      autosaveOnUnmount(el);
      ffOnUnmount(el);
      editorRef(el);
    },
    [autosaveOnUnmount, ffOnUnmount, editorRef],
  );

  if (section === undefined || featureFlagsLoading) {
    return (
      <p className="body-text text-muted-foreground">Loading About page…</p>
    );
  }

  if (!base) {
    return (
      <p className="body-text text-muted-foreground">
        No About content available.
      </p>
    );
  }

  const seoTitleValue = base.seoTitle ?? "";
  const seoDescriptionValue = base.seoDescription ?? "";

  return (
    <div className="space-y-8 pb-24" ref={handleEditorRef}>
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="label-text text-muted-foreground">Site visibility</p>
            <SiteVisibilityRow
              id="ff-about-embedded"
              title="About page visibility"
              description={
                <>
                  When off, <code>/about</code> returns 404 and the About nav
                  link is hidden. Publish to apply.
                </>
              }
              checked={featureFlagsSource?.aboutPage ?? false}
              onCheckedChange={setAboutPage}
              disabled={busy !== null}
            />
          </div>

          <fieldset className="space-y-3">
            <legend className="label-text text-muted-foreground">Hero</legend>
            <label className="block space-y-1">
              <span className="body-text-small text-muted-foreground">
                Title
              </span>
              <Input
                type="text"
                value={base.heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="About Lula Lake Sound"
                aria-invalid={base.heroTitle.trim().length === 0}
                className="text-foreground placeholder:text-muted-foreground"
              />
            </label>
            <label className="block space-y-1">
              <span className="body-text-small text-muted-foreground">
                Subtitle (optional)
              </span>
              <Textarea
                rows={2}
                value={base.heroSubtitle ?? ""}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="A creative space for music production and recording."
                className="text-foreground placeholder:text-muted-foreground"
              />
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="label-text text-muted-foreground">
              Hero image
            </legend>
            <p className="body-text-small text-muted-foreground">
              Pick a photo from the studio gallery or upload a bespoke
              image just for this page. Gallery uploads are managed from
              the{" "}
              <a
                href="/admin/photos"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Photos
              </a>{" "}
              admin; bespoke uploads won&rsquo;t appear in the public
              gallery.
            </p>
            <HeroImagePicker
              selectedStorageId={base.heroImageStorageId}
              onChange={setHeroImageStorageId}
              generateUploadUrl={generateUploadUrl}
              uploadBusyKey={uploadBusy}
              setUploadBusyKey={setUploadBusy}
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="label-text text-muted-foreground">Body</legend>
            <p className="body-text-small text-muted-foreground">
              Rich text — toolbar or markdown shortcuts (
              <code className="rounded bg-muted px-1">## </code>,{" "}
              <code className="rounded bg-muted px-1">**bold**</code>,{" "}
              <code className="rounded bg-muted px-1">*italic*</code>,{" "}
              <code className="rounded bg-muted px-1">&gt; </code>,{" "}
              <code className="rounded bg-muted px-1">- </code>).
            </p>
            <RichTextEditor
              ref={bodyRef}
              initialHtml={initialHtml}
              placeholder="Tell the studio's story…"
              onDirty={handleBodyDirty}
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="label-text text-muted-foreground">
              Pull quote
            </legend>
            <p className="body-text-small text-muted-foreground">
              Editorial callout rendered below the text body.
              Leave blank to hide the quote block.
            </p>
            <Textarea
              rows={2}
              value={base.pullQuote ?? ""}
              onChange={(e) => setPullQuote(e.target.value)}
              placeholder="The mountain doesn't rush. Neither should the music."
              className="text-foreground placeholder:text-muted-foreground"
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="label-text text-muted-foreground">Team</legend>
            <p className="body-text-small text-muted-foreground">
              Add people with a headshot, name, and title. Images are stored in
              file storage (same limits as the gallery).
            </p>
            <TeamMembersEditor
              members={base.teamMembers}
              onChange={setTeamMembers}
              generateUploadUrl={generateUploadUrl}
              uploadBusyKey={uploadBusy}
              setUploadBusyKey={setUploadBusy}
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="label-text text-muted-foreground">
              Highlights (optional)
            </legend>
            <p className="body-text-small text-muted-foreground">
              Short bulleted callouts — e.g. key studio facts.
            </p>
            <HighlightsEditor
              highlights={base.highlights ?? []}
              onChange={setHighlights}
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="label-text text-muted-foreground">SEO</legend>
            <p className="body-text-small text-muted-foreground">
              Leave blank to fall back to the site-wide settings. Recommended
              lengths follow Google snippet limits.
            </p>
            <label className="block space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="body-text-small text-muted-foreground">
                  SEO title
                </span>
                <CharCounter
                  value={seoTitleValue}
                  recommended={SEO_TITLE_RECOMMENDED}
                />
              </div>
              <Input
                type="text"
                value={seoTitleValue}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="About | Lula Lake Sound"
                className="text-foreground placeholder:text-muted-foreground"
              />
            </label>
            <label className="block space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="body-text-small text-muted-foreground">
                  SEO description
                </span>
                <CharCounter
                  value={seoDescriptionValue}
                  recommended={SEO_DESCRIPTION_RECOMMENDED}
                />
              </div>
              <textarea
                rows={3}
                value={seoDescriptionValue}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="A creative recording studio outside Chattanooga, TN…"
                className={fieldClass}
              />
            </label>
          </fieldset>

          <AboutIssuesPanel
            base={base}
            debouncedBodyHtml={debouncedBodyHtml}
            bodyDirty={bodyDirty}
          />
      </div>
      {toolbarPortal}
    </div>
  );
}

interface HeroImagePickerProps {
  readonly selectedStorageId: Id<"_storage"> | undefined;
  readonly onChange: (storageId: Id<"_storage"> | undefined) => void;
  readonly generateUploadUrl: () => Promise<{ uploadUrl: string }>;
  readonly uploadBusyKey: string | null;
  readonly setUploadBusyKey: (key: string | null) => void;
}

/**
 * Inline picker for the About hero image.
 *
 * The owner can either pick a photo from the studio gallery (sourced from
 * `api.admin.photos.listDraftPhotos` so unpublished uploads are also
 * selectable) or upload a bespoke image just for the About page that
 * intentionally does NOT land in the public gallery. Both cases resolve to
 * a Convex `_storage` id, so the public About page renders them the same
 * way via `storage.getUrl`.
 *
 * When the currently selected id isn't a gallery photo we fall back to a
 * direct URL lookup (`api.admin.about.getHeroImageUrl`) so the thumbnail
 * still renders. Only when the underlying blob has been deleted (URL
 * resolves to `null`) do we surface a recoverable warning.
 */
const HERO_IMAGE_MAX_BYTES = 50 * 1024 * 1024;
const HERO_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

type GalleryPickerPhoto = NonNullable<
  ReturnType<typeof useQuery<typeof api.admin.photos.listDraftPhotos>>
>["photos"][number] & { url: string };

const HeroImagePicker = memo(function HeroImagePicker({
  selectedStorageId,
  onChange,
  generateUploadUrl,
  uploadBusyKey,
  setUploadBusyKey,
}: HeroImagePickerProps) {
  const draft = useQuery(api.admin.photos.listDraftPhotos);

  const photos = useMemo<GalleryPickerPhoto[]>(
    () =>
      (draft?.photos ?? []).filter(
        (p): p is GalleryPickerPhoto =>
          typeof p.url === "string" && p.url.length > 0,
      ),
    [draft],
  );

  const selectedInGallery = useMemo(
    () => photos.find((p) => p.storageId === selectedStorageId),
    [photos, selectedStorageId],
  );

  // Resolve a URL for bespoke (non-gallery) hero uploads so we can still
  // show a preview. Skipped when the selected id is already in the gallery
  // list (we reuse the gallery-provided URL) or nothing is selected.
  const bespokeUrl = useQuery(
    api.admin.about.getHeroImageUrl,
    selectedStorageId !== undefined && !selectedInGallery
      ? { storageId: selectedStorageId }
      : "skip",
  );

  const isUploading = uploadBusyKey === "hero-image-upload";

  const onUploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > HERO_IMAGE_MAX_BYTES) {
      toast.error(
        `Image must be ${Math.floor(HERO_IMAGE_MAX_BYTES / (1024 * 1024))}MB or smaller.`,
      );
      return;
    }
    setUploadBusyKey("hero-image-upload");
    try {
      const { uploadUrl } = await generateUploadUrl();
      const storageId = await uploadHeadshotToConvex(uploadUrl, file);
      onChange(storageId);
      toast.success("Hero image uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploadBusyKey(null);
    }
  };

  const selectedUrl = selectedInGallery?.url ?? bespokeUrl ?? null;
  // Only treat the selection as orphaned once we've heard back from both
  // the gallery list and the bespoke URL query. Otherwise the first render
  // after selection flashes a false warning.
  const selectedIsOrphaned =
    selectedStorageId !== undefined &&
    draft !== undefined &&
    !selectedInGallery &&
    bespokeUrl === null;

  const uploadButton = (
    <>
      <input
        id="about-hero-upload-input"
        type="file"
        accept={HERO_IMAGE_ACCEPT}
        className="hidden"
        tabIndex={-1}
        disabled={uploadBusyKey !== null}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void onUploadFile(f);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploadBusyKey !== null}
        onClick={() => {
          document.getElementById("about-hero-upload-input")?.click();
        }}
      >
        {isUploading
          ? "Uploading…"
          : selectedStorageId !== undefined
            ? "Upload different image"
            : "Upload new image"}
      </Button>
    </>
  );

  if (draft === undefined) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
        Loading gallery photos…
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {selectedIsOrphaned ? (
        <div className="flex items-start justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs">
          <p className="text-amber-800 dark:text-amber-200">
            The previously selected image is no longer available. Pick a
            new one, upload another, or clear the selection.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-amber-800 hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
            onClick={() => onChange(undefined)}
          >
            <Trash2 className="mr-1 size-3.5" aria-hidden />
            Clear
          </Button>
        </div>
      ) : null}

      {selectedUrl ? (
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed Convex URL, not eligible for `next/image` in admin surfaces. */}
            <img
              src={selectedUrl}
              alt=""
              aria-hidden
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="body-text-small truncate text-foreground">
              {selectedInGallery
                ? selectedInGallery.alt ||
                  selectedInGallery.originalFileName ||
                  "Selected photo"
                : "Custom upload"}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedInGallery
                ? "This photo will appear as the About page hero."
                : "Bespoke upload — not part of the public gallery."}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(undefined)}
          >
            <Trash2 className="mr-1 size-3.5" aria-hidden />
            Remove
          </Button>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="body-text-small text-muted-foreground">
          {photos.length === 0
            ? "No gallery photos yet — upload a bespoke image for the hero."
            : "Pick from the gallery below or upload a bespoke image."}
        </p>
        {uploadButton}
      </div>

      {photos.length > 0 ? (
        <div
          role="radiogroup"
          aria-label="Hero image"
          className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
        >
          {photos.map((photo) => {
            const isSelected = photo.storageId === selectedStorageId;
            return (
              <button
                key={photo.stableId}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={
                  photo.alt ||
                  photo.originalFileName ||
                  `Use ${photo.stableId} as hero image`
                }
                onClick={() => {
                  onChange(isSelected ? undefined : photo.storageId);
                }}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-md border transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isSelected
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-foreground/40",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail, signed Convex URL. */}
                <img
                  src={photo.url}
                  alt=""
                  aria-hidden
                  className={cn(
                    "size-full object-cover transition group-hover:scale-[1.02]",
                    !isSelected && "opacity-90 group-hover:opacity-100",
                  )}
                />
                {isSelected ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/20">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
});

interface TeamMembersEditorProps {
  readonly members: AboutTeamMemberRow[];
  readonly onChange: (next: AboutTeamMemberRow[]) => void;
  readonly generateUploadUrl: () => Promise<{ uploadUrl: string }>;
  readonly uploadBusyKey: string | null;
  readonly setUploadBusyKey: (key: string | null) => void;
}

const TeamMembersEditor = memo(function TeamMembersEditor({
  members,
  onChange,
  generateUploadUrl,
  uploadBusyKey,
  setUploadBusyKey,
}: TeamMembersEditorProps) {
  const storageIds = useMemo(
    () =>
      members
        .map((m) => m.storageId)
        .filter((id): id is Id<"_storage"> => id !== undefined),
    [members],
  );

  const urlRows = useQuery(
    api.admin.aboutTeam.getTeamHeadshotUrls,
    storageIds.length > 0 ? { storageIds } : "skip",
  );

  const urlByStorageId = useMemo(() => {
    const map = new Map<Id<"_storage">, string | null>();
    if (urlRows) {
      for (const row of urlRows) {
        map.set(row.storageId, row.url);
      }
    }
    return map;
  }, [urlRows]);

  const add = () => {
    if (members.length >= MAX_TEAM_MEMBERS) return;
    onChange([
      ...members,
      { id: crypto.randomUUID(), name: "", title: "" },
    ]);
  };

  const remove = (idx: number) => {
    onChange(members.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= members.length) return;
    const next = [...members];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  const updateField = (
    idx: number,
    field: "name" | "title",
    value: string,
  ) => {
    const next = [...members];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const onPickFile = async (idx: number, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (JPEG, PNG, or WebP).");
      return;
    }
    setUploadBusyKey(`upload-${idx}`);
    try {
      const { uploadUrl } = await generateUploadUrl();
      const storageId = await uploadHeadshotToConvex(uploadUrl, file);
      const next = [...members];
      next[idx] = { ...next[idx], storageId };
      onChange(next);
      toast.success("Headshot uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploadBusyKey(null);
    }
  };

  const removePhoto = (idx: number) => {
    const next = [...members];
    const cur = next[idx];
    next[idx] = {
      id: cur.id,
      name: cur.name,
      title: cur.title,
    };
    onChange(next);
    toast.success("Photo removed.");
  };

  return (
    <div className="space-y-3">
      {members.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          No team members yet. Add people who appear on the public About page.
        </p>
      ) : (
        <ul className="space-y-4">
          {members.map((m, idx) => (
            <li
              key={m.id}
              className="rounded-lg border border-border bg-muted/20 p-3 space-y-3"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {m.storageId && urlByStorageId.get(m.storageId) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- signed Convex URL
                    <img
                      src={urlByStorageId.get(m.storageId) ?? undefined}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="px-1 text-center text-[10px] text-muted-foreground">
                      No photo
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <label className="block space-y-1">
                    <span className="body-text-small text-muted-foreground">
                      Name
                    </span>
                    <Input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateField(idx, "name", e.target.value)}
                      placeholder="Jane Doe"
                      className="text-foreground placeholder:text-muted-foreground"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="body-text-small text-muted-foreground">
                      Title
                    </span>
                    <Input
                      type="text"
                      value={m.title}
                      onChange={(e) => updateField(idx, "title", e.target.value)}
                      placeholder="Engineer / Producer"
                      className="text-foreground placeholder:text-muted-foreground"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      id={`team-headshot-${m.id}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      tabIndex={-1}
                      disabled={uploadBusyKey !== null}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) void onPickFile(idx, f);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadBusyKey !== null}
                      onClick={() => {
                        document.getElementById(`team-headshot-${m.id}`)?.click();
                      }}
                    >
                      {uploadBusyKey === `upload-${idx}`
                        ? "Uploading…"
                        : m.storageId
                          ? "Replace headshot"
                          : "Upload headshot"}
                    </Button>
                    {m.storageId ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        disabled={uploadBusyKey !== null}
                        onClick={() => removePhoto(idx)}
                      >
                        Remove photo
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move up ${idx + 1}`}
                    disabled={idx === 0}
                    onClick={() => move(idx, -1)}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move down ${idx + 1}`}
                    disabled={idx === members.length - 1}
                    onClick={() => move(idx, 1)}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${idx + 1}`}
                    onClick={() => remove(idx)}
                  >
                    <X className="size-4 text-muted-foreground" aria-hidden />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        disabled={members.length >= MAX_TEAM_MEMBERS}
      >
        <Plus className="mr-1 size-3.5" aria-hidden />
        Add person
      </Button>
    </div>
  );
});

interface HighlightsEditorProps {
  readonly highlights: readonly string[];
  readonly onChange: (next: string[]) => void;
}

const HighlightsEditor = memo(function HighlightsEditor({
  highlights,
  onChange,
}: HighlightsEditorProps) {
  const update = (idx: number, value: string) => {
    const next = [...highlights];
    next[idx] = value;
    onChange(next);
  };
  const remove = (idx: number) =>
    onChange(highlights.filter((_, i) => i !== idx));
  const add = () => onChange([...highlights, ""]);
  const commit = () => {
    const cleaned = highlights.map((h) => h.trim()).filter((h) => h.length > 0);
    if (cleaned.length !== highlights.length) {
      onChange(cleaned);
    }
  };

  return (
    <div className="space-y-2">
      {highlights.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          No highlights yet. Add short bullet callouts describing the studio.
        </p>
      ) : (
        <ul className="space-y-2">
          {highlights.map((h, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <Input
                type="text"
                value={h}
                onChange={(e) => update(idx, e.target.value)}
                onBlur={commit}
                placeholder={`Highlight ${idx + 1}`}
                className="flex-1 text-foreground placeholder:text-muted-foreground"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove highlight ${idx + 1}`}
                onClick={() => remove(idx)}
              >
                <X className="size-4 text-muted-foreground" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1 size-3.5" aria-hidden />
        Add highlight
      </Button>
    </div>
  );
});

interface CharCounterProps {
  readonly value: string;
  readonly recommended: number;
}

function CharCounter({ value, recommended }: CharCounterProps) {
  const len = value.length;
  const over = len > recommended;
  const wayOver = len > recommended + Math.ceil(recommended * 0.2);
  return (
    <span
      className={cn(
        "font-mono text-[10px] tabular-nums",
        wayOver
          ? "text-destructive"
          : over
            ? "text-amber-600 dark:text-amber-400"
            : "text-muted-foreground",
      )}
      aria-live="polite"
    >
      {len} / {recommended}
    </span>
  );
}
