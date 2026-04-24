import { describe, expect, test } from "bun:test";
import { mergeAutosaveStatus } from "@/lib/use-marketing-feature-flags-admin";
import type { AutosaveStatus } from "@/components/admin/cms-publish-toolbar";

describe("mergeAutosaveStatus", () => {
  const statuses: AutosaveStatus[] = ["idle", "saving", "saved", "error"];

  test("is symmetric (commutative)", () => {
    for (const a of statuses) {
      for (const b of statuses) {
        expect(mergeAutosaveStatus(a, b)).toBe(mergeAutosaveStatus(b, a));
      }
    }
  });

  test("saving beats every other status", () => {
    for (const other of statuses) {
      expect(mergeAutosaveStatus("saving", other)).toBe("saving");
    }
  });

  test("error beats idle + saved (but not saving)", () => {
    expect(mergeAutosaveStatus("error", "idle")).toBe("error");
    expect(mergeAutosaveStatus("error", "saved")).toBe("error");
    expect(mergeAutosaveStatus("error", "error")).toBe("error");
    expect(mergeAutosaveStatus("error", "saving")).toBe("saving");
  });

  test("saved beats idle", () => {
    expect(mergeAutosaveStatus("saved", "idle")).toBe("saved");
  });

  test("two idle inputs stay idle", () => {
    expect(mergeAutosaveStatus("idle", "idle")).toBe("idle");
  });
});
