"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
} from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatInquiryTimestamp } from "@/lib/format-inquiry-timestamp";
import { InquiriesQueryErrorBoundary } from "@/components/admin/inquiries-query-error-boundary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type InquiryRowData = {
  readonly _id: string;
  readonly artistName: string;
  readonly contactName: string;
  readonly email: string;
  readonly phone: string | undefined;
  readonly message: string;
  readonly createdAt: number;
};

const COLUMN_COUNT = 6;

function InquiriesTable({ rows }: { readonly rows: ReadonlyArray<InquiryRowData> }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-10" aria-label="Expand row" />
            <TableHead>Artist</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-right">Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isOpen = openId === row._id;
            const panelId = `inquiry-panel-${row._id}`;
            const toggle = () => setOpenId(isOpen ? null : row._id);

            return (
              <Fragment key={row._id}>
                <TableRow
                  className={cn(
                    "cursor-pointer",
                    isOpen && "border-b-0",
                  )}
                  onClick={toggle}
                  data-state={isOpen ? "selected" : undefined}
                >
                  <TableCell className="w-10">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      aria-label={`${isOpen ? "Collapse" : "Expand"} inquiry from ${row.artistName}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggle();
                      }}
                      className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          "size-4 transition-transform duration-200",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {row.artistName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.contactName}
                  </TableCell>
                  <TableCell className="max-w-[14rem] truncate">
                    <a
                      className="text-primary underline-offset-2 hover:underline"
                      href={`mailto:${row.email}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {row.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    {row.phone ? (
                      <a
                        className="text-primary underline-offset-2 hover:underline"
                        href={`tel:${row.phone}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {row.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    <time dateTime={new Date(row.createdAt).toISOString()}>
                      {formatInquiryTimestamp(row.createdAt)}
                    </time>
                  </TableCell>
                </TableRow>
                <TableRow
                  id={panelId}
                  role="region"
                  aria-label={`Message from ${row.artistName}`}
                  hidden={!isOpen}
                  className="bg-muted/20 hover:bg-muted/20"
                >
                  <TableCell />
                  <TableCell
                    colSpan={COLUMN_COUNT - 1}
                    className="whitespace-normal py-4 pr-4"
                  >
                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Message
                    </h4>
                    <p className="body-text-small max-h-72 overflow-y-auto whitespace-pre-wrap break-words text-foreground">
                      {row.message}
                    </p>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function InquiriesTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-card"
      aria-busy="true"
      aria-label="Loading inquiries"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-10" />
            <TableHead>Artist</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-right">Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i} className="animate-pulse">
              <TableCell>
                <div className="size-4 rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-3 w-32 rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-3 w-24 rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-3 w-40 rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-3 w-24 rounded bg-muted" />
              </TableCell>
              <TableCell className="text-right">
                <div className="ml-auto h-3 w-28 rounded bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InquiriesListBody() {
  const rows = useQuery(api.admin.inquiries.listForAdmin, {});

  if (rows === undefined) {
    return <InquiriesTableSkeleton />;
  }

  if (rows.length === 0) {
    return (
      <p className="body-text text-muted-foreground rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
        No contact submissions yet. New inquiries from the site form will appear here.
      </p>
    );
  }

  return <InquiriesTable rows={rows} />;
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
