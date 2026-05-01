import { Skeleton } from "@/components/ui/skeleton";

/** Matches the dashboard welcome block + inquiries preview + manage grid on `/admin`. */
export function AdminDashboardLoadingSkeleton() {
  return (
    <>
      <div>
        <Skeleton className="mb-1 h-6 w-40" />
        <Skeleton className="h-3.5 w-80 max-w-full" />
      </div>
      <div className="rounded-lg border border-border/60 bg-muted/20 p-5 sm:p-6">
        <Skeleton className="mb-2 h-5 w-56" />
        <Skeleton className="mb-4 h-3 w-full max-w-md" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 border-b border-border/40 pb-3 last:border-0">
              <Skeleton className="size-10 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-full max-w-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/60 bg-muted/20 p-5"
          >
            <Skeleton className="mb-3 size-9 rounded-md" />
            <Skeleton className="mb-2 h-4 w-28" />
            <Skeleton className="h-3 w-full max-w-[12rem]" />
          </div>
        ))}
      </div>
    </>
  );
}
