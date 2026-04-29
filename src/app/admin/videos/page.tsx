import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/admin-header";
import { VideosEditorSkeleton } from "./videos-editor-skeleton";

const VideosEditor = dynamic(
  () =>
    import("./videos-editor").then((m) => ({ default: m.VideosEditor })),
  { loading: () => <VideosEditorSkeleton /> },
);

export const metadata: Metadata = {
  title: "Videos",
};

export default function VideosPage() {
  return (
    <>
      <AdminHeader title="Videos" />
      <div className="flex-1 px-5 py-8 pb-12 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <VideosEditor />
        </div>
      </div>
    </>
  );
}
