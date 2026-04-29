import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  ADMIN_PAGE_INNER_CLASS,
  ADMIN_PAGE_OUTER_CLASS,
} from "@/lib/admin-pending-layout";
import { PricingEditorSkeleton } from "./pricing-editor-skeleton";

const PricingEditor = dynamic(
  () =>
    import("./pricing-editor").then((m) => ({ default: m.PricingEditor })),
  { loading: () => <PricingEditorSkeleton /> },
);

export const metadata: Metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <>
      <AdminHeader title="Pricing" />
      <div className={ADMIN_PAGE_OUTER_CLASS}>
        <div className={ADMIN_PAGE_INNER_CLASS}>
          <PricingEditor />
        </div>
      </div>
    </>
  );
}
