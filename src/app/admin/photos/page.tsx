import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";

export const metadata: Metadata = {
  title: "Photos",
};

export default function PhotosPage() {
  return (
    <>
      <AdminHeader title="Photos" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-sand/8 bg-charcoal/30 p-8 text-center">
            <p className="body-text text-ivory/40">
              Photo gallery management coming soon.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
