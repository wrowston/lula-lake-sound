import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  ADMIN_PAGE_INNER_CLASS,
  ADMIN_PAGE_OUTER_CLASS,
} from "@/lib/admin-pending-layout";
import { SettingsEditorSkeleton } from "./settings-editor-skeleton";

const SettingsEditor = dynamic(
  () =>
    import("./settings-editor").then((m) => ({ default: m.SettingsEditor })),
  { loading: () => <SettingsEditorSkeleton /> },
);

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <>
      <AdminHeader title="Settings" />
      <div className={ADMIN_PAGE_OUTER_CLASS}>
        <div className={ADMIN_PAGE_INNER_CLASS}>
          <SettingsEditor />
        </div>
      </div>
    </>
  );
}
