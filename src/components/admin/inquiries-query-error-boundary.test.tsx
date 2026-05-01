import { describe, expect, test } from "bun:test";
import { ConvexError } from "convex/values";
import { InquiriesQueryErrorBoundary } from "./inquiries-query-error-boundary";

describe("InquiriesQueryErrorBoundary", () => {
  test("getDerivedStateFromError captures the error", () => {
    const err = new ConvexError({
      code: "UNAUTHORIZED",
      message: "You do not have permission to perform this action.",
      kind: "forbidden",
    });
    const state = InquiriesQueryErrorBoundary.getDerivedStateFromError(err);
    expect(state?.error).toBe(err);
  });
});
