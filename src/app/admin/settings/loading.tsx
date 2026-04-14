import { Skeleton } from "@/components/ui/skeleton";
import { SettingsEditorSkeleton } from "./settings-editor-skeleton";

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
        <div className="mx-auto max-w-3xl">
          <SettingsEditorSkeleton />
        </div>
      </div>
    </>
  );
}
