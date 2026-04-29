import { AdminSectionLoadingFrame } from "@/components/admin/admin-section-loading-frame";
import { AmenitiesEditorSkeleton } from "./amenities-editor-skeleton";
import { getAdminPendingLayout } from "@/lib/admin-pending-layout";

const layout = getAdminPendingLayout("/admin/amenities-nearby");

export default function AmenitiesNearbyLoading() {
  return (
    <AdminSectionLoadingFrame
      title={layout.title}
      outerClassName={layout.outerClassName}
      innerClassName={layout.innerClassName}
    >
      <AmenitiesEditorSkeleton />
    </AdminSectionLoadingFrame>
  );
}
