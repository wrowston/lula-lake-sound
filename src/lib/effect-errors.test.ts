import { describe, expect, test } from "bun:test";
import { ConvexError } from "convex/values";
import {
  cmsErrorToastMessage,
  fromConvexCmsError,
} from "@/lib/effect-errors";

describe("fromConvexCmsError", () => {
  test("maps UNAUTHORIZED with explicit kind sign_in_required", () => {
    const err = fromConvexCmsError(
      new ConvexError({
        code: "UNAUTHORIZED",
        message: "Sign in required to access the CMS.",
        kind: "sign_in_required",
      }),
    );
    expect(err._tag).toBe("Unauthorized");
    if (err._tag === "Unauthorized") {
      expect(err.kind).toBe("sign_in_required");
    }
  });

  test("maps UNAUTHORIZED with explicit kind forbidden", () => {
    const err = fromConvexCmsError(
      new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to perform this action.",
        kind: "forbidden",
      }),
    );
    expect(err._tag).toBe("Unauthorized");
    if (err._tag === "Unauthorized") {
      expect(err.kind).toBe("forbidden");
    }
  });

  test("infers forbidden from message when kind omitted (legacy payloads)", () => {
    const err = fromConvexCmsError(
      new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to perform this action.",
      }),
    );
    expect(err._tag).toBe("Unauthorized");
    if (err._tag === "Unauthorized") {
      expect(err.kind).toBe("forbidden");
    }
  });
});

describe("cmsErrorToastMessage", () => {
  test("does not surface raw server strings for Unauthorized", () => {
    const forbidden = fromConvexCmsError(
      new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to perform this action.",
        kind: "forbidden",
      }),
    );
    expect(cmsErrorToastMessage(forbidden)).toBe(
      "You are not allowed to do this.",
    );

    const signIn = fromConvexCmsError(
      new ConvexError({
        code: "UNAUTHORIZED",
        message: "Sign in required to access the CMS.",
        kind: "sign_in_required",
      }),
    );
    expect(cmsErrorToastMessage(signIn)).toBe("Please sign in to continue.");
  });
});
