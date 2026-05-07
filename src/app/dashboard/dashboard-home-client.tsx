"use client";

import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export function DashboardHomeClient({
  serverUserId,
  serverOrgId,
}: {
  serverUserId: string | null;
  serverOrgId: string | null;
}) {
  const session = useQuery(api.inferencePartnersDashboard.currentSession);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-border/60 rounded-lg bg-card/40 px-4 py-3">
        <p className="text-muted-foreground text-sm">
          Signed in as <span className="text-foreground">{serverUserId}</span>
          {serverOrgId ? (
            <>
              {" "}
              · org <span className="text-foreground">{serverOrgId}</span>
            </>
          ) : null}
        </p>
        <UserButton />
      </div>

      <section className="rounded-lg border border-border/60 bg-card/30 p-4">
        <h2 className="font-medium text-sm">Convex identity</h2>
        <p className="mt-1 text-muted-foreground text-xs">
          Use <code className="text-foreground">tokenIdentifier</code> from{" "}
          <code className="text-foreground">ctx.auth.getUserIdentity()</code> for
          ownership checks (same value as below when access is ok).
        </p>
        <dl className="mt-4 space-y-2 font-mono text-xs">
          {session === undefined ? (
            <dd className="text-muted-foreground">Loading session…</dd>
          ) : session.access === "signed_out" ? (
            <dd className="text-muted-foreground">Not authenticated to Convex.</dd>
          ) : session.access === "forbidden" ? (
            <dd className="text-destructive">
              Convex rejected this identity (check{" "}
              <code className="text-foreground">
                INFERENCE_PARTNERS_TOKEN_IDENTIFIERS
              </code>{" "}
              on the Convex deployment).
            </dd>
          ) : (
            <>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                <dt className="shrink-0 text-muted-foreground">tokenIdentifier</dt>
                <dd className="break-all">{session.tokenIdentifier}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                <dt className="shrink-0 text-muted-foreground">subject</dt>
                <dd className="break-all">{session.subject}</dd>
              </div>
              {session.email ? (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                  <dt className="shrink-0 text-muted-foreground">email</dt>
                  <dd>{session.email}</dd>
                </div>
              ) : null}
              {session.name ? (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                  <dt className="shrink-0 text-muted-foreground">name</dt>
                  <dd>{session.name}</dd>
                </div>
              ) : null}
            </>
          )}
        </dl>
      </section>
    </div>
  );
}
