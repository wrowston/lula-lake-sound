import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { AmenitiesEditorSkeleton } from "./amenities-editor-skeleton";

const AmenitiesEditor = dynamic(
  () =>
    import("./amenities-editor").then((m) => ({ default: m.AmenitiesEditor })),
  { loading: () => <AmenitiesEditorSkeleton /> },
);

export const metadata: Metadata = {
  title: "Amenities nearby",
};

export default function AmenitiesNearbyAdminPage() {
  return (
    <>
      <AdminHeader title="Amenities nearby" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <AmenitiesEditor />
        </div>
      </div>
    </>
  );
}
