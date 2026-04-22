import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/admin-header";

const AudioEditor = dynamic(
  () => import("./audio-editor").then((m) => ({ default: m.AudioEditor })),
  {
    loading: () => (
      <p className="body-text text-muted-foreground">Loading audio…</p>
    ),
  },
);

export const metadata: Metadata = {
  title: "Audio",
};

export default function AudioPage() {
  return (
    <>
      <AdminHeader title="Audio" />
      <div className="flex-1 px-5 py-8 pb-12 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <AudioEditor />
        </div>
      </div>
    </>
  );
}
