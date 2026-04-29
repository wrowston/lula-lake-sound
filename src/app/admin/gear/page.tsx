import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  ADMIN_PAGE_INNER_CLASS,
  ADMIN_PAGE_OUTER_CLASS,
} from "@/lib/admin-pending-layout";
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
      <div className={ADMIN_PAGE_OUTER_CLASS}>
        <div className={ADMIN_PAGE_INNER_CLASS}>
          <GearEditor />
        </div>
      </div>
    </>
  );
}
