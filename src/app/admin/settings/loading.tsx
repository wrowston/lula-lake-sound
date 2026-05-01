import { AdminSectionLoadingFrame } from "@/components/admin/admin-section-loading-frame";
import { SettingsEditorSkeleton } from "./settings-editor-skeleton";
import { getAdminPendingLayout } from "@/lib/admin-pending-layout";

const layout = getAdminPendingLayout("/admin/settings");

/** Settings route: form-shaped skeleton while RSC + Convex section loads. */
export default function SettingsLoading() {
  return (
    <AdminSectionLoadingFrame
      title={layout.title}
      outerClassName={layout.outerClassName}
      innerClassName={layout.innerClassName}
    >
      <SettingsEditorSkeleton />
    </AdminSectionLoadingFrame>
  );
}
