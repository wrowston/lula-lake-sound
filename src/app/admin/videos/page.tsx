import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  ADMIN_PAGE_INNER_CLASS,
  ADMIN_PAGE_OUTER_CLASS,
} from "@/lib/admin-pending-layout";
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
      <div className={ADMIN_PAGE_OUTER_CLASS}>
        <div className={ADMIN_PAGE_INNER_CLASS}>
          <VideosEditor />
        </div>
      </div>
    </>
  );
}
