import * as Sentry from "@sentry/nextjs";
import {
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
    beforeSend: scrubSentryEvent,
    beforeSendTransaction: scrubSentryEvent,
    beforeBreadcrumb: scrubSentryBreadcrumb,
  });
}
