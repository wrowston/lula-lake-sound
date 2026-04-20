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

export interface PublishConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly sectionLabel: string;
  readonly onConfirm: () => void;
}

/**
 * Confirms promoting the current draft to the live site for a CMS section.
 */
export function PublishConfirmDialog({
  open,
  onOpenChange,
  sectionLabel,
  onConfirm,
}: PublishConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish to the live site?</AlertDialogTitle>
          <AlertDialogDescription>
            This replaces what visitors see for {sectionLabel} with your current
            draft. Unsaved edits in this editor are saved first, then published.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type="button" onClick={() => onConfirm()}>
            Publish
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
