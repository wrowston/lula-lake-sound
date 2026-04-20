"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DraftStatusBadge } from "@/components/admin/draft-status-badge";
import { DiscardDraftDialog } from "@/components/admin/discard-draft-dialog";
import { PublishConfirmDialog } from "@/components/admin/publish-confirm-dialog";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface CmsPublishToolbarProps {
  /** CMS section key (e.g. `settings`) — used for context in labels. */
  readonly section: string;
  /** Human label for tooltips (e.g. “Site settings”). */
  readonly sectionLabel: string;
  readonly hasDraftOnServer: boolean;
  readonly hasLocalEdits: boolean;
  readonly publishedAt: number | null;
  readonly publishedByLabel?: string;
  readonly busy: string | null;
  readonly onPublish: () => void;
  /**
   * Return `true` when the discard dialog should close (success).
   * Return `false` when the operation failed (e.g. toast already shown).
   */
  readonly onDiscardConfirm: () => Promise<boolean>;
  readonly previewHref?: string;
  /** Optional inline error below actions (toast still recommended). */
  readonly inlineError?: string | null;
  /** Current autosave status for a subtle indicator near the status badge. */
  readonly autosaveStatus?: AutosaveStatus;
  /** When false, the toolbar renders inline instead of sticky-bottom. */
  readonly sticky?: boolean;
}

const actionButtonClass =
  "w-full min-w-0 justify-center sm:w-auto";

/**
 * Shared draft/publish actions and status for CMS admin sections.
 *
 * Drafts are auto-saved by the editor — this toolbar only exposes Publish,
 * Discard, and Preview plus a subtle autosave indicator.
 */
export function CmsPublishToolbar({
  section,
  sectionLabel,
  hasDraftOnServer,
  hasLocalEdits,
  publishedAt,
  publishedByLabel,
  busy,
  onPublish,
  onDiscardConfirm,
  previewHref = "/preview",
  inlineError,
  autosaveStatus = "idle",
  sticky = true,
}: CmsPublishToolbarProps) {
  const [discardOpen, setDiscardOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const handleDiscardConfirm = useCallback(async () => {
    const ok = await onDiscardConfirm();
    if (ok) {
      setDiscardOpen(false);
    }
  }, [onDiscardConfirm]);

  const hasPublished = publishedAt !== null;
  const isBusy = busy !== null;

  return (
    <div
      className={cn(
        sticky &&
          "sticky bottom-0 z-20 -mx-6 border-t border-border/70 bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80",
      )}
      data-cms-section={section}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <DraftStatusBadge
            hasDraftOnServer={hasDraftOnServer}
            hasLocalEdits={hasLocalEdits}
            publishedAt={publishedAt}
            publishedByLabel={publishedByLabel}
          />
          <AutosaveIndicator status={autosaveStatus} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:gap-2 sm:shrink-0">
          <Tooltip>
            <TooltipTrigger
              delay={400}
              render={
                <Link
                  href={previewHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    actionButtonClass,
                    "inline-flex items-center gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300",
                  )}
                >
                  Preview site
                  <ExternalLink className="size-3.5 shrink-0 opacity-80" aria-hidden />
                </Link>
              }
            />
            <TooltipContent className="max-w-xs">
              Open the marketing site in a new tab with preview content (signed in).
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              delay={400}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(actionButtonClass, "border border-border")}
                  disabled={(!hasDraftOnServer && !hasLocalEdits) || isBusy}
                  onClick={() => setDiscardOpen(true)}
                >
                  Discard
                </Button>
              }
            />
            <TooltipContent className="max-w-xs">
              Drop unpublished edits and match the last published version.
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              delay={400}
              render={
                <Button
                  type="button"
                  variant="default"
                  className={actionButtonClass}
                  disabled={(!hasDraftOnServer && !hasLocalEdits) || isBusy}
                  onClick={() => setPublishOpen(true)}
                >
                  {busy === "Publishing…" ? "Publishing…" : "Publish"}
                </Button>
              }
            />
            <TooltipContent className="max-w-xs">
              Push the current draft live for {sectionLabel}. Unsaved edits are
              saved first.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {inlineError ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {inlineError}
        </p>
      ) : null}

      <PublishConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        sectionLabel={sectionLabel}
        onConfirm={() => {
          setPublishOpen(false);
          onPublish();
        }}
      />

      <DiscardDraftDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        hasDraftOnServer={hasDraftOnServer}
        hasPublished={hasPublished}
        busy={busy === "Discarding…"}
        onConfirm={() => void handleDiscardConfirm()}
      />
    </div>
  );
}

function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === "idle") return null;

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        Saving…
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
        Saved
      </span>
    );
  }

  return (
    <span
      role="status"
      className="inline-flex items-center gap-1 text-xs text-destructive"
    >
      <AlertCircle className="size-3" aria-hidden />
      Save failed — retrying
    </span>
  );
}
