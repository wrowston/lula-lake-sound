"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface UnsavedChangesDialogProps {
  readonly open: boolean;
  readonly onLeave: () => void;
  readonly onStay: () => void;
}

/**
 * Confirmation shown when the user clicks a sidebar link with unsaved local
 * edits that cannot be silently flushed (e.g. the manual-save Photos editor).
 */
export function UnsavedChangesDialog({
  open,
  onLeave,
  onStay,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onStay();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave with unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved edits on this page. Navigating away now will
            discard them — the live site is not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={() => onStay()}>
            Stay on this page
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onLeave()}
          >
            Leave without saving
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
