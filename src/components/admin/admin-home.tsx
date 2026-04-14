"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Show, useAuth } from "@clerk/nextjs";
import Link from "next/link";

export function AdminHome() {
  const { isLoaded } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Studio admin
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Only the studio owner (or allowlisted accounts) can use this area.
      </p>
      <div className="mt-8">
        {!isLoaded ? <p className="text-sm text-neutral-600">Loading…</p> : null}
        <Show
          when="signed-in"
          fallback={
            <Show when="signed-out">
              <p className="text-sm text-neutral-600">
                Sign in with your studio account to continue.{" "}
                <Link className="text-blue-700 underline" href="/">
                  Back to site
                </Link>
              </p>
            </Show>
          }
        >
          <AdminSignedInPanel />
        </Show>
      </div>
    </div>
  );
}

function AdminSignedInPanel() {
  const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
    useConvexAuth();

  const settings = useQuery(
    api.admin.cms.getForAdmin,
    convexAuthenticated ? {} : "skip"
  );
  const setDraft = useMutation(api.admin.cms.setDraft);
  const publishDraft = useMutation(api.admin.cms.publishDraft);

  if (convexAuthLoading) {
    return <p className="text-sm text-neutral-600">Connecting to Convex…</p>;
  }

  if (!convexAuthenticated) {
    return (
      <p className="text-sm text-neutral-600">
        Your session is not linked to Convex yet. Try refreshing the page.
      </p>
    );
  }

  if (settings === undefined) {
    return <p className="text-sm text-neutral-600">Loading settings…</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium text-neutral-900">Site settings</h2>
        {settings === null ? (
          <p className="mt-2 text-sm text-neutral-600">
            No settings row yet. Seed defaults from the Convex dashboard, then refresh.
          </p>
        ) : (
          <pre className="mt-3 max-h-64 overflow-auto rounded bg-neutral-50 p-3 text-xs text-neutral-800">
            {JSON.stringify(settings, null, 2)}
          </pre>
        )}
      </section>
      {settings !== null ? (
        <section className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            onClick={() =>
              void setDraft({
                draft: {
                  flags: { priceTabEnabled: !settings.published.flags.priceTabEnabled },
                  metadata: settings.published.metadata ?? undefined,
                },
              })
            }
          >
            Toggle price tab (save draft)
          </button>
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
            onClick={() => void publishDraft()}
          >
            Publish draft
          </button>
        </section>
      ) : null}
    </div>
  );
}
