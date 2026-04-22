"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useRef } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const captureOnce = useRef(false);
  const bodyRef = (node: HTMLBodyElement | null) => {
    if (!node || captureOnce.current) return;
    captureOnce.current = true;
    Sentry.captureException(error);
  };

  return (
    <html>
      <body ref={bodyRef}>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
