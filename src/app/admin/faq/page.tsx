import { AdminHeader } from "@/components/admin/admin-header";
import { FaqEditor } from "./faq-editor";

export default function AdminFaqPage() {
  return (
    <>
      <AdminHeader title="FAQ" />
      <div className="flex-1">
        <FaqEditor />
      </div>
    </>
  );
}
