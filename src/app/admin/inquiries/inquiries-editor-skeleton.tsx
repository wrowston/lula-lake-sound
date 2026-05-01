import { Skeleton } from "@/components/ui/skeleton";

/** Loading shell for the contact submissions admin page. */
export function InquiriesEditorSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-full max-w-xl" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/60 bg-muted/20 p-5"
          >
            <Skeleton className="mb-3 h-5 w-40" />
            <Skeleton className="h-3 w-full max-w-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
