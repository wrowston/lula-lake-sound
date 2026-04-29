import { Skeleton } from "@/components/ui/skeleton";

/** Matches the dashboard welcome block + manage grid on `/admin`. */
export function AdminDashboardLoadingSkeleton() {
  return (
    <>
      <div>
        <Skeleton className="mb-1 h-6 w-40" />
        <Skeleton className="h-3.5 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
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
