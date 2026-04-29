import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/admin-header";

const VideosEditor = dynamic(
  () =>
    import("./videos-editor").then((m) => ({ default: m.VideosEditor })),
  {
    loading: () => (
      <p className="body-text text-muted-foreground">Loading videos…</p>
    ),
  },
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
