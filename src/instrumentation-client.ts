import * as Sentry from "@sentry/nextjs";
import {
  getClientSentryDsn,
  getSentryEnvironment,
  getSentryRelease,
  getTracesSampleRate,
  isSentryEnabled,
  scrubSentryBreadcrumb,
  scrubSentryEvent,
} from "@/lib/sentry";

const dsn = getClientSentryDsn();

if (dsn && isSentryEnabled()) {
  Sentry.init({
    dsn,
    environment: getSentryEnvironment(),
    release: getSentryRelease(),
    sendDefaultPii: false,
    tracesSampleRate: getTracesSampleRate(),
    beforeSend: scrubSentryEvent,
    beforeSendTransaction: scrubSentryEvent,
    beforeBreadcrumb: scrubSentryBreadcrumb,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
