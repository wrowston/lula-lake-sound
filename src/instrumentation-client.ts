import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import {
  applyRouteToSentryScope,
  createSentryInitialScopeUpdater,
  getClientSentryDsn,
  getSentryEnvironment,
  getSentryRelease,
  getTracesSampleRate,
  isSentryEnabled,
  scrubSentryBreadcrumb,
  scrubSentryEvent,
} from "@/lib/sentry";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}

const dsn = getClientSentryDsn();

if (dsn && isSentryEnabled()) {
  Sentry.init({
    dsn,
    environment: getSentryEnvironment(),
    release: getSentryRelease(),
    sendDefaultPii: false,
    tracesSampleRate: getTracesSampleRate(),
    initialScope: createSentryInitialScopeUpdater(),
    beforeSend: scrubSentryEvent,
    beforeSendTransaction: scrubSentryEvent,
    beforeBreadcrumb: scrubSentryBreadcrumb,
  });
}

export function onRouterTransitionStart(
  href: string,
  navigationType: string,
) {
  try {
    const path =
      typeof window !== "undefined"
        ? new URL(href, window.location.origin).pathname
        : undefined;
    applyRouteToSentryScope(Sentry.getCurrentScope(), path);
  } catch {
    applyRouteToSentryScope(
      Sentry.getCurrentScope(),
      typeof window !== "undefined" ? window.location.pathname : undefined,
    );
  }
  Sentry.captureRouterTransitionStart(href, navigationType);
}
