import { Skeleton } from "@/components/ui/skeleton";

/** Form-shaped skeleton for settings editor (route loading + dynamic import fallback). */
export function SettingsEditorSkeleton() {
  return (
    <div className="space-y-8">
      <fieldset className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
    </div>
  );
}
