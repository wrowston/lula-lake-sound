import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";

const SAMPLE_RATE = 1;

const RATE_LIMIT_MS = 10_000;
const lastSentAtByKey = new Map<string, number>();

function deploymentKeyFromCloudUrl(): string {
  const url = process.env.CONVEX_CLOUD_URL;
  if (!url) return "unknown-deployment";
  try {
    const host = new URL(url).hostname;
    const match = /^([^.]+)\.convex\.cloud$/i.exec(host);
    return match?.[1] ?? host;
  } catch {
    return "unknown-deployment";
  }
}

export function convexDeploymentName(): string {
  return deploymentKeyFromCloudUrl();
}

export async function sha256Short(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < 8; i++) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return hex;
}

function normalizeUnknownError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message || "Error",
      stack: truncateStack(error.stack),
    };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  try {
    const serialized = JSON.stringify(error);
    if (typeof serialized === "string") {
      return { message: serialized };
    }
    return { message: String(error) };
  } catch {
    return { message: String(error) };
  }
}

function truncateStack(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  const max = 12_000;
  return stack.length <= max ? stack : `${stack.slice(0, max)}…`;
}

function shouldSendSampled(): boolean {
  return Math.random() < SAMPLE_RATE;
}

function shouldSendRateLimited(key: string): boolean {
  const now = Date.now();
  const last = lastSentAtByKey.get(key) ?? 0;
  if (now - last < RATE_LIMIT_MS) return false;
  lastSentAtByKey.set(key, now);
  return true;
}

export type ConvexSentryReportKind = "unhandled" | "handled";

/**
 * Queue a Sentry event via an internal Node action. Safe to call from mutations:
 * only derived identifiers and error text are passed; no JWTs or env secrets.
 */
export async function scheduleConvexSentryException(
  ctx: MutationCtx,
  options: {
    functionName: string;
    error: unknown;
    kind: ConvexSentryReportKind;
  },
): Promise<void> {
  if (!shouldSendSampled()) return;

  const { message, stack } = normalizeUnknownError(options.error);
  const rateKey = `${options.functionName}:${message}`;
  if (!shouldSendRateLimited(rateKey)) return;

  const identity = await ctx.auth.getUserIdentity();
  const userIdHash = await sha256Short(identity?.tokenIdentifier ?? "anonymous");

  await ctx.scheduler.runAfter(0, internal.sentryNodeReport.captureFromConvex, {
    functionName: options.functionName,
    errorMessage: message,
    errorStack: stack,
    userIdHash,
    kind: options.kind,
  });
}
