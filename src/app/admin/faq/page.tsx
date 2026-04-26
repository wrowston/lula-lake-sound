import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { FaqEditorSkeleton } from "./faq-editor-skeleton";

const FaqEditor = dynamic(
  () => import("./faq-editor").then((m) => ({ default: m.FaqEditor })),
  { loading: () => <FaqEditorSkeleton /> },
);

export const metadata: Metadata = {
  title: "FAQ",
};

export default function AdminFaqPage() {
  return (
    <>
      <AdminHeader title="FAQ" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <FaqEditor />
        </div>
      </div>
    </>
  );
}
