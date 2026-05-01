import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  ADMIN_PAGE_INNER_CLASS,
  ADMIN_PAGE_OUTER_CLASS,
} from "@/lib/admin-pending-layout";

const InquiriesEditor = dynamic(
  () =>
    import("./inquiries-editor").then((m) => ({ default: m.InquiriesEditor })),
  {
    loading: () => (
      <div className="space-y-4" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-border/60 bg-muted/20 p-5"
          >
            <div className="mb-3 h-5 w-40 rounded bg-muted" />
            <div className="h-3 w-full max-w-lg rounded bg-muted" />
          </div>
        ))}
      </div>
    ),
  },
);

export const metadata: Metadata = {
  title: "Contact submissions",
};

export default function AdminInquiriesPage() {
  return (
    <>
      <AdminHeader title="Contact submissions" />
      <div className={ADMIN_PAGE_OUTER_CLASS}>
        <div className={`${ADMIN_PAGE_INNER_CLASS} space-y-6`}>
          <div>
            <p className="body-text-small text-muted-foreground max-w-2xl">
              Read-only list of inquiries saved from the public contact form (newest first).
              Email delivery may still be used for notifications; this view is the in-dashboard record.
            </p>
          </div>
          <InquiriesEditor />
        </div>
      </div>
    </>
  );
}
