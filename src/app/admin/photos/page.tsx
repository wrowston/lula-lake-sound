import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/admin-header";
import { PhotosEditorSkeleton } from "./photos-editor-skeleton";

const PhotosEditor = dynamic(
  () => import("./photos-editor").then((m) => ({ default: m.PhotosEditor })),
  { loading: () => <PhotosEditorSkeleton /> },
);

export const metadata: Metadata = {
  title: "Photos",
};

export default function PhotosPage() {
  return (
    <>
      <AdminHeader title="Photos" />
      <div className="flex-1 px-5 py-8 pb-12 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <PhotosEditor />
        </div>
      </div>
    </>
  );
}
