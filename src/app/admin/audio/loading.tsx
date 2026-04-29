import { AdminSectionLoadingFrame } from "@/components/admin/admin-section-loading-frame";
import { AudioEditorSkeleton } from "./audio-editor-skeleton";
import { getAdminPendingLayout } from "@/lib/admin-pending-layout";

const layout = getAdminPendingLayout("/admin/audio");

export default function AudioLoading() {
  return (
    <AdminSectionLoadingFrame
      title={layout.title}
      outerClassName={layout.outerClassName}
      innerClassName={layout.innerClassName}
    >
      <AudioEditorSkeleton />
    </AdminSectionLoadingFrame>
  );
}
