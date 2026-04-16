"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface DiscardDraftDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly hasDraftOnServer: boolean;
  readonly hasPublished: boolean;
  readonly busy: boolean;
  readonly onConfirm: () => void;
}

/**
 * Confirms discarding local and/or server draft CMS edits without affecting the live site.
 */
export function DiscardDraftDialog({
  open,
  onOpenChange,
  hasDraftOnServer,
  hasPublished,
  busy,
  onConfirm,
}: DiscardDraftDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen && busy) {
          eventDetails.cancel();
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard draft changes?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasDraftOnServer
              ? "This removes unpublished edits from the server and resets the editor to the last published version. The live site is not changed."
              : "This clears unsaved edits in your browser and shows the last published version again."}
            {!hasPublished && hasDraftOnServer ? (
              <>
                {" "}
                Nothing has been published yet, so you will see the same default
                baseline stored for the site until you publish.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => onConfirm()}
          >
            {busy ? "Discarding…" : "Discard"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
