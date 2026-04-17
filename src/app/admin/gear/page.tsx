import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { GearEditorSkeleton } from "./gear-editor-skeleton";

const GearEditor = dynamic(
  () => import("./gear-editor").then((m) => ({ default: m.GearEditor })),
  { loading: () => <GearEditorSkeleton /> },
);

export const metadata: Metadata = {
  title: "Gear",
};

export default function GearPage() {
  return (
    <>
      <AdminHeader title="Gear" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <GearEditor />
        </div>
      </div>
    </>
  );
}
