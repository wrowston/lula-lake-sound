import { Skeleton } from "@/components/ui/skeleton";

/** Settings route: form-shaped skeleton while RSC + Convex section loads. */
export default function SettingsLoading() {
  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-background px-4">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-4 w-28" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </header>
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl space-y-8">
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
      </div>
    </>
  );
}
