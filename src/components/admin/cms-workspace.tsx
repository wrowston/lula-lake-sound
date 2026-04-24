"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import type { AutosaveStatus } from "@/components/admin/cms-publish-toolbar";
import { CmsPublishToolbar } from "@/components/admin/cms-publish-toolbar";
import { CrossSectionPendingBanner } from "@/components/admin/cross-section-pending-banner";
import { UnsavedChangesDialog } from "@/components/admin/unsaved-changes-dialog";
import { BeforeUnloadGuard } from "@/components/admin/before-unload-guard";
import { usePendingDraftSections } from "@/components/admin/use-pending-drafts";
import { cn } from "@/lib/utils";

/**
 * Props passed by the active editor into the persistent toolbar host. All
 * values are live — they're sourced directly from the editor's render, so
 * the toolbar mirrors busy/autosaveStatus/inlineError without any external
 * store or cross-component subscription.
 */
export interface CmsEditorState {
  readonly section: string;
  readonly sectionLabel: string;
  readonly hasDraftOnServer: boolean;
  readonly hasLocalEdits: boolean;
  readonly publishedAt: number | null;
  readonly publishedByLabel?: string;
  readonly busy: string | null;
  readonly autosaveStatus?: AutosaveStatus;
  readonly inlineError?: string | null;
  readonly previewHref?: string;
  readonly onPublish: () => void;
  readonly onDiscardConfirm: () => Promise<boolean>;
  /**
   * Optional silent flush for editors that autosave. When defined, the nav
   * guard awaits this before navigating away so no in-memory edit is lost.
   * Returns `true` on success and `false` on failure (editor is expected to
   * surface its own error messaging).
   */
  readonly flush?: () => Promise<boolean>;
}

type ConfirmResult = "leave" | "stay";

/**
 * Minimal snapshot the sidebar's nav guard needs when the user clicks a
 * link. Updated synchronously from the editor's render body via a ref so
 * no cross-component setState is ever required.
 */
interface CmsNavState {
  readonly hasLocalEdits: boolean;
  readonly flush?: () => Promise<boolean>;
}

interface CmsWorkspaceContextValue {
  readonly hostNode: HTMLDivElement | null;
  readonly registerHostNode: (el: HTMLDivElement | null) => void;
  readonly navStateRef: MutableRefObject<CmsNavState>;
  readonly attemptNavigate: () => Promise<boolean>;
  readonly openConfirm: () => Promise<ConfirmResult>;
}

const CmsWorkspaceContext = createContext<CmsWorkspaceContextValue | null>(
  null,
);

/**
 * Provides the shared toolbar host + nav-guard plumbing used by every admin
 * editor. Publishing state from an editor to the toolbar is done via a
 * React portal (see {@link useRegisterCmsEditor}) rather than an external
 * store, which avoids the "update during render" warning that would fire
 * if we notified subscribers from the editor's render body.
 */
export function CmsWorkspaceProvider({ children }: { children: ReactNode }) {
  const [hostNode, setHostNode] = useState<HTMLDivElement | null>(null);
  const navStateRef = useRef<CmsNavState>({ hasLocalEdits: false });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmResolverRef = useRef<((r: ConfirmResult) => void) | null>(null);

  const registerHostNode = useCallback((el: HTMLDivElement | null) => {
    setHostNode(el);
  }, []);

  const openConfirm = useCallback(() => {
    return new Promise<ConfirmResult>((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmOpen(true);
    });
  }, []);

  const handleConfirmResult = useCallback((result: ConfirmResult) => {
    setConfirmOpen(false);
    const resolver = confirmResolverRef.current;
    confirmResolverRef.current = null;
    resolver?.(result);
  }, []);

  const attemptNavigate = useCallback(async (): Promise<boolean> => {
    const nav = navStateRef.current;
    if (!nav.hasLocalEdits) return true;
    if (nav.flush) {
      const ok = await nav.flush();
      if (!ok) {
        toast.error(
          "Couldn't save your draft before navigating. Fix the error, then try again.",
        );
      }
      return ok;
    }
    const result = await openConfirm();
    return result === "leave";
  }, [openConfirm]);

  const value = useMemo<CmsWorkspaceContextValue>(
    () => ({
      hostNode,
      registerHostNode,
      navStateRef,
      attemptNavigate,
      openConfirm,
    }),
    [hostNode, registerHostNode, attemptNavigate, openConfirm],
  );

  return (
    <CmsWorkspaceContext.Provider value={value}>
      {children}
      <BeforeUnloadGuard />
      <UnsavedChangesDialog
        open={confirmOpen}
        onLeave={() => handleConfirmResult("leave")}
        onStay={() => handleConfirmResult("stay")}
      />
    </CmsWorkspaceContext.Provider>
  );
}

function useCmsWorkspace(): CmsWorkspaceContextValue {
  const v = useContext(CmsWorkspaceContext);
  if (!v) {
    throw new Error(
      "useCmsWorkspace must be used inside <CmsWorkspaceProvider>",
    );
  }
  return v;
}

/**
 * Used by the sidebar + "Back to site" link. Resolves `true` when the UI
 * may proceed with navigation (no dirty edits, pending autosaves flushed
 * successfully, or the user explicitly chose "Leave").
 */
