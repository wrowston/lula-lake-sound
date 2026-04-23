import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { AudioAdmin } from "./audio-admin";

export const metadata: Metadata = {
  title: "Audio",
};

export default function AudioPage() {
  return (
    <>
      <AdminHeader title="Audio" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <AudioAdmin />
        </div>
      </div>
    </>
  );
}
