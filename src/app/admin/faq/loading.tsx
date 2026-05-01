import { AdminSectionLoadingFrame } from "@/components/admin/admin-section-loading-frame";
import { FaqEditorSkeleton } from "./faq-editor-skeleton";
import { getAdminPendingLayout } from "@/lib/admin-pending-layout";

const layout = getAdminPendingLayout("/admin/faq");

export default function FaqLoading() {
  return (
    <AdminSectionLoadingFrame
      title={layout.title}
      outerClassName={layout.outerClassName}
      innerClassName={layout.innerClassName}
    >
      <FaqEditorSkeleton />
    </AdminSectionLoadingFrame>
  );
}
