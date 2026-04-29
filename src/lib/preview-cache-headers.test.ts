import { describe, expect, test } from "bun:test";
import { PREVIEW_CACHE_CONTROL } from "@/lib/preview-cache-headers";

describe("PREVIEW_CACHE_CONTROL", () => {
  test("disallows shared caches and stale reuse (no-store + private)", () => {
    const v = PREVIEW_CACHE_CONTROL.toLowerCase();
    expect(v).toContain("no-store");
    expect(v).toContain("private");
    expect(v).toContain("no-cache");
    expect(v).toContain("must-revalidate");
    expect(v).toContain("max-age=0");
  });
});
