import { describe, expect, test } from "bun:test";
import {
  nextAppendSort,
  sortCategories,
  sortItems,
  specsPreview,
  validateCategoryName,
  validateItemName,
  validateSpecs,
  validateUrl,
} from "./gear-editor";

describe("specsPreview", () => {
  test("markdown specs: trims and joins whitespace", () => {
    expect(specsPreview({ kind: "markdown", text: "  hello\n\nworld  " })).toBe(
      "hello world",
    );
  });

  test("markdown specs: empty text → em-dash", () => {
    expect(specsPreview({ kind: "markdown", text: "" })).toBe("—");
  });

  test("markdown specs: truncates at 96 with ellipsis", () => {
    const long = "a".repeat(200);
    const preview = specsPreview({ kind: "markdown", text: long });
    expect(preview.length).toBe(97);
    expect(preview.endsWith("…")).toBe(true);
  });

  test("kv specs: joins pairs with `·`", () => {
    expect(
      specsPreview({
        kind: "kv",
        pairs: [
          { key: "Pattern", value: "Cardioid" },
          { key: "Use", value: "Vocals" },
        ],
      }),
    ).toBe("Pattern: Cardioid · Use: Vocals");
  });

  test("kv specs: empty pair list → em-dash", () => {
    expect(specsPreview({ kind: "kv", pairs: [] })).toBe("—");
  });
});

describe("validateItemName / validateCategoryName", () => {
  test("empty name rejected", () => {
    expect(validateItemName("")).toBe("Name is required.");
    expect(validateItemName("   ")).toBe("Name is required.");
    expect(validateCategoryName("")).toBe("Name is required.");
  });

  test("valid name passes", () => {
    expect(validateItemName("U87")).toBeNull();
    expect(validateCategoryName("Microphones")).toBeNull();
  });

  test("overlong name rejected", () => {
    const long = "a".repeat(501);
    expect(validateItemName(long)).toContain("500");
  });
});

describe("validateSpecs", () => {
  test("overlong markdown rejected", () => {
    const long = "a".repeat(20_001);
    expect(validateSpecs({ kind: "markdown", text: long })).toContain(
      "20000",
    );
  });

  test("short markdown passes", () => {
    expect(validateSpecs({ kind: "markdown", text: "hi" })).toBeNull();
  });

  test("too many kv pairs rejected", () => {
    const pairs = Array.from({ length: 41 }, (_, i) => ({
      key: `k${i}`,
      value: `v${i}`,
    }));
    expect(validateSpecs({ kind: "kv", pairs })).toContain("40");
  });

  test("kv pair with oversized key rejected", () => {
    expect(
      validateSpecs({
        kind: "kv",
        pairs: [{ key: "a".repeat(201), value: "ok" }],
      }),
    ).toContain("200");
  });

  test("kv pair with oversized value rejected", () => {
    expect(
      validateSpecs({
        kind: "kv",
        pairs: [{ key: "ok", value: "a".repeat(4_001) }],
      }),
    ).toContain("4000");
  });
});

describe("validateUrl", () => {
  test("empty input allowed (field is optional)", () => {
    expect(validateUrl("")).toBeNull();
    expect(validateUrl("   ")).toBeNull();
  });

  test("valid http and https URLs accepted", () => {
    expect(validateUrl("http://example.com")).toBeNull();
    expect(validateUrl("https://example.com/path?q=1")).toBeNull();
  });

  test("non-http(s) protocols rejected", () => {
    expect(validateUrl("ftp://example.com")).toContain("http");
    expect(validateUrl("javascript:alert(1)")).toContain("http");
  });

  test("malformed URL rejected", () => {
    expect(validateUrl("not a url")).toContain("http");
  });

  test("overlong URL rejected", () => {
    const url = `https://example.com/${"x".repeat(3000)}`;
    expect(validateUrl(url)).toContain("2048");
  });
});

describe("sortCategories / sortItems", () => {
  test("sorts by (sort, stableId)", () => {
    const input = [
      { stableId: "b", name: "", sort: 1, items: [] },
      { stableId: "a", name: "", sort: 1, items: [] },
      { stableId: "c", name: "", sort: 0, items: [] },
    ];
    expect(sortCategories(input).map((c) => c.stableId)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  test("does not mutate input", () => {
    const input = [
      { stableId: "b", name: "", sort: 1, items: [] },
      { stableId: "a", name: "", sort: 0, items: [] },
    ];
    const before = input.map((c) => c.stableId);
    sortCategories(input);
    expect(input.map((c) => c.stableId)).toEqual(before);
  });

  test("sortItems sorts identically", () => {
    const result = sortItems([
      {
        stableId: "b",
        categoryStableId: "c",
        name: "B",
        sort: 1,
        specs: { kind: "markdown", text: "" },
      },
      {
        stableId: "a",
        categoryStableId: "c",
        name: "A",
        sort: 0,
        specs: { kind: "markdown", text: "" },
      },
    ]);
    expect(result.map((i) => i.stableId)).toEqual(["a", "b"]);
  });
});

describe("nextAppendSort", () => {
  test("empty input → 0", () => {
    expect(nextAppendSort([])).toBe(0);
  });

  test("returns max + 1", () => {
    expect(nextAppendSort([0, 1, 2])).toBe(3);
    expect(nextAppendSort([5, 9, 3])).toBe(10);
  });

  test("handles negatives", () => {
    expect(nextAppendSort([-5, -1])).toBe(0);
  });
});
