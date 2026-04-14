import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";

export const metadata: Metadata = {
  title: "Videos",
};

export default function VideosPage() {
  return (
    <>
      <AdminHeader title="Videos" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
            <p className="body-text text-muted-foreground">
              Video portfolio management coming soon.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
