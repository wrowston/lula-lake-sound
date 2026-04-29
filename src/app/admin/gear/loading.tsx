import { AdminSectionLoadingFrame } from "@/components/admin/admin-section-loading-frame";
import { GearEditorSkeleton } from "./gear-editor-skeleton";
import { getAdminPendingLayout } from "@/lib/admin-pending-layout";

const layout = getAdminPendingLayout("/admin/gear");

export default function GearLoading() {
  return (
    <AdminSectionLoadingFrame
      title={layout.title}
      outerClassName={layout.outerClassName}
      innerClassName={layout.innerClassName}
    >
      <GearEditorSkeleton />
    </AdminSectionLoadingFrame>
  );
}
