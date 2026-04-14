import { Skeleton } from "@/components/ui/skeleton";

/**
 * Instant feedback during admin route transitions (equivalent to lawn's
 * defaultPendingComponent). Layout (sidebar) stays mounted; this replaces the page slot.
 */
export default function AdminLoading() {
  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-background px-4">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-4 w-32" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </header>
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/60 bg-muted/20 p-5"
              >
                <Skeleton className="mb-3 size-9 rounded-md" />
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-3 w-full max-w-[12rem]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
