import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  ADMIN_PAGE_INNER_CLASS,
  ADMIN_PAGE_OUTER_CLASS,
} from "@/lib/admin-pending-layout";
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
      <div className={ADMIN_PAGE_OUTER_CLASS}>
        <div className={ADMIN_PAGE_INNER_CLASS}>
          <AmenitiesEditor />
        </div>
      </div>
    </>
  );
}
