"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useRef } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const lastReportedError = useRef<(Error & { digest?: string }) | undefined>(
    undefined,
  );

  if (lastReportedError.current !== error) {
    lastReportedError.current = error;
    const captured = error;
    queueMicrotask(() => {
      Sentry.captureException(captured);
    });
  }

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
