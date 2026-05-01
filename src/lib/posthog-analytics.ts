import "server-only";

type PostHogQueryResponse = {
  readonly results?: readonly (readonly unknown[])[];
};

export type AdminAnalyticsTile = {
  readonly label: string;
  readonly value: number;
  readonly description: string;
};

export type AdminAnalyticsState =
  | {
      readonly status: "ready";
      readonly tiles: readonly AdminAnalyticsTile[];
    }
  | {
      readonly status: "unconfigured";
      readonly missing: readonly string[];
    }
  | {
      readonly status: "error";
    };

const THIRTY_DAYS = "timestamp >= now() - interval 30 day";

const QUERIES = [
  {
    label: "Visitors",
    description: "Unique visitors in the last 30 days",
    query: `select count(distinct person_id) from events where ${THIRTY_DAYS}`,
  },
  {
    label: "Pageviews",
    description: "Pageviews in the last 30 days",
    query: `select count() from events where event = '$pageview' and ${THIRTY_DAYS}`,
  },
  {
    label: "Inquiries",
    description: "Contact inquiries saved in the last 30 days",
    query: `select count() from events where event = 'inquiry_saved' and ${THIRTY_DAYS}`,
  },
] as const;

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function normalizePostHogHost(host: string | undefined): string | undefined {
  if (!host) return undefined;

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
    return undefined;
  }
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

async function fetchJson<T>(
  url: string,
  apiKey: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`PostHog request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function queryMetric({
  host,
  apiKey,
  projectId,
  query,
}: {
  readonly host: string;
  readonly apiKey: string;
  readonly projectId: string;
  readonly query: string;
}): Promise<number> {
  const response = await fetchJson<PostHogQueryResponse>(
    `${host}/api/projects/${projectId}/query/`,
    apiKey,
    {
      method: "POST",
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query,
        },
      }),
    },
  );

  return numericResult(response);
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsState> {
  const apiKey = firstEnv("POSTHOG_API_KEY");
  const projectId = firstEnv("POSTHOG_PROJECT_ID");
  const host = normalizePostHogHost(
    firstEnv("POSTHOG_HOST", "NEXT_PUBLIC_POSTHOG_HOST"),
  );

  const missing = [
    apiKey ? null : "POSTHOG_API_KEY",
    host ? null : "POSTHOG_HOST",
    projectId ? null : "POSTHOG_PROJECT_ID",
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0 || !apiKey || !host || !projectId) {
    return { status: "unconfigured", missing };
  }

  try {
    const values = await Promise.all(
      QUERIES.map((metric) =>
        queryMetric({ host, apiKey, projectId, query: metric.query }),
      ),
    );

    return {
      status: "ready",
      tiles: QUERIES.map((metric, index) => ({
        label: metric.label,
        description: metric.description,
        value: values[index] ?? 0,
      })),
    };
  } catch (error) {
    console.warn(
      "PostHog analytics query failed.",
      error instanceof Error ? error.message : error,
    );
    return { status: "error" };
  }
}
