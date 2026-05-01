import {
  getPostHogAdminAnalytics,
  type PostHogAnalyticsState,
} from "@/lib/posthog-server";

const formatter = new Intl.NumberFormat("en-US");

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
        The PostHog Personal API key only needs HogQL query read access and stays
        server-only.
      </p>
      <p className="body-text-small mt-3 text-muted-foreground">
        Optional: set POSTHOG_HOST for EU projects, for example
        https://eu.posthog.com.
      </p>
    </section>
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
    </section>
  );
}
