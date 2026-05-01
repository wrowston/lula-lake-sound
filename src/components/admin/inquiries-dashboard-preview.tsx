"use client";

import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
} from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatInquiryTimestamp } from "@/lib/format-inquiry-timestamp";
import { InquiriesQueryErrorBoundary } from "@/components/admin/inquiries-query-error-boundary";

const DASHBOARD_PREVIEW_LIMIT = 5;

function RecentInquiriesPreviewBody() {
  const rows = useQuery(api.admin.inquiries.listForAdmin, {});

  if (rows === undefined) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex animate-pulse gap-3 border-b border-border/60 pb-3 last:border-0">
            <div className="h-10 w-10 shrink-0 rounded-md bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-3 w-full max-w-xs rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="body-text-small text-muted-foreground py-2">
        No submissions yet. They will show up here when visitors use the contact form.
      </p>
    );
  }

  const slice = rows.slice(0, DASHBOARD_PREVIEW_LIMIT);

  return (
    <ul className="divide-y divide-border/60">
      {slice.map((row) => (
        <li key={row._id} className="flex gap-3 py-3 first:pt-0">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
            aria-hidden
          >
            <Inbox className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="body-text-small truncate font-medium text-foreground">
              {row.artistName}
            </p>
            <p className="body-text-small truncate text-muted-foreground">
              {row.contactName} · {row.email}
            </p>
            <p className="body-text-small mt-0.5 text-muted-foreground">
              <time dateTime={new Date(row.createdAt).toISOString()}>
                {formatInquiryTimestamp(row.createdAt)}
              </time>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function InquiriesDashboardPreview() {
  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="headline-secondary text-foreground text-base">
            Recent contact submissions
          </h2>
          <p className="body-text-small text-muted-foreground mt-0.5">
            Newest inquiries from the public form (read-only).
          </p>
        </div>
        <Link
          href="/admin/inquiries"
          className="body-text-small inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          View all
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>

      <AuthLoading>
        <p className="body-text-small text-muted-foreground">Authenticating…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="body-text-small text-muted-foreground">
          Sign in to see recent submissions.
        </p>
      </Unauthenticated>

      <Authenticated>
        <InquiriesQueryErrorBoundary>
          <RecentInquiriesPreviewBody />
        </InquiriesQueryErrorBoundary>
      </Authenticated>
    </section>
  );
}
