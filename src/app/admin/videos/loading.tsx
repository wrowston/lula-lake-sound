import { AdminSectionLoadingFrame } from "@/components/admin/admin-section-loading-frame";
import { VideosEditorSkeleton } from "./videos-editor-skeleton";
import { getAdminPendingLayout } from "@/lib/admin-pending-layout";

const layout = getAdminPendingLayout("/admin/videos");

export default function VideosLoading() {
  return (
    <AdminSectionLoadingFrame
      title={layout.title}
      outerClassName={layout.outerClassName}
      innerClassName={layout.innerClassName}
    >
      <VideosEditorSkeleton />
    </AdminSectionLoadingFrame>
  );
}
