"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ConvexError } from "convex/values";
import type { CmsConvexErrorPayload } from "@/lib/effect-errors";

function isCmsConvexErrorPayload(value: unknown): value is CmsConvexErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as { code: unknown }).code === "string" &&
    "message" in value &&
    typeof (value as { message: unknown }).message === "string"
  );
}

function convexErrorMessage(error: unknown): string {
  if (error instanceof ConvexError) {
    const data = error.data;
    if (isCmsConvexErrorPayload(data)) {
      return data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong while loading inquiries.";
}

type Props = { readonly children: ReactNode };

type State = { readonly error: Error | null };

/**
 * Catches Convex query failures from child `useQuery` (e.g. forbidden) so the
 * admin shell does not white-screen.
 */
export class InquiriesQueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("admin inquiries query failed", error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {convexErrorMessage(this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}
