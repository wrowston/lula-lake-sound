"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
  readonly onSaveDraft: () => void;
  readonly onPublish: () => void;
  /**
   * Return `true` when the discard dialog should close (success).
   * Return `false` when the operation failed (e.g. toast already shown).
   */
  readonly onDiscardConfirm: () => Promise<boolean>;
  readonly previewHref?: string;
  /** Optional inline error below actions (toast still recommended). */
  readonly inlineError?: string | null;
}

const actionButtonClass =
  "w-full min-w-0 justify-center sm:w-auto sm:min-w-[9rem]";

/**
 * Shared draft/publish actions and status for CMS admin sections.
 */
export function CmsPublishToolbar({
  section,
  sectionLabel,
  hasDraftOnServer,
  hasLocalEdits,
  publishedAt,
  publishedByLabel,
  busy,
  onSaveDraft,
  onPublish,
  onDiscardConfirm,
  previewHref = "/preview",
  inlineError,
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
    <div className="space-y-4" data-cms-section={section}>
      <DraftStatusBadge
        hasDraftOnServer={hasDraftOnServer}
        hasLocalEdits={hasLocalEdits}
        publishedAt={publishedAt}
        publishedByLabel={publishedByLabel}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
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

        <Tooltip>
          <TooltipTrigger
            delay={400}
            render={
              <Button
                type="button"
                variant="outline"
                className={actionButtonClass}
                disabled={!hasLocalEdits || isBusy}
                onClick={() => onSaveDraft()}
              >
                {busy === "Saving…" ? "Saving…" : "Save draft"}
              </Button>
            }
          />
          <TooltipContent className="max-w-xs">
            Store changes on the server without updating the live site.
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
      </div>

      {inlineError ? (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
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
