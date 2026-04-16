import { Skeleton } from "@/components/ui/skeleton";

/** Form-shaped skeleton for pricing editor (route loading + dynamic import fallback). */
export function PricingEditorSkeleton() {
  return (
    <div className="space-y-10">
      <fieldset className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <div className="flex items-start gap-3">
          <Skeleton className="h-4 w-4 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
      </fieldset>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
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
