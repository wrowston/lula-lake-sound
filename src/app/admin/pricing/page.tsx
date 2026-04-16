import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
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
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <PricingEditor />
        </div>
      </div>
    </>
  );
}
