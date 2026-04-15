const REDACTED = "[Filtered]";
const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|token|secret|password|clerk|session|request[_-]?body|response[_-]?body)/i;

type JsonRecord = Record<string, unknown>;

type SentryLikeEvent = {
  request?: unknown;
  user?: unknown;
};

type SentryLikeBreadcrumb = {
  data?: unknown;
};

function readNonEmptyEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scrubRecord(record: JsonRecord): void {
  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      record[key] = REDACTED;
      continue;
    }

    if (key === "headers" && isRecord(value)) {
      scrubRecord(value);
      continue;
    }

    if (
      (key === "request" || key === "response") &&
      isRecord(value)
    ) {
      scrubRequest(value);
    }
  }
}

function scrubRequest(request: JsonRecord): void {
  scrubRecord(request);

  if ("data" in request) {
    request.data = REDACTED;
  }

  if ("body" in request) {
    request.body = REDACTED;
  }

  if ("cookies" in request) {
    request.cookies = REDACTED;
  }
}

export function getSentryEnvironment(): string {
  return (
    readNonEmptyEnv(process.env.SENTRY_ENVIRONMENT) ??
    readNonEmptyEnv(process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT) ??
    readNonEmptyEnv(process.env.VERCEL_ENV) ??
    readNonEmptyEnv(process.env.NODE_ENV) ??
    "development"
  );
}

export function getSentryRelease(): string | undefined {
  return (
    readNonEmptyEnv(process.env.NEXT_PUBLIC_SENTRY_RELEASE) ??
    readNonEmptyEnv(process.env.SENTRY_RELEASE) ??
    readNonEmptyEnv(process.env.VERCEL_GIT_COMMIT_SHA) ??
    readNonEmptyEnv(process.env.VERCEL_DEPLOYMENT_ID)
  );
}

export function getClientSentryDsn(): string | undefined {
  return (
    readNonEmptyEnv(process.env.NEXT_PUBLIC_SENTRY_DSN) ??
    readNonEmptyEnv(process.env.SENTRY_DSN)
  );
}

export function getServerSentryDsn(): string | undefined {
  return (
    readNonEmptyEnv(process.env.SENTRY_DSN) ??
    readNonEmptyEnv(process.env.NEXT_PUBLIC_SENTRY_DSN)
  );
}

export function isSentryEnabled(): boolean {
  const explicitSetting = readNonEmptyEnv(
    process.env.SENTRY_ENABLED ?? process.env.NEXT_PUBLIC_SENTRY_ENABLED,
  );
  if (explicitSetting === "true") {
    return true;
  }

  if (explicitSetting === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "development";
}

export function getTracesSampleRate(): number {
  return process.env.NODE_ENV === "development" ? 1 : 0.1;
}

export function scrubSentryEvent<T extends SentryLikeEvent>(event: T): T {
  if (isRecord(event.request)) {
    scrubRequest(event.request);
  }

  if (isRecord(event.user)) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  return event;
}

export function scrubSentryBreadcrumb<T extends SentryLikeBreadcrumb>(
  breadcrumb: T
): T {
  if (isRecord(breadcrumb.data)) {
    scrubRecord(breadcrumb.data);
  }

  return breadcrumb;
}

export function isProductionSentryEnvironment(): boolean {
  return getSentryEnvironment() === "production";
}
