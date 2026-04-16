import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { scheduleConvexSentryException } from "./lib/sentryConvex";

/**
 * Enqueues a Sentry report for a synthetic error, then returns (mutation commits so
 * the scheduled action runs). Enable only on trusted dev deployments:
 * Convex dashboard → Deployment Settings → Environment Variables →
 * `CONVEX_SENTRY_TEST_MUTATION` = `true`
 *
 * Run from the Convex dashboard ("Functions" → this mutation) or `bunx convex run`.
 * The event is sent by `internal.sentryNodeReport.captureFromConvex` with tag
 * `convex_function` = `observability:devForceSentryError`.
 */
export const devForceSentryError = mutation({
  args: {},
  handler: async (ctx) => {
    if (process.env.CONVEX_SENTRY_TEST_MUTATION !== "true") {
      throw new Error(
        "devForceSentryError is disabled. Set CONVEX_SENTRY_TEST_MUTATION=true on this deployment to enable.",
      );
    }

    const testError = new Error("forced dev sentry test error (convex)");

    await scheduleConvexSentryException(ctx, {
      functionName: "observability:devForceSentryError",
      error: testError,
      kind: "unhandled",
    });
  },
});

/**
 * Optional: report a handled failure from server code without rethrowing.
 * Call via `ctx.runMutation(internal.observability.reportHandledFailure, ...)`.
 */
export const reportHandledFailure = internalMutation({
  args: {
    functionName: v.string(),
    message: v.string(),
    stack: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await scheduleConvexSentryException(ctx, {
      functionName: args.functionName,
      error: Object.assign(new Error(args.message), {
        stack: args.stack,
      }),
      kind: "handled",
    });
    return null;
  },
});
