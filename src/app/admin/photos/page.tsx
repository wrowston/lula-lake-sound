import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  ADMIN_PAGE_INNER_CLASS,
  ADMIN_PAGE_OUTER_CLASS,
} from "@/lib/admin-pending-layout";
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
      <div className={ADMIN_PAGE_OUTER_CLASS}>
        <div className={ADMIN_PAGE_INNER_CLASS}>
          <PhotosEditor />
        </div>
      </div>
    </>
  );
}
