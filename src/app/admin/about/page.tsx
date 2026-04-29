import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  ADMIN_PAGE_INNER_CLASS,
  ADMIN_PAGE_OUTER_CLASS,
} from "@/lib/admin-pending-layout";
import { AboutEditorSkeleton } from "./about-editor-skeleton";

const AboutEditor = dynamic(
  () => import("./about-editor").then((m) => ({ default: m.AboutEditor })),
  { loading: () => <AboutEditorSkeleton /> },
);

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <>
      <AdminHeader title="About" />
      <div className={ADMIN_PAGE_OUTER_CLASS}>
        <div className={ADMIN_PAGE_INNER_CLASS}>
          <AboutEditor />
        </div>
      </div>
    </>
  );
}