export function useCmsNavGuard(): {
  readonly attemptNavigate: () => Promise<boolean>;
} {
  const { attemptNavigate } = useCmsWorkspace();
  return { attemptNavigate };
}

/**
 * Internal: exposes the nav-state ref so the beforeunload guard can read
 * the current dirty flag at event time without subscribing.
 */
export function useCmsNavStateRef(): MutableRefObject<CmsNavState> {
  const { navStateRef } = useCmsWorkspace();
  return navStateRef;
}

/**
 * Result of {@link useRegisterCmsEditor}.
 *
 * - `toolbarPortal` must be rendered somewhere in the editor's JSX (it
 *   teleports into the admin layout host, so its actual location in the
 *   editor tree doesn't matter).
 * - `editorRef` must be attached to the editor root `<div>`, merged with
 *   any other ref callbacks (e.g. autosave unmount refs) through a single
 *   stable `useCallback` wrapper.
 */
export interface RegisteredCmsEditor {
  readonly toolbarPortal: ReactNode;
  readonly editorRef: (el: HTMLElement | null) => void;
}

/**
 * Register the calling editor as the active CMS editor.
 *
 * The toolbar is rendered as a React portal targeting the layout-level
 * host element, so it shares the editor's render cycle — updates to
 * `busy`, `autosaveStatus`, or `hasLocalEdits` flow through naturally
 * without any cross-component store.
 *
 * Nav-guard state (`hasLocalEdits`, `flush`) is written to a ref on
 * every render. The sidebar reads the ref in its click handler, which
 * keeps all updates out of React's render phase.
 *
 * The returned `editorRef` clears the nav-guard ref on unmount so stale
 * dirty state can never block a sidebar click after leaving a section.
 */
export function useRegisterCmsEditor(
  state: CmsEditorState,
): RegisteredCmsEditor {
  const { hostNode, navStateRef } = useCmsWorkspace();

  navStateRef.current = {
    hasLocalEdits: state.hasLocalEdits,
    flush: state.flush,
  };

  const editorRef = useCallback(
    (el: HTMLElement | null) => {
      if (!el) {
        navStateRef.current = { hasLocalEdits: false };
      }
    },
    [navStateRef],
  );

  const toolbarPortal: ReactNode = hostNode
    ? createPortal(
        <CmsPublishToolbar
          sticky={false}
          section={state.section}
          sectionLabel={state.sectionLabel}
          hasDraftOnServer={state.hasDraftOnServer}
          hasLocalEdits={state.hasLocalEdits}
          publishedAt={state.publishedAt}
          publishedByLabel={state.publishedByLabel}
          busy={state.busy}
          inlineError={state.inlineError ?? null}
          autosaveStatus={state.autosaveStatus ?? "idle"}
          previewHref={state.previewHref}
          onPublish={state.onPublish}
          onDiscardConfirm={state.onDiscardConfirm}
        />,
        hostNode,
      )
    : null;

  return { toolbarPortal, editorRef };
}

/**
 * Persistent toolbar host. Rendered once from the admin layout inside
 * `<SidebarInset>` so its sticky-bottom positioning resolves against the
 * admin scroll container.
 *
 * Two surfaces live here:
 *
 * 1. A banner listing **other sections** that currently have pending
 *    drafts. Always rendered from the layout so the indicator reaches
 *    editor-less admin pages (dashboard, `/admin/videos`) too. The
 *    current section is filtered out by pathname so its state isn't
 *    double-shown (it already owns the publish toolbar below).
 * 2. The active editor's `<CmsPublishToolbar>`, portaled in via
 *    {@link useRegisterCmsEditor}. When no editor is mounted the
 *    portal target is empty and `empty:hidden` collapses it.
 *
 * The outer sticky container hides itself whenever both children are
 * empty, so non-CMS admin routes without pending drafts don't get a
 * leftover border bar.
 */
export function CmsPersistentToolbarHost() {
  const { registerHostNode, hostNode } = useCmsWorkspace();
  const pathname = usePathname() ?? "";
  const pending = usePendingDraftSections();

  const othersPending = useMemo(() => {
    return pending.filter((section) => {
      if (section.href === pathname) return false;
      return !pathname.startsWith(`${section.href}/`);
    });
  }, [pending, pathname]);

  const hasBanner = othersPending.length > 0;

  return (
    <div
      data-cms-toolbar-host-wrapper
      data-has-banner={hasBanner ? "true" : "false"}
      className={cn(
        "sticky bottom-0 z-20 border-t border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        // When neither the banner nor the portal has content, the
        // `:has()` check below collapses the whole bar. Tailwind v4's
        // `has-[]` variant compiles this to a native CSS selector so
        // there's no runtime observation needed.
        !hasBanner &&
          "has-[[data-cms-toolbar-host]:empty]:hidden",
      )}
    >
      {hasBanner ? (
        <CrossSectionPendingBanner sections={othersPending} />
      ) : null}
      <div
        ref={registerHostNode}
        data-cms-toolbar-host
        data-has-node={hostNode ? "true" : "false"}
        className="px-6 py-3 empty:hidden"
      />
    </div>
  );
}
