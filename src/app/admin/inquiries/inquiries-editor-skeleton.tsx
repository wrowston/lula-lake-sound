import { Skeleton } from "@/components/ui/skeleton";

/** Loading shell for the contact submissions admin page. */
export function InquiriesEditorSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-full max-w-xl" />
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        <div className="border-b border-border/60 bg-muted/30 px-2 py-3">
          <Skeleton className="h-3 w-32" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border/40 px-2 py-3 last:border-0"
          >
            <Skeleton className="size-4" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="ml-auto h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
