import { describe, expect, test } from "bun:test";
import { ConvexError } from "convex/values";
import {
  cmsConflict,
  cmsNotFound,
  cmsPublishValidationFailed,
  cmsUnauthorized,
  cmsValidationError,
  type CmsConvexError,
} from "./errors";

function captureData(fn: () => void): CmsConvexError {
  try {
    fn();
  } catch (err) {
    if (err instanceof ConvexError) {
      return err.data as CmsConvexError;
    }
    throw err;
  }
  throw new Error("expected function to throw");
}

describe("cmsUnauthorized", () => {
  test("throws a ConvexError with code UNAUTHORIZED", () => {
    const data = captureData(() => cmsUnauthorized("Sign in"));
    expect(data.code).toBe("UNAUTHORIZED");
    expect(data.message).toBe("Sign in");
  });

  test("carries kind when supplied", () => {
    const data = captureData(() =>
      cmsUnauthorized("Forbidden", "forbidden"),
    );
    expect(data.code).toBe("UNAUTHORIZED");
    if (data.code === "UNAUTHORIZED") {
      expect(data.kind).toBe("forbidden");
    }
  });

  test("omits kind entirely when unspecified (not set to undefined)", () => {
    const data = captureData(() => cmsUnauthorized("no-kind"));
    if (data.code === "UNAUTHORIZED") {
      expect("kind" in data).toBe(false);
    }
  });
});

describe("cmsValidationError", () => {
  test("throws with VALIDATION_ERROR code and optional field", () => {
    const data = captureData(() =>
      cmsValidationError("bad", "name"),
    );
    expect(data.code).toBe("VALIDATION_ERROR");
    if (data.code === "VALIDATION_ERROR") {
      expect(data.field).toBe("name");
    }
  });

  test("omits field when unspecified", () => {
    const data = captureData(() => cmsValidationError("bad"));
    if (data.code === "VALIDATION_ERROR") {
      expect("field" in data).toBe(false);
    }
  });
});

describe("cmsNotFound", () => {
  test("synthesises a default message", () => {
    const data = captureData(() => cmsNotFound("user", "abc"));
    expect(data.code).toBe("NOT_FOUND");
    if (data.code === "NOT_FOUND") {
      expect(data.resource).toBe("user");
      expect(data.id).toBe("abc");
      expect(data.message).toBe("user not found: abc");
    }
  });

  test("accepts a custom message", () => {
    const data = captureData(() => cmsNotFound("user", "abc", "gone"));
    if (data.code === "NOT_FOUND") {
      expect(data.message).toBe("gone");
    }
  });
});

describe("cmsConflict", () => {
  test("carries optional reason", () => {
    const data = captureData(() => cmsConflict("bad", "stale"));
    expect(data.code).toBe("CONFLICT");
    if (data.code === "CONFLICT") {
      expect(data.reason).toBe("stale");
    }
  });

  test("omits reason when unspecified", () => {
    const data = captureData(() => cmsConflict("bad"));
    if (data.code === "CONFLICT") {
      expect("reason" in data).toBe(false);
    }
  });
});

describe("cmsPublishValidationFailed", () => {
  test("carries the section + issues list", () => {
    const data = captureData(() =>
      cmsPublishValidationFailed("about", "fail", [
        { path: "heroTitle", message: "required" },
      ]),
    );
    expect(data.code).toBe("PUBLISH_VALIDATION_FAILED");
    if (data.code === "PUBLISH_VALIDATION_FAILED") {
      expect(data.section).toBe("about");
      expect(data.issues).toEqual([
        { path: "heroTitle", message: "required" },
      ]);
    }
  });

  test("omits issues when the list is empty", () => {
    const data = captureData(() =>
      cmsPublishValidationFailed("about", "fail", []),
    );
    if (data.code === "PUBLISH_VALIDATION_FAILED") {
      expect("issues" in data).toBe(false);
    }
  });

  test("omits issues when undefined", () => {
    const data = captureData(() =>
      cmsPublishValidationFailed("about", "fail"),
    );
    if (data.code === "PUBLISH_VALIDATION_FAILED") {
      expect("issues" in data).toBe(false);
    }
  });
});
