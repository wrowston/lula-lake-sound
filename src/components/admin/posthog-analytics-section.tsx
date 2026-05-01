import {
  getPostHogAdminAnalytics,
  type PostHogAnalyticsState,
  type PostHogPathTrafficRow,
} from "@/lib/posthog-server";
import { PostHogAreaChart } from "./posthog-area-chart";

const formatter = new Intl.NumberFormat("en-US");
const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
] as const;

function AnalyticsSetupInstructions({
  analytics,
}: {
  readonly analytics: Extract<PostHogAnalyticsState, { status: "unconfigured" }>;
}) {
  return (
    <section className="rounded-lg border border-dashed border-border bg-card p-5">
      <h2 className="headline-secondary mb-1 text-sm text-foreground">
        Configure analytics
      </h2>
      <p className="body-text-small text-muted-foreground">
        Add {analytics.missing.join(", ")} in Vercel to show dashboard metrics.
        The PostHog API key only needs HogQL query read access and stays server-only.
      </p>
      <p className="body-text-small mt-3 text-muted-foreground">
        Optional: set POSTHOG_HOST for EU projects, for example
        https://eu.posthog.com.
      </p>
    </section>
  );
}

function PathTrafficByPath({
  rows,
}: {
  readonly rows: readonly PostHogPathTrafficRow[];
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="headline-secondary mb-1 text-sm text-foreground">
        Traffic by path
      </h3>
      <p className="body-text-small text-muted-foreground">
        Pageviews by URL path (PostHog{" "}
        <span className="font-mono text-xs">properties.$pathname</span>), last
        30 days. Up to 15 paths.
      </p>
      {rows.length === 0 ? (
        <p className="body-text-small mt-4 text-muted-foreground">
          No pageview data in this period.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium" scope="col">
                  Path
                </th>
                <th
                  className="py-2 text-right font-medium tabular-nums"
                  scope="col"
                >
                  Pageviews
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${index}-${row.path}`}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="max-w-[min(28rem,55vw)] truncate py-2 pr-4 font-mono text-foreground">
                    {row.path}
                  </td>
                  <td className="py-2 text-right tabular-nums text-foreground">
                    {formatter.format(row.views)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnalyticsUnavailable() {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="headline-secondary mb-1 text-sm text-foreground">
        Analytics unavailable
      </h2>
      <p className="body-text-small text-muted-foreground">
        PostHog metrics could not be loaded right now.
      </p>
    </section>
  );
}

export async function PostHogAnalyticsSection() {
  const analytics = await getPostHogAdminAnalytics();

  if (analytics.status === "unconfigured") {
    return <AnalyticsSetupInstructions analytics={analytics} />;
  }

  if (analytics.status === "error") {
    return <AnalyticsUnavailable />;
  }

  return (
    <section aria-labelledby="analytics-heading" className="space-y-3">
      <div>
        <h2
          id="analytics-heading"
          className="headline-secondary text-foreground text-sm"
        >
          Analytics
        </h2>
        <p className="body-text-small text-muted-foreground">
          Server-rendered PostHog activity. Metrics refresh about every 5
          minutes.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {analytics.metrics.map((metric) => (
          <article
            key={`${metric.label}-${metric.description}`}
            className="rounded-lg border border-border bg-card p-5"
          >
            <p className="body-text-small mb-2 text-muted-foreground">
              {metric.label}
            </p>
            <p className="headline-primary text-3xl text-foreground">
              {formatter.format(metric.value)}
            </p>
            <p className="body-text-small mt-2 text-muted-foreground">
              {metric.description}
            </p>
          </article>
        ))}
      </div>
      <div
        aria-label="Analytics trend charts"
        className="grid gap-4 lg:grid-cols-3"
      >
        {analytics.chartSeries.map((series, index) => (
          <PostHogAreaChart
            key={`${series.label}-${series.description}`}
            color={chartColors[index] ?? "var(--chart-1)"}
            series={series}
          />
        ))}
      </div>
      <PathTrafficByPath rows={analytics.pathTraffic} />
    </section>
  );
}
