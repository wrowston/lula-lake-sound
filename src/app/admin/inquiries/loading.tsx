import { AdminSectionLoadingFrame } from "@/components/admin/admin-section-loading-frame";
import { getAdminPendingLayout } from "@/lib/admin-pending-layout";

const layout = getAdminPendingLayout("/admin/inquiries");

export default function InquiriesLoading() {
  return (
    <AdminSectionLoadingFrame
      title={layout.title}
      outerClassName={layout.outerClassName}
      innerClassName={layout.innerClassName}
    >
      <div className="space-y-6">
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-border/60 bg-muted/20 p-5"
            >
              <div className="mb-3 h-5 w-40 rounded bg-muted" />
              <div className="h-3 w-full max-w-lg rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </AdminSectionLoadingFrame>
  );
}
