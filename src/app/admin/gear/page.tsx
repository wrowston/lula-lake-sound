import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";

export const metadata: Metadata = {
  title: "Gear",
};

export default function GearPage() {
  return (
    <>
      <AdminHeader title="Gear" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-sand/8 bg-charcoal/30 p-8 text-center">
            <p className="body-text text-ivory/40">
              Equipment management coming soon.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
