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

export type PostHogAnalyticsSeriesPoint = {
  readonly date: string;
  readonly value: number;
};

export type PostHogAnalyticsSeries = {
  readonly label: string;
  readonly description: string;
  readonly data: readonly PostHogAnalyticsSeriesPoint[];
};

export type PostHogAnalyticsState =
  | {
      readonly status: "ready";
      readonly metrics: readonly PostHogAnalyticsMetric[];
      readonly chartSeries: readonly PostHogAnalyticsSeries[];
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

const ADMIN_ANALYTICS_SERIES_QUERIES = [
  {
    label: "Site pageviews",
    description: "Last 30 days",
    days: 30,
    query: pageviewSeriesQuery({ days: 30 }),
  },
  {
    label: "Home pageviews",
    description: "Last 30 days",
    days: 30,
    query: pageviewSeriesQuery({ days: 30, path: "/" }),
  },
  {
    label: "Pricing — Book session clicks",
    description: "Last 30 days",
    days: 30,
    query: eventSeriesQuery({
      eventName: POSTHOG_EVENTS.PRICING_BOOK_SESSION_CLICK,
      days: 30,
    }),
  },
] as const;

export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
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

function pageviewSeriesQuery({
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

  return `select toDate(timestamp) as date, count() from events where ${filters.join(
    " and ",
  )} group by date order by date asc`;
}

function eventSeriesQuery({
  eventName,
  days,
}: {
  readonly eventName: string;
  readonly days: number;
}): string {
  return `select toDate(timestamp) as date, count() from events where event = ${hogqlString(
    eventName,
  )} and timestamp >= now() - interval ${days} day group by date order by date asc`;
}

function numericResult(response: PostHogQueryResponse): number {
  return numericValue(response.results?.[0]?.[0]);
}

function numericValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function dateKey(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const key = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
}

function recentDateKeys(days: number): string[] {
  const today = new Date();
  const utcDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  return Array.from({ length: days + 1 }, (_, index) => {
    const date = new Date(utcDate);
    date.setUTCDate(date.getUTCDate() - (days - index));
    return date.toISOString().slice(0, 10);
  });
}

function seriesResult(
  response: PostHogQueryResponse,
  days: number,
): PostHogAnalyticsSeriesPoint[] {
  const valuesByDate = new Map<string, number>();

  for (const row of response.results ?? []) {
    const key = dateKey(row[0]);
    if (!key) continue;
    valuesByDate.set(key, numericValue(row[1]));
  }

  return recentDateKeys(days).map((date) => ({
    date,
    value: valuesByDate.get(date) ?? 0,
  }));
}

async function executeHogQLQuery({
  host,
  personalApiKey,
  projectId,
  query,
}: {
  readonly host: string;
  readonly personalApiKey: string;
  readonly projectId: string;
  readonly query: string;
}): Promise<PostHogQueryResponse> {
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

  return (await response.json()) as PostHogQueryResponse;
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
  const body = await executeHogQLQuery({
    host,
    personalApiKey,
    projectId,
    query,
  });
  return numericResult(body);
}

async function queryPostHogSeries({
  host,
  personalApiKey,
  projectId,
  query,
  days,
}: {
  readonly host: string;
  readonly personalApiKey: string;
  readonly projectId: string;
  readonly query: string;
  readonly days: number;
}): Promise<PostHogAnalyticsSeriesPoint[]> {
  const body = await executeHogQLQuery({
    host,
    personalApiKey,
    projectId,
    query,
  });
  return seriesResult(body, days);
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
    const valuesPromise = Promise.all(
      ADMIN_ANALYTICS_QUERIES.map((metric) =>
        queryPostHogMetric({
          host,
          personalApiKey: apiKey,
          projectId,
          query: metric.query,
        }),
      ),
    );
    const seriesValuesPromise = Promise.all(
      ADMIN_ANALYTICS_SERIES_QUERIES.map((series) =>
        queryPostHogSeries({
          host,
          personalApiKey: apiKey,
          projectId,
          query: series.query,
          days: series.days,
        }),
      ),
    );

    const [values, seriesValues] = await Promise.all([
      valuesPromise,
      seriesValuesPromise,
    ]);

    return {
      status: "ready",
      metrics: ADMIN_ANALYTICS_QUERIES.map((metric, index) => ({
        label: metric.label,
        description: metric.description,
        value: values[index] ?? 0,
      })),
      chartSeries: ADMIN_ANALYTICS_SERIES_QUERIES.map((series, index) => ({
        label: series.label,
        description: series.description,
        data: seriesValues[index] ?? [],
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
