import { AdminSectionLoadingFrame } from "@/components/admin/admin-section-loading-frame";
import { PricingEditorSkeleton } from "./pricing-editor-skeleton";
import { getAdminPendingLayout } from "@/lib/admin-pending-layout";

const layout = getAdminPendingLayout("/admin/pricing");

export default function PricingLoading() {
  return (
    <AdminSectionLoadingFrame
      title={layout.title}
      outerClassName={layout.outerClassName}
      innerClassName={layout.innerClassName}
    >
      <PricingEditorSkeleton />
    </AdminSectionLoadingFrame>
  );
}
