import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  ADMIN_PAGE_INNER_CLASS,
  ADMIN_PAGE_OUTER_CLASS,
} from "@/lib/admin-pending-layout";
import { AudioEditorSkeleton } from "./audio-editor-skeleton";

const AudioEditor = dynamic(
  () => import("./audio-editor").then((m) => ({ default: m.AudioEditor })),
  { loading: () => <AudioEditorSkeleton /> },
);

export const metadata: Metadata = {
  title: "Audio",
};

export default function AudioPage() {
  return (
    <>
      <AdminHeader title="Audio" />
      <div className={ADMIN_PAGE_OUTER_CLASS}>
        <div className={ADMIN_PAGE_INNER_CLASS}>
          <AudioEditor />
        </div>
      </div>
    </>
  );
}
