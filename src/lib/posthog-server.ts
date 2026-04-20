import "server-only";

type HogQLQueryBody = {
  query: {
    kind: "HogQLQuery";
    query: string;
  };
  name: string;
};

export type PostHogScalarResult = {
  ok: true;
  value: number;
} | {
  ok: false;
  error: string;
};

function getPostHogConfig():
  | { host: string; projectId: string; apiKey: string }
  | null {
  const host = (process.env.POSTHOG_HOST ?? "https://us.posthog.com").replace(
    /\/$/,
    ""
  );
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim();
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  if (!projectId || !apiKey) {
    return null;
  }
  return { host, projectId, apiKey };
}

export function isPostHogConfigured(): boolean {
  return getPostHogConfig() !== null;
}

/**
 * Runs a HogQL query that returns a single numeric cell (e.g. SELECT count()).
 * Uses the Personal API key — never import this module from client components.
 */
export async function posthogQueryScalar(
  hogql: string,
  name: string
): Promise<PostHogScalarResult> {
  const cfg = getPostHogConfig();
  if (!cfg) {
    return { ok: false, error: "PostHog is not configured" };
  }

  const body: HogQLQueryBody = {
    query: {
      kind: "HogQLQuery",
      query: hogql,
    },
    name,
  };

  try {
    const res = await fetch(
      `${cfg.host}/api/projects/${cfg.projectId}/query/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify(body),
        next: { revalidate: 300 },
      }
    );

    const json: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        typeof json === "object" &&
        json !== null &&
        "detail" in json &&
        typeof (json as { detail: unknown }).detail === "string"
          ? (json as { detail: string }).detail
          : `PostHog API error (${res.status})`;
      return { ok: false, error: message };
    }

    if (
      typeof json !== "object" ||
      json === null ||
      !("results" in json) ||
      !Array.isArray((json as { results: unknown }).results)
    ) {
      return { ok: false, error: "Unexpected PostHog response" };
    }

    const results = (json as { results: unknown[] }).results;
    const first = results[0];
    const n =
      Array.isArray(first) && first.length > 0 && typeof first[0] === "number"
        ? first[0]
        : typeof first === "number"
          ? first
          : Number(first);

    if (!Number.isFinite(n)) {
      return { ok: false, error: "Could not parse PostHog result" };
    }

    return { ok: true, value: Math.round(n) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    return { ok: false, error: message };
  }
}
