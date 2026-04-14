import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
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
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <SettingsEditor />
        </div>
      </div>
    </>
  );
}
