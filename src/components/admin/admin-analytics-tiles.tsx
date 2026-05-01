import type { AdminAnalyticsState } from "@/lib/posthog-analytics";

const formatter = new Intl.NumberFormat("en-US");

export function AdminAnalyticsTiles({
  analytics,
}: {
  readonly analytics: AdminAnalyticsState;
}) {
  if (analytics.status === "unconfigured") {
    return (
      <section className="rounded-lg border border-dashed border-border bg-card p-5">
        <h2 className="headline-secondary mb-1 text-sm text-foreground">
          Configure analytics
        </h2>
        <p className="body-text-small text-muted-foreground">
          Add {analytics.missing.join(", ")} in Vercel to show dashboard metrics.
        </p>
      </section>
    );
  }

  if (analytics.status === "error") {
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
          PostHog activity from the last 30 days.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {analytics.tiles.map((tile) => (
          <article
            key={tile.label}
            className="rounded-lg border border-border bg-card p-5"
          >
            <p className="body-text-small mb-2 text-muted-foreground">
              {tile.label}
            </p>
            <p className="headline-primary text-3xl text-foreground">
              {formatter.format(tile.value)}
            </p>
            <p className="body-text-small mt-2 text-muted-foreground">
              {tile.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
