import { Skeleton } from "@/components/ui/skeleton";

/** Form-shaped skeleton for pricing editor (route loading + dynamic import fallback). */
export function PricingEditorSkeleton() {
  return (
    <div className="space-y-8">
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
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
    </div>
  );
}
