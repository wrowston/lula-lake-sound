import { describe, expect, test } from "bun:test";
import { collectPublishIssues } from "./cmsPublishHelpers";
import type { PricingSnapshot } from "./cmsShared";
import {
  billingCadenceLabel,
  DEFAULT_PRICING_PACKAGES,
  PRICING_DEFAULTS,
} from "./cmsShared";
import { sanitizePricingPackages } from "./publicSettingsSnapshot";

const validPackage = () => ({
  id: "pkg_1",
  name: "Recording — Hourly",
  priceCents: 6000,
  currency: "USD",
  billingCadence: "hourly" as const,
  highlight: true,
  sortOrder: 0,
  isActive: true,
});

describe("collectPublishIssues(pricing)", () => {
  test("defaults and valid packages produce no issues", () => {
    const issues = collectPublishIssues("pricing", PRICING_DEFAULTS);
    expect(issues).toEqual([]);
  });

  test("detects duplicate package ids", () => {
    const snapshot: PricingSnapshot = {
      flags: { ...PRICING_DEFAULTS.flags, priceTabEnabled: true },
      packages: [validPackage(), { ...validPackage(), name: "Dup" }],
    };
    const issues = collectPublishIssues("pricing", snapshot);
    expect(issues.some((i) => i.message.includes("Duplicate package id"))).toBe(
      true,
    );
  });

  test("detects missing name and negative price", () => {
    const snapshot: PricingSnapshot = {
      flags: { ...PRICING_DEFAULTS.flags, priceTabEnabled: true },
      packages: [
        {
          ...validPackage(),
          id: "pkg_bad",
          name: "   ",
          priceCents: -1,
        },
      ],
    };
    const issues = collectPublishIssues("pricing", snapshot);
    expect(issues.map((i) => i.path)).toEqual(
      expect.arrayContaining([
        "packages[0].name",
        "packages[0].priceCents",
      ]),
    );
  });

  test("detects non-integer cent values", () => {
    const snapshot: PricingSnapshot = {
      flags: { ...PRICING_DEFAULTS.flags, priceTabEnabled: true },
      packages: [{ ...validPackage(), priceCents: 99.5 }],
    };
    const issues = collectPublishIssues("pricing", snapshot);
    expect(issues.some((i) => i.path === "packages[0].priceCents")).toBe(true);
  });

  test("missing packages array is treated as empty", () => {
    const snapshot: PricingSnapshot = {
      flags: { ...PRICING_DEFAULTS.flags, priceTabEnabled: true },
    };
    const issues = collectPublishIssues("pricing", snapshot);
    expect(issues).toEqual([]);
  });

  test("custom cadence without unitLabel is an issue", () => {
    const snapshot: PricingSnapshot = {
      flags: { ...PRICING_DEFAULTS.flags, priceTabEnabled: true },
      packages: [
        {
          ...validPackage(),
          id: "pkg_custom",
          billingCadence: "custom",
        },
      ],
    };
    const issues = collectPublishIssues("pricing", snapshot);
    expect(issues.map((i) => i.path)).toEqual(
      expect.arrayContaining(["packages[0].unitLabel"]),
    );
  });

  test("custom cadence with unitLabel passes validation", () => {
    const snapshot: PricingSnapshot = {
      flags: { ...PRICING_DEFAULTS.flags, priceTabEnabled: true },
      packages: [
        {
          ...validPackage(),
          id: "pkg_custom_ok",
          billingCadence: "custom",
          unitLabel: "per weekend lockout",
        },
      ],
    };
    const issues = collectPublishIssues("pricing", snapshot);
    expect(issues).toEqual([]);
  });
});

describe("sanitizePricingPackages", () => {
  test("sorts by sortOrder then name", () => {
    const sorted = sanitizePricingPackages([
      { ...validPackage(), id: "c", name: "Cello", sortOrder: 1 },
      { ...validPackage(), id: "a", name: "Apple", sortOrder: 0 },
      { ...validPackage(), id: "b", name: "Banana", sortOrder: 0 },
    ]);
    expect(sorted.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  test("drops malformed rows", () => {
    const sorted = sanitizePricingPackages([
      validPackage(),
      { ...validPackage(), id: "broken", priceCents: -5 },
      { ...validPackage(), id: "bad_cadence", billingCadence: "weekly" },
      null,
      "not an object",
    ]);
    expect(sorted.map((p) => p.id)).toEqual(["pkg_1"]);
  });

  test("drops custom-cadence rows that lack a unitLabel", () => {
    const sorted = sanitizePricingPackages([
      {
        ...validPackage(),
        id: "custom_missing_label",
        billingCadence: "custom",
      },
      {
        ...validPackage(),
        id: "custom_ok",
        billingCadence: "custom",
        unitLabel: "per lockout",
      },
    ]);
    expect(sorted.map((p) => p.id)).toEqual(["custom_ok"]);
  });

  test("returns empty array for non-array input", () => {
    expect(sanitizePricingPackages(undefined)).toEqual([]);
    expect(sanitizePricingPackages(null)).toEqual([]);
    expect(sanitizePricingPackages({})).toEqual([]);
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
