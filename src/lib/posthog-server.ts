import "server-only";

import { unstable_cache } from "next/cache";
import { PostHog } from "posthog-node";
import { POSTHOG_EVENTS } from "@/lib/analytics-events";

let posthogClient: PostHog | null = null;

type PostHogQueryResponse = {
  readonly results?: readonly (readonly unknown[])[];
};

export type PostHogAnalyticsMetric = {
  readonly label: string;
  readonly value: number;
  readonly description: string;
};

export type PostHogAnalyticsState =
  | {
      readonly status: "ready";
      readonly metrics: readonly PostHogAnalyticsMetric[];
    }
  | {
      readonly status: "unconfigured";
      readonly missing: readonly string[];
    }
  | {
      readonly status: "error";
    };

const POSTHOG_QUERY_CACHE_SECONDS = 300;
const DEFAULT_POSTHOG_HOST = "https://us.posthog.com";

const ADMIN_ANALYTICS_QUERIES = [
  {
    label: "Site pageviews",
    description: "Last 7 days",
    query: pageviewCountQuery({ days: 7 }),
  },
  {
    label: "Site pageviews",
    description: "Last 30 days",
    query: pageviewCountQuery({ days: 30 }),
  },
  {
    label: "Home pageviews",
    description: "Last 7 days",
    query: pageviewCountQuery({ days: 7, path: "/" }),
  },
  {
    label: "Pricing — Book session clicks",
    description: "Last 7 days",
    query: eventCountQuery({
      eventName: POSTHOG_EVENTS.PRICING_BOOK_SESSION_CLICK,
      days: 7,
    }),
  },
  {
    label: "Pricing — Book session clicks",
    description: "Last 30 days",
    query: eventCountQuery({
      eventName: POSTHOG_EVENTS.PRICING_BOOK_SESSION_CLICK,
      days: 30,
    }),
  },
] as const;

export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(
      firstEnv(
        "NEXT_PUBLIC_POSTHOG_KEY",
        "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN",
      )!,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      },
    );
  }
  return posthogClient;
}

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function normalizePostHogHost(host: string | undefined): string {
  if (!host) return DEFAULT_POSTHOG_HOST;

  try {
    const url = new URL(host);
    url.hostname = url.hostname
      .replace(/^us\.i\.posthog\.com$/, "us.posthog.com")
      .replace(/^eu\.i\.posthog\.com$/, "eu.posthog.com");
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_POSTHOG_HOST;
  }
}

function hogqlString(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function pageviewCountQuery({
  days,
  path,
}: {
  readonly days: number;
  readonly path?: string;
}): string {
  const filters = [
    "event = '$pageview'",
    `timestamp >= now() - interval ${days} day`,
    path ? `properties.$pathname = ${hogqlString(path)}` : null,
  ].filter(Boolean);

  return `select count() from events where ${filters.join(" and ")}`;
}

function eventCountQuery({
  eventName,
  days,
}: {
  readonly eventName: string;
  readonly days: number;
}): string {
  return `select count() from events where event = ${hogqlString(
    eventName,
  )} and timestamp >= now() - interval ${days} day`;
}

function numericResult(response: PostHogQueryResponse): number {
  const value = response.results?.[0]?.[0];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

async function queryPostHogMetric({
  host,
  personalApiKey,
  projectId,
  query,
}: {
  readonly host: string;
  readonly personalApiKey: string;
  readonly projectId: string;
  readonly query: string;
}): Promise<number> {
  const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${personalApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: {
        kind: "HogQLQuery",
        query,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`PostHog query failed: ${response.status}`);
  }

  return numericResult((await response.json()) as PostHogQueryResponse);
}

async function loadPostHogAdminAnalytics(): Promise<PostHogAnalyticsState> {
  const apiKey = firstEnv("POSTHOG_API_KEY");
  const projectId = firstEnv("POSTHOG_PROJECT_ID");
  const host = normalizePostHogHost(firstEnv("POSTHOG_HOST"));
  const missing = [
    apiKey ? null : "POSTHOG_API_KEY",
    projectId ? null : "POSTHOG_PROJECT_ID",
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0 || !apiKey || !projectId) {
    return { status: "unconfigured", missing };
  }

  try {
    const values = await Promise.all(
      ADMIN_ANALYTICS_QUERIES.map((metric) =>
        queryPostHogMetric({
          host,
          personalApiKey: apiKey,
          projectId,
          query: metric.query,
        }),
      ),
    );

    return {
      status: "ready",
      metrics: ADMIN_ANALYTICS_QUERIES.map((metric, index) => ({
        label: metric.label,
        description: metric.description,
        value: values[index] ?? 0,
      })),
    };
  } catch (error) {
    console.warn(
      "PostHog admin analytics query failed.",
      error instanceof Error ? error.message : error,
    );
    return { status: "error" };
  }
}

export const getPostHogAdminAnalytics = unstable_cache(
  loadPostHogAdminAnalytics,
  ["posthog-admin-analytics"],
  { revalidate: POSTHOG_QUERY_CACHE_SECONDS },
);
