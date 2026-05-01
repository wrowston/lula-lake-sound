import { Skeleton } from "@/components/ui/skeleton";

/** Form-shaped skeleton for audio editor (route loading + dynamic import fallback). */
export function AudioEditorSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3.5 w-full max-w-2xl" />
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="grid gap-3 rounded-lg border border-border/70 p-4 sm:grid-cols-[1fr_8rem]"
            >
              <div className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border/70 pt-8">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>
    </div>
  );
}
