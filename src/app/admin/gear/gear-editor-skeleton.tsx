import { Skeleton } from "@/components/ui/skeleton";

/** Form-shaped skeleton for gear editor (route loading + dynamic import fallback). */
export function GearEditorSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-full max-w-xl" />
      </div>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <Skeleton className="mb-3 h-5 w-56" />
              <div className="overflow-hidden rounded-md border">
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
    </div>
  );
}
