import { AdminSectionLoadingFrame } from "@/components/admin/admin-section-loading-frame";
import { AdminDashboardLoadingSkeleton } from "@/components/admin/admin-dashboard-loading-skeleton";
import { getAdminPendingLayout } from "@/lib/admin-pending-layout";

const layout = getAdminPendingLayout("/admin");

/**
 * Dashboard route loading: welcome + manage grid shell (not editor-shaped).
 * Section routes use their own segment `loading.tsx` files for editor-matched skeletons.
 */
export default function AdminLoading() {
  return (
    <AdminSectionLoadingFrame
      title={layout.title}
      outerClassName={layout.outerClassName}
      innerClassName={layout.innerClassName}
    >
      <AdminDashboardLoadingSkeleton />
    </AdminSectionLoadingFrame>
  );
}
