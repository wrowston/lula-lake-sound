import { Skeleton } from "@/components/ui/skeleton";

/** Form skeleton for the About editor (route loading + dynamic import fallback). */
export function AboutEditorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
