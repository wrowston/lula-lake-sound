import { describe, expect, test } from "bun:test";
import { DEFAULT_PRICING_PACKAGES } from "./cmsShared";
import { sanitizePricingPackages } from "./publicSettingsSnapshot";

describe("sanitizePricingPackages", () => {
  test("returns [] for non-array input", () => {
    expect(sanitizePricingPackages(null)).toEqual([]);
    expect(sanitizePricingPackages("nope")).toEqual([]);
    expect(sanitizePricingPackages({})).toEqual([]);
  });

  test("accepts default packages verbatim", () => {
    const out = sanitizePricingPackages(DEFAULT_PRICING_PACKAGES);
    expect(out.length).toBe(DEFAULT_PRICING_PACKAGES.length);
  });

  test("drops entries missing required fields", () => {
    const pkg = { ...DEFAULT_PRICING_PACKAGES[0], id: "" };
    expect(sanitizePricingPackages([pkg])).toEqual([]);
  });

  test("drops entries with invalid billing cadence", () => {
    const pkg = {
      ...DEFAULT_PRICING_PACKAGES[0],
      billingCadence: "nope",
    };
    expect(sanitizePricingPackages([pkg])).toEqual([]);
  });

  test("drops custom cadence entries without a unit label", () => {
    const pkg = {
      ...DEFAULT_PRICING_PACKAGES[0],
      billingCadence: "custom",
      unitLabel: undefined,
    };
    expect(sanitizePricingPackages([pkg])).toEqual([]);
  });

  test("keeps custom cadence entries with a unit label", () => {
    const pkg = {
      ...DEFAULT_PRICING_PACKAGES[0],
      billingCadence: "custom",
      unitLabel: "per weekend",
    };
    expect(sanitizePricingPackages([pkg])).toHaveLength(1);
  });

  test("rejects non-integer priceCents", () => {
    const pkg = { ...DEFAULT_PRICING_PACKAGES[0], priceCents: 99.5 };
    expect(sanitizePricingPackages([pkg])).toEqual([]);
  });

  test("rejects negative priceCents", () => {
    const pkg = { ...DEFAULT_PRICING_PACKAGES[0], priceCents: -1 };
    expect(sanitizePricingPackages([pkg])).toEqual([]);
  });

  test("rejects non-string currency", () => {
    const pkg = { ...DEFAULT_PRICING_PACKAGES[0], currency: 0 };
    expect(sanitizePricingPackages([pkg])).toEqual([]);
  });

  test("sorts by sortOrder then name", () => {
    const pkgs = [
      { ...DEFAULT_PRICING_PACKAGES[0], id: "b", sortOrder: 1, name: "B" },
      { ...DEFAULT_PRICING_PACKAGES[0], id: "a", sortOrder: 0, name: "A" },
      { ...DEFAULT_PRICING_PACKAGES[0], id: "c", sortOrder: 1, name: "A" },
    ];
    const out = sanitizePricingPackages(pkgs);
    expect(out.map((p) => p.id)).toEqual(["a", "c", "b"]);
  });

  test("rejects malformed features array (non-string element)", () => {
    const pkg = {
      ...DEFAULT_PRICING_PACKAGES[0],
      features: ["ok", 3 as unknown as string],
    };
    expect(sanitizePricingPackages([pkg])).toEqual([]);
  });
});
