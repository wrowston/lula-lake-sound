import { describe, expect, test } from "bun:test";
import { validatePricingPackageArray } from "./cmsPublishHelpers";
import {
  billingCadenceLabel,
  DEFAULT_PRICING_PACKAGES,
} from "./cmsShared";

type TestPackage = {
  stableId: string;
  name: string;
  priceCents: number;
  currency: string;
  billingCadence:
    | "hourly"
    | "six_hour_block"
    | "daily"
    | "per_song"
    | "per_album"
    | "per_project"
    | "flat"
    | "custom";
  highlight: boolean;
  sortOrder: number;
  isActive: boolean;
  unitLabel?: string;
};

const validPackage = (): TestPackage => ({
  stableId: "pkg_1",
  name: "Recording — Hourly",
  priceCents: 6000,
  currency: "USD",
  billingCadence: "hourly",
  highlight: true,
  sortOrder: 0,
  isActive: true,
});

describe("validatePricingPackageArray", () => {
  test("defaults and valid packages produce no issues", () => {
    const defaults = DEFAULT_PRICING_PACKAGES.map((p) => ({
      ...p,
      stableId: p.id,
    }));
    expect(validatePricingPackageArray(defaults)).toEqual([]);
  });

  test("detects duplicate package ids", () => {
    const issues = validatePricingPackageArray([
      validPackage(),
      { ...validPackage(), name: "Dup" },
    ]);
    expect(issues.some((i) => i.message.includes("Duplicate package id"))).toBe(
      true,
    );
  });

  test("detects missing name and negative price", () => {
    const issues = validatePricingPackageArray([
      {
        ...validPackage(),
        stableId: "pkg_bad",
        name: "   ",
        priceCents: -1,
      },
    ]);
    expect(issues.map((i) => i.path)).toEqual(
      expect.arrayContaining(["packages[0].name", "packages[0].priceCents"]),
    );
  });

  test("detects non-integer cent values", () => {
    const issues = validatePricingPackageArray([
      { ...validPackage(), priceCents: 99.5 },
    ]);
    expect(issues.some((i) => i.path === "packages[0].priceCents")).toBe(true);
  });

  test("empty array is OK", () => {
    expect(validatePricingPackageArray([])).toEqual([]);
  });

  test("custom cadence without unitLabel is an issue", () => {
    const issues = validatePricingPackageArray([
      {
        ...validPackage(),
        stableId: "pkg_custom",
        billingCadence: "custom",
      },
    ]);
    expect(issues.map((i) => i.path)).toEqual(
      expect.arrayContaining(["packages[0].unitLabel"]),
    );
  });

  test("custom cadence with unitLabel passes validation", () => {
    const issues = validatePricingPackageArray([
      {
        ...validPackage(),
        stableId: "pkg_custom_ok",
        billingCadence: "custom",
        unitLabel: "per weekend lockout",
      },
    ]);
    expect(issues).toEqual([]);
  });
});

describe("defaults", () => {
  test("ship with at least one highlighted package", () => {
    expect(DEFAULT_PRICING_PACKAGES.some((p) => p.highlight)).toBe(true);
  });

  test("have unique ids", () => {
    const ids = DEFAULT_PRICING_PACKAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("billingCadenceLabel", () => {
  test("returns a human label for every cadence", () => {
    expect(billingCadenceLabel("hourly")).toMatch(/hour/i);
    expect(billingCadenceLabel("six_hour_block")).toMatch(/6-hour/);
    expect(billingCadenceLabel("per_song")).toMatch(/song/);
  });

  test("returns empty string for custom so callers fall back to unitLabel", () => {
    expect(billingCadenceLabel("custom")).toBe("");
  });
});
