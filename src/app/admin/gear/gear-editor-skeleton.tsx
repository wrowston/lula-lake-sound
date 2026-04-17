import { Skeleton } from "@/components/ui/skeleton";

/** Form-shaped skeleton for gear editor (route loading + dynamic import fallback). */
export function GearEditorSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3.5 w-full max-w-xl" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>
      <div className="space-y-5">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border shadow-sm"
          >
            <div className="border-b border-border/60 bg-muted/40 px-5 py-4">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="mt-2 h-6 w-56" />
              <Skeleton className="mt-2 h-3.5 w-20" />
            </div>
            <ul className="divide-y divide-border">
              {[0, 1].map((j) => (
                <li key={j} className="px-5 py-4">
                  <Skeleton className="h-10 w-full max-w-xl" />
                </li>
              ))}
            </ul>
          </div>
        ))}
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
