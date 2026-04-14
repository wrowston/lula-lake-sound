import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { SettingsEditor } from "./settings-editor";

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
