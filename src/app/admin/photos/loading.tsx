import { AdminSectionLoadingFrame } from "@/components/admin/admin-section-loading-frame";
import { PhotosEditorSkeleton } from "./photos-editor-skeleton";
import { getAdminPendingLayout } from "@/lib/admin-pending-layout";

const layout = getAdminPendingLayout("/admin/photos");

export default function PhotosLoading() {
  return (
    <AdminSectionLoadingFrame
      title={layout.title}
      outerClassName={layout.outerClassName}
      innerClassName={layout.innerClassName}
    >
      <PhotosEditorSkeleton />
    </AdminSectionLoadingFrame>
  );
}
