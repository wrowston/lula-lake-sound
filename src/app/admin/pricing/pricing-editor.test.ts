import { describe, expect, test } from "bun:test";
import {
  isCadence,
  parsePriceInput,
  priceCentsToDisplay,
  renumberSortOrder,
  toPricingContent,
} from "./pricing-editor";

describe("isCadence", () => {
  test.each([
    "hourly",
    "six_hour_block",
    "daily",
    "per_song",
    "per_album",
    "per_project",
    "flat",
    "custom",
  ] as const)("accepts %s", (c: string) => {
    expect(isCadence(c)).toBe(true);
  });

  test("rejects unknown cadence strings", () => {
    expect(isCadence("nope")).toBe(false);
    expect(isCadence("")).toBe(false);
  });
});

describe("parsePriceInput", () => {
  test("empty → null (caller keeps the previous cents)", () => {
    expect(parsePriceInput("")).toBeNull();
    expect(parsePriceInput("   ")).toBeNull();
  });

  test("non-numeric → null", () => {
    expect(parsePriceInput("abc")).toBeNull();
    expect(parsePriceInput(".")).toBeNull();
  });

  test("negative → null (never accept negative prices)", () => {
    expect(parsePriceInput("-5")).toBeNull();
  });

  test("whole dollars round to cents", () => {
    expect(parsePriceInput("60")).toBe(6000);
  });

  test("fractional dollars round half-up to nearest cent", () => {
    expect(parsePriceInput("60.50")).toBe(6050);
    expect(parsePriceInput("0.01")).toBe(1);
    expect(parsePriceInput("0.005")).toBe(1);
  });

  test("leading/trailing whitespace allowed", () => {
    expect(parsePriceInput("  99.99  ")).toBe(9999);
  });
});

describe("priceCentsToDisplay", () => {
  test("formats cents to a decimal string (2 decimals)", () => {
    expect(priceCentsToDisplay(6000)).toBe("60.00");
    expect(priceCentsToDisplay(0)).toBe("0.00");
    expect(priceCentsToDisplay(999)).toBe("9.99");
  });

  test("non-finite → empty string", () => {
    expect(priceCentsToDisplay(Number.NaN)).toBe("");
    expect(priceCentsToDisplay(Infinity)).toBe("");
  });
});

describe("renumberSortOrder", () => {
  test("assigns 0..n-1 to the sortOrder field in array order", () => {
    const input = [
      { id: "a", sortOrder: 10 },
      { id: "b", sortOrder: 3 },
      { id: "c", sortOrder: 7 },
    ];
    const result = renumberSortOrder(input as never);
    expect(result.map((r) => r.sortOrder)).toEqual([0, 1, 2]);
    // Does not mutate input.
    expect(input[0].sortOrder).toBe(10);
  });

  test("empty array returns empty array", () => {
    expect(renumberSortOrder([])).toEqual([]);
  });
});

describe("toPricingContent", () => {
  test("drops server flags (visibility lives on cmsSections.isEnabled)", () => {
    const result = toPricingContent({
      flags: { priceTabEnabled: true },
      packages: [
        {
          id: "pkg",
          name: "Rec",
          priceCents: 6000,
          currency: "USD",
          billingCadence: "hourly",
          highlight: false,
          sortOrder: 0,
          isActive: true,
        },
      ],
    });
    expect("flags" in (result as unknown as Record<string, unknown>)).toBe(
      false,
    );
    expect(result.packages).toHaveLength(1);
  });

  test("deep-clones features so editor mutations don't bleed upstream", () => {
    const features = ["a", "b"];
    const input = {
      flags: { priceTabEnabled: true },
      packages: [
        {
          id: "pkg",
          name: "Rec",
          priceCents: 6000,
          currency: "USD",
          billingCadence: "hourly" as const,
          highlight: false,
          sortOrder: 0,
          isActive: true,
          features,
        },
      ],
    };
    const result = toPricingContent(input);
    result.packages[0].features!.push("c");
    expect(features).toEqual(["a", "b"]);
  });
});
