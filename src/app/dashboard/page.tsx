import { auth } from "@clerk/nextjs/server";
import { DashboardHomeClient } from "./dashboard-home-client";

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  return (
    <div className="min-h-screen bg-background px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <p className="text-muted-foreground text-xs uppercase tracking-widest">
            Inference Partners
          </p>
          <h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Clerk session is enforced by middleware; Convex receives the same user via
            the Clerk JWT template (audience{" "}
            <code className="text-foreground">convex</code>).
          </p>
        </header>
        <DashboardHomeClient
          serverOrgId={orgId ?? null}
          serverUserId={userId ?? null}
        />
      </div>
    </div>
  );
}
