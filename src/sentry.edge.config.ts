import * as Sentry from "@sentry/nextjs";
import {
  createSentryInitialScopeUpdater,
  getSentryEnvironment,
  getSentryRelease,
  getServerSentryDsn,
  getTracesSampleRate,
  isSentryEnabled,
  scrubSentryBreadcrumb,
  scrubSentryEvent,
} from "@/lib/sentry";

const dsn = getServerSentryDsn();

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
