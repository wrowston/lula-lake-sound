import type { Breadcrumb, Event, Scope } from "@sentry/core";

const REDACTED = "[Filtered]";
const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|token|secret|password|clerk|session|request[_-]?body|response[_-]?body)/i;

/**
 * Safe Sentry attachment policy (tags, contexts, breadcrumbs):
 * - Tags: boolean-like strings such as `preview`, and coarse route buckets like `section`
 *   (no free-form user or draft copy).
 * - Contexts: non-PII deployment metadata only (`route` pathname, deployment host/id, git SHA).
 *   Never put draft body text, CMS fields, signed media URLs, or raw query strings here.
 * - Breadcrumbs: rely on scrubbing below; avoid attaching user-entered text or full URLs with secrets.
 */

type JsonRecord = Record<string, unknown>;

function readNonEmptyEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Vercel preview deployments (distinct from production traffic on the prod domain). */
export function isPreviewDeployment(): boolean {
  const env =
    readNonEmptyEnv(process.env.VERCEL_ENV) ??
    readNonEmptyEnv(process.env.NEXT_PUBLIC_VERCEL_ENV);
  return env === "preview";
}

export function isPreviewPathname(pathname: string | undefined): boolean {
  if (!pathname) {
    return false;
  }
  return pathname === "/preview" || pathname.startsWith("/preview/");
}

/**
 * `preview` tag for Sentry issue search (`preview:true` / `preview:false`).
 * True when URL is under `/preview` or the app runs on a Vercel preview deployment.
 */
export function computePreviewTag(pathname: string | undefined): "true" | "false" {
  return isPreviewPathname(pathname) || isPreviewDeployment() ? "true" : "false";
}

/**
 * Coarse site section for admin and public routes (no draft content).
 */
export function inferSectionFromPathname(
  pathname: string | undefined,
): string | undefined {
  if (!pathname) {
    return undefined;
  }

  const path = pathname.split("?")[0] ?? pathname;

  if (path === "/" || path === "/preview" || path.startsWith("/preview/")) {
    return "home";
  }

  const adminSection = /^\/admin\/([^/?#]+)/.exec(path);
  if (adminSection) {
    return adminSection[1];
  }
  if (path.startsWith("/admin")) {
    return "admin";
  }
  if (path.startsWith("/sign-in")) {
    return "sign-in";
  }
  if (path.startsWith("/sign-up")) {
    return "sign-up";
  }

  return undefined;
}

export function getDeploymentLabel(): string | undefined {
  return (
    readNonEmptyEnv(process.env.VERCEL_URL) ??
    readNonEmptyEnv(process.env.NEXT_PUBLIC_VERCEL_URL)
  );
}

export function getGitShaForSentry(): string | undefined {
  return (
    readNonEmptyEnv(process.env.VERCEL_GIT_COMMIT_SHA) ??
    readNonEmptyEnv(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA)
  );
}

function stripUrlQuery(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return trimmed;
  }
  try {
    const u = new URL(trimmed, "http://local.invalid");
    u.search = "";
    if (u.origin === "http://local.invalid") {
      return `${u.pathname}${u.hash}`;
    }
    return `${u.origin}${u.pathname}${u.hash}`;
  } catch {
    const q = trimmed.indexOf("?");
    return q === -1 ? trimmed : trimmed.slice(0, q);
  }
}

function scrubUrlString(value: string): string {
  return stripUrlQuery(value);
}

function scrubQueryStringValue(): string {
  return REDACTED;
}

function pathnameFromRequestUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    return new URL(url).pathname;
  } catch {
    const pathPart = url.split("?")[0]?.split("#")[0];
    return pathPart || undefined;
  }
}

function scrubRecord(record: JsonRecord): void {
  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      record[key] = REDACTED;
      continue;
    }

    if (
      (key === "url" ||
        key === "href" ||
        key === "from" ||
        key === "to") &&
      typeof value === "string"
    ) {
      record[key] = scrubUrlString(value);
      continue;
    }

    if (key === "headers" && isRecord(value)) {
      scrubRecord(value);
      continue;
    }

    if ((key === "request" || key === "response") && isRecord(value)) {
      scrubRequest(value);
    }
  }
}

function scrubRequest(request: JsonRecord): void {
  scrubRecord(request);

  if (typeof request.url === "string") {
    request.url = scrubUrlString(request.url);
  }

  if ("query_string" in request) {
    request.query_string = scrubQueryStringValue();
  }

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
    readNonEmptyEnv(process.env.NEXT_PUBLIC_VERCEL_ENV) ??
    readNonEmptyEnv(process.env.NODE_ENV) ??
    "development"
  );
}

export function getSentryRelease(): string | undefined {
  return (
    readNonEmptyEnv(process.env.NEXT_PUBLIC_SENTRY_RELEASE) ??
    readNonEmptyEnv(process.env.SENTRY_RELEASE) ??
    readNonEmptyEnv(process.env.VERCEL_GIT_COMMIT_SHA) ??
    readNonEmptyEnv(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA) ??
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

function enrichSentryEvent<T extends Event>(event: T): void {
  let pathname: string | undefined;

  if (isRecord(event.request) && typeof event.request.url === "string") {
    pathname = pathnameFromRequestUrl(event.request.url);
  }

  if (!pathname && typeof event.transaction === "string") {
    pathname = event.transaction.split("?")[0];
  }

  event.tags = { ...event.tags };
  event.tags.preview = computePreviewTag(pathname);

  const section = inferSectionFromPathname(pathname);
  if (section) {
    event.tags.section = section;
  } else {
    delete event.tags.section;
  }

  const deployment = getDeploymentLabel();
  const gitSha = getGitShaForSentry();

  event.contexts = { ...event.contexts };
  event.contexts.deployment_info = {
    route: pathname ?? "",
    deployment: deployment ?? "",
    git_sha: gitSha ?? "",
  };
}

export function scrubSentryEvent<T extends Event>(event: T): T {
  enrichSentryEvent(event);

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

export function scrubSentryBreadcrumb<T extends Breadcrumb>(breadcrumb: T): T {
  if (isRecord(breadcrumb.data)) {
    scrubRecord(breadcrumb.data);
  }

  return breadcrumb;
}

export function isProductionSentryEnvironment(): boolean {
  return getSentryEnvironment() === "production";
}

export function createSentryInitialScopeUpdater(): (scope: Scope) => Scope {
  return (scope) => {
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : undefined;
    applyRouteToSentryScope(scope, pathname);
    return scope;
  };
}

/** Sets `preview`, optional `section`, and `deployment_info` from a pathname (client). */
export function applyRouteToSentryScope(scope: Scope, pathname: string | undefined): void {
  scope.setTag("preview", computePreviewTag(pathname));
  const section = inferSectionFromPathname(pathname);
  if (section) {
    scope.setTag("section", section);
  } else {
    delete scope.getScopeData().tags.section;
  }
  scope.setContext("deployment_info", {
    route: pathname ?? "",
    deployment: getDeploymentLabel() ?? "",
    git_sha: getGitShaForSentry() ?? "",
  });
}
