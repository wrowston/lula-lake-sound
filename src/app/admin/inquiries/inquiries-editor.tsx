"use client";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
} from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatInquiryTimestamp } from "@/lib/format-inquiry-timestamp";
import { InquiriesQueryErrorBoundary } from "@/components/admin/inquiries-query-error-boundary";

function InquiryRow({
  artistName,
  contactName,
  email,
  phone,
  message,
  createdAt,
}: {
  readonly artistName: string;
  readonly contactName: string;
  readonly email: string;
  readonly phone: string | undefined;
  readonly message: string;
  readonly createdAt: number;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="headline-secondary text-foreground text-base">
          {artistName}
        </h3>
        <time
          className="body-text-small shrink-0 text-muted-foreground"
          dateTime={new Date(createdAt).toISOString()}
        >
          {formatInquiryTimestamp(createdAt)}
        </time>
      </div>
      <dl className="body-text-small grid gap-2 text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="sr-only">Contact name</dt>
          <dd>
            <span className="text-foreground/80">Contact: </span>
            {contactName}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Email</dt>
          <dd className="min-w-0 break-all">
            <span className="text-foreground/80">Email: </span>
            <a className="text-primary underline-offset-2 hover:underline" href={`mailto:${email}`}>
              {email}
            </a>
          </dd>
        </div>
        {phone ? (
          <div className="sm:col-span-2">
            <dt className="sr-only">Phone</dt>
            <dd className="min-w-0 break-all">
              <span className="text-foreground/80">Phone: </span>
              <a className="text-primary underline-offset-2 hover:underline" href={`tel:${phone}`}>
                {phone}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-4 border-t border-border pt-3">
        <h4 className="sr-only">Message</h4>
        <p className="body-text-small max-h-64 overflow-y-auto whitespace-pre-wrap break-words text-foreground">
          {message}
        </p>
      </div>
    </article>
  );
}

function InquiriesListBody() {
  const rows = useQuery(api.admin.inquiries.listForAdmin, {});

  if (rows === undefined) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading inquiries">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-border/60 bg-muted/20 p-5"
          >
            <div className="mb-3 h-5 w-48 rounded bg-muted" />
            <div className="mb-2 h-3 w-full max-w-md rounded bg-muted" />
            <div className="h-3 w-full max-w-sm rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="body-text text-muted-foreground rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
        No contact submissions yet. New inquiries from the site form will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <InquiryRow
          key={row._id}
          artistName={row.artistName}
          contactName={row.contactName}
          email={row.email}
          phone={row.phone}
          message={row.message}
          createdAt={row.createdAt}
        />
      ))}
    </div>
  );
}

export function InquiriesEditor() {
  return (
    <>
      <AuthLoading>
        <p className="body-text text-muted-foreground">Authenticating…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="body-text text-muted-foreground">
          Sign in to view contact submissions.
        </p>
      </Unauthenticated>

      <Authenticated>
        <InquiriesQueryErrorBoundary>
          <InquiriesListBody />
        </InquiriesQueryErrorBoundary>
      </Authenticated>
    </>
  );
}
