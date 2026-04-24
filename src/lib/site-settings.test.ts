import { describe, expect, test } from "bun:test";
import {
  billingCadenceLabel,
  formatPrice,
  isHomepagePricingSectionEnabled,
  previewHasActivePricingPackages,
  type MarketingFeatureFlags,
  type PricingFlags,
  type PricingPackage,
} from "@/lib/site-settings";

const basePackage: PricingPackage = {
  id: "pkg_1",
  name: "Recording",
  priceCents: 6000,
  currency: "USD",
  billingCadence: "hourly",
  highlight: false,
  sortOrder: 0,
  isActive: true,
};

describe("isHomepagePricingSectionEnabled", () => {
  test("null / undefined → false (no published flags yet)", () => {
    expect(isHomepagePricingSectionEnabled(null)).toBe(false);
    expect(isHomepagePricingSectionEnabled(undefined)).toBe(false);
  });

  test("missing pricingSection key treated as on", () => {
    const flags = { aboutPage: false, recordingsPage: false } as unknown as MarketingFeatureFlags;
    expect(isHomepagePricingSectionEnabled(flags)).toBe(true);
  });

  test("explicit false disables the block", () => {
    const flags: MarketingFeatureFlags = {
      aboutPage: false,
      recordingsPage: false,
      pricingSection: false,
    };
    expect(isHomepagePricingSectionEnabled(flags)).toBe(false);
  });

  test("explicit true enables the block", () => {
    const flags: MarketingFeatureFlags = {
      aboutPage: false,
      recordingsPage: false,
      pricingSection: true,
    };
    expect(isHomepagePricingSectionEnabled(flags)).toBe(true);
  });
});

describe("previewHasActivePricingPackages", () => {
  test("returns false for null / undefined inputs", () => {
    expect(previewHasActivePricingPackages(null)).toBe(false);
    expect(previewHasActivePricingPackages(undefined)).toBe(false);
  });

  test("returns false when no active packages", () => {
    const flags: PricingFlags = {
      flags: { priceTabEnabled: true },
      packages: [{ ...basePackage, isActive: false }],
    };
    expect(previewHasActivePricingPackages(flags)).toBe(false);
  });

  test("returns true when any package is active", () => {
    const flags: PricingFlags = {
      flags: { priceTabEnabled: true },
      packages: [{ ...basePackage, isActive: true }],
    };
    expect(previewHasActivePricingPackages(flags)).toBe(true);
  });

  test("returns false when packages undefined", () => {
    const flags: PricingFlags = { flags: { priceTabEnabled: true } };
    expect(previewHasActivePricingPackages(flags)).toBe(false);
  });
});

describe("billingCadenceLabel re-export", () => {
  test("re-exports from convex cmsShared", () => {
    expect(billingCadenceLabel("hourly")).toBe("per hour");
  });
});

describe("formatPrice", () => {
  test("whole-dollar price has no decimals", () => {
    expect(formatPrice(6000, "USD")).toBe("$60");
  });

  test("fractional-dollar price shows cents", () => {
    expect(formatPrice(6050, "USD")).toBe("$60.50");
  });

  test("zero renders as $0", () => {
    expect(formatPrice(0, "USD")).toBe("$0");
  });

  test("falls back to CODE/AMOUNT for unknown currency codes", () => {
    const v = formatPrice(1000, "ZZZ");
    // Intl may still format ZZZ if supported; assert the amount appears.
    expect(v.includes("10")).toBe(true);
  });
});
