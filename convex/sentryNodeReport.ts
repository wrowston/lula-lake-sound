"use node";

import * as Sentry from "@sentry/node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { convexDeploymentName } from "./lib/sentryConvex";

let sentryInitialized = false;

function ensureSentry(): boolean {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return false;

  if (!sentryInitialized) {
    Sentry.init({
      dsn,
      defaultIntegrations: false,
      release: process.env.SENTRY_RELEASE?.trim(),
      environment: process.env.SENTRY_ENVIRONMENT?.trim(),
      tracesSampleRate: 0,
      beforeSend(event) {
        delete event.request;
        if (event.contexts?.trace) {
          delete event.contexts.trace;
        }
        return event;
      },
    });
    sentryInitialized = true;
  }
  return true;
}

export const captureFromConvex = internalAction({
  args: {
    functionName: v.string(),
    errorMessage: v.string(),
    errorStack: v.optional(v.string()),
    userIdHash: v.string(),
    kind: v.union(v.literal("unhandled"), v.literal("handled")),
  },
  handler: async (_ctx, args) => {
    if (!ensureSentry()) {
      console.warn(
        "[sentryNodeReport] SENTRY_DSN is not set; skipping Sentry upload.",
      );
      return null;
    }

    const deploymentName = convexDeploymentName();
    const err = new Error(args.errorMessage);
    if (args.errorStack) {
      err.stack = args.errorStack;
    }

    Sentry.captureException(err, {
      user: { id: args.userIdHash },
      tags: {
        convex_function: args.functionName,
        convex_deployment: deploymentName,
        convex_error_kind: args.kind,
      },
      extra: {
        convex_function: args.functionName,
        convex_deployment: deploymentName,
        convex_error_kind: args.kind,
      },
    });

    await Sentry.flush(2000);
    return null;
  },
});
