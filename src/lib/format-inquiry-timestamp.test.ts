import { describe, expect, test } from "bun:test";
import { formatInquiryTimestamp } from "./format-inquiry-timestamp";

describe("formatInquiryTimestamp", () => {
  test("formats a known instant in America/New_York", () => {
    const ms = Date.UTC(2026, 0, 15, 18, 30, 0);
    const out = formatInquiryTimestamp(ms, "America/New_York");
    expect(out).toContain("2026");
    expect(out).toContain("Jan");
  });
});
