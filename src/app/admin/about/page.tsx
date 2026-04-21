import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
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
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl">
          <AboutEditor />
        </div>
      </div>
    </>
  );
}
