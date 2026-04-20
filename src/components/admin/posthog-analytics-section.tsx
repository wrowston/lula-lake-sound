import Link from "next/link";
import { unstable_cache } from "next/cache";
import { BarChart3, ExternalLink } from "lucide-react";
import { POSTHOG_EVENTS } from "@/lib/analytics-events";
import { isPostHogConfigured, posthogQueryScalar } from "@/lib/posthog-server";

const eventPricingCta = POSTHOG_EVENTS.PRICING_BOOK_SESSION_CLICK;

async function loadMetrics() {
  const [
    pageviews7d,
    pageviews30d,
    pricingCta7d,
    pricingCta30d,
    homePageviews7d,
  ] = await Promise.all([
    posthogQueryScalar(
      `SELECT count() AS n FROM events
       WHERE event = '$pageview'
       AND timestamp >= now() - INTERVAL 7 DAY`,
      "cms_pageviews_7d"
    ),
    posthogQueryScalar(
      `SELECT count() AS n FROM events
       WHERE event = '$pageview'
       AND timestamp >= now() - INTERVAL 30 DAY`,
      "cms_pageviews_30d"
    ),
    posthogQueryScalar(
      `SELECT count() AS n FROM events
       WHERE event = '${eventPricingCta}'
       AND timestamp >= now() - INTERVAL 7 DAY`,
      "cms_pricing_cta_7d"
    ),
    posthogQueryScalar(
      `SELECT count() AS n FROM events
       WHERE event = '${eventPricingCta}'
       AND timestamp >= now() - INTERVAL 30 DAY`,
      "cms_pricing_cta_30d"
    ),
    posthogQueryScalar(
      `SELECT count() AS n FROM events
       WHERE event = '$pageview'
       AND timestamp >= now() - INTERVAL 7 DAY
       AND (properties.$pathname = '/' OR properties.$pathname = '')`,
      "cms_home_pageviews_7d"
    ),
  ]);

  return {
    pageviews7d,
    pageviews30d,
    pricingCta7d,
    pricingCta30d,
    homePageviews7d,
  };
}

const getCachedMetrics = unstable_cache(loadMetrics, ["admin-posthog-metrics"], {
  revalidate: 300,
});

function StatCard({
  label,
  result,
  hint,
}: {
  label: string;
  result: Awaited<ReturnType<typeof posthogQueryScalar>>;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="body-text-small text-muted-foreground mb-1">{label}</p>
      {result.ok ? (
        <p className="headline-secondary text-foreground text-2xl tabular-nums">
          {result.value.toLocaleString()}
        </p>
      ) : (
        <p className="body-text-small text-destructive">{result.error}</p>
      )}
      {hint ? (
        <p className="body-text-small text-muted-foreground mt-2">{hint}</p>
      ) : null}
    </div>
  );
}

export async function PosthogAnalyticsSection() {
  if (!isPostHogConfigured()) {
    return (
      <section className="rounded-lg border border-dashed border-border bg-muted/30 p-5">
        <div className="flex items-start gap-3">
          <BarChart3 className="size-5 shrink-0 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="headline-secondary text-foreground text-sm mb-1">
              Analytics
            </h3>
            <p className="body-text-small text-muted-foreground">
              Set{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                POSTHOG_PERSONAL_API_KEY
              </code>{" "}
              and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                POSTHOG_PROJECT_ID
              </code>{" "}
              (and optionally{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                POSTHOG_HOST
              </code>{" "}
              for EU) to show PostHog metrics here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const m = await getCachedMetrics();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="headline-secondary text-foreground text-sm mb-1">
            Analytics (PostHog)
          </h3>
          <p className="body-text-small text-muted-foreground">
            Cached ~5 min. Pricing CTA counts use event{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {eventPricingCta}
            </code>
            .
          </p>
        </div>
        <Link
          href={(process.env.POSTHOG_HOST ?? "https://us.posthog.com").replace(
            /\/$/,
            ""
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 body-text-small text-muted-foreground hover:text-foreground transition-colors"
        >
          Open PostHog
          <ExternalLink className="size-3.5" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Pageviews (7 days)" result={m.pageviews7d} />
        <StatCard label="Pageviews (30 days)" result={m.pageviews30d} />
        <StatCard
          label="Home pageviews (7 days)"
          result={m.homePageviews7d}
          hint="$pageview where pathname is /"
        />
        <StatCard
          label="Pricing — Book session clicks (7 days)"
          result={m.pricingCta7d}
          hint="Requires client instrumentation"
        />
        <StatCard
          label="Pricing — Book session clicks (30 days)"
          result={m.pricingCta30d}
          hint="Requires client instrumentation"
        />
      </div>
    </section>
  );
}
