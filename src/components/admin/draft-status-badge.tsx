"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface DraftStatusBadgeProps {
  readonly hasDraftOnServer: boolean;
  /**
   * Retained for API compatibility; local edits are auto-saved so we no
   * longer render a dedicated badge for them (the autosave indicator
   * rendered alongside this component communicates save progress).
   */
  readonly hasLocalEdits?: boolean;
  readonly publishedAt: number | null;
  /** Short label for who published (e.g. “You”) when known. */
  readonly publishedByLabel?: string;
}

/**
 * Draft vs published indicators for CMS sections: unpublished changes and
 * last published time with an optional “by” line.
 */
export function DraftStatusBadge({
  hasDraftOnServer,
  publishedAt,
  publishedByLabel,
}: DraftStatusBadgeProps) {
  const fullPublished =
    publishedAt !== null
      ? new Date(publishedAt).toLocaleString(undefined, {
          dateStyle: "full",
          timeStyle: "short",
        })
      : null;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {hasDraftOnServer && (
        <Badge variant="draft">Unpublished changes</Badge>
      )}
      {publishedAt !== null && (
        <Tooltip>
          <TooltipTrigger
            type="button"
            className="inline-flex max-w-full min-w-0 cursor-default border-0 bg-transparent p-0 text-left font-normal text-inherit underline-offset-2 hover:underline"
          >
            <span className="min-w-0 truncate text-muted-foreground">
              Last published{" "}
              {new Date(publishedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {publishedByLabel ? (
                <>
                  {" "}
                  <span className="text-foreground/80">· {publishedByLabel}</span>
                </>
              ) : null}
            </span>
          </TooltipTrigger>
          {fullPublished !== null && (
            <TooltipContent side="top" align="start" className="max-w-sm">
              {fullPublished}
              {publishedByLabel ? (
                <>
                  <br />
                  <span className="opacity-90">{publishedByLabel}</span>
                </>
              ) : null}
            </TooltipContent>
          )}
        </Tooltip>
      )}
    </div>
  );
}
