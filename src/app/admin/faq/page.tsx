import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  ADMIN_PAGE_INNER_CLASS,
  ADMIN_PAGE_OUTER_CLASS,
} from "@/lib/admin-pending-layout";
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
      <div className={ADMIN_PAGE_OUTER_CLASS}>
        <div className={ADMIN_PAGE_INNER_CLASS}>
          <FaqEditor />
        </div>
      </div>
    </>
  );
}
