import { Skeleton } from "@/components/ui/skeleton";

/**
 * Form skeleton for the FAQ editor (route loading + dynamic import fallback).
 * Mirrors the live editor's silhouette — header strip, validation slot,
 * two category cards each with a question row — to minimize layout shift.
 */
export function FaqEditorSkeleton() {
  return (
    <div className="space-y-8 pb-24">
      <div className="space-y-3 border-b border-border pb-6">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-7 w-56" />
          </div>
          <div className="flex gap-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-10" />
            </div>
          </div>
        </div>
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      {[0, 1].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-10 w-full max-w-md" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
            </div>
          </div>
          <div className="space-y-3 rounded-md bg-muted/30 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
    </div>
  );
}
