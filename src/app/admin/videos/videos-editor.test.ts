import { describe, expect, test } from "bun:test";
import { validateVideoFields } from "./videos-editor";

describe("validateVideoFields", () => {
  test("empty title is rejected", () => {
    expect(validateVideoFields("", "")).toContain("Title");
    expect(validateVideoFields("   ", "")).toContain("Title");
  });

  test("title over 200 characters is rejected", () => {
    expect(validateVideoFields("a".repeat(201), "")).toContain("200");
  });

  test("description over 2000 characters is rejected", () => {
    expect(validateVideoFields("Title", "x".repeat(2001))).toContain("2000");
  });

  test("valid title returns null", () => {
    expect(validateVideoFields("Live session", "")).toBeNull();
    expect(validateVideoFields("Live session", "Optional notes.")).toBeNull();
  });
});
