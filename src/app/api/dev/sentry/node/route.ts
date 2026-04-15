import * as Sentry from "@sentry/nextjs";
import {
  getSentryEnvironment,
  getSentryRelease,
  isProductionSentryEnvironment,
} from "@/lib/sentry";

export const runtime = "nodejs";

export async function GET() {
  if (isProductionSentryEnvironment()) {
    return Response.json({ message: "Not found." }, { status: 404 });
  }

  const error = new Error("Sentry node runtime test error");
  const eventId = Sentry.captureException(error, {
    tags: {
      runtime: "nodejs",
      sentry_test: "true",
    },
  });

  await Sentry.flush(2000);

  return Response.json(
    {
      environment: getSentryEnvironment(),
      eventId,
      message: error.message,
      release: getSentryRelease(),
      runtime: "nodejs",
    },
    { status: 500 }
  );
}
