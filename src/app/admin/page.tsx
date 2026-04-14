import type { Metadata } from "next";
import { AdminCmsPage } from "./admin-cms-page";

export const metadata: Metadata = {
  title: "Studio CMS | Lula Lake Sound",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminCmsPage />;
}
