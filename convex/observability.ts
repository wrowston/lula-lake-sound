import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { scheduleConvexSentryException } from "./lib/sentryConvex";

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
