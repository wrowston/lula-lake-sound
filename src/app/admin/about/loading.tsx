import { AdminSectionLoadingFrame } from "@/components/admin/admin-section-loading-frame";
import { AboutEditorSkeleton } from "./about-editor-skeleton";
import { getAdminPendingLayout } from "@/lib/admin-pending-layout";

const layout = getAdminPendingLayout("/admin/about");

export default function AboutLoading() {
  return (
    <AdminSectionLoadingFrame
      title={layout.title}
      outerClassName={layout.outerClassName}
      innerClassName={layout.innerClassName}
    >
      <AboutEditorSkeleton />
    </AdminSectionLoadingFrame>
  );
}
