import { describe, expect, test } from "bun:test";
import {
  ABOUT_DEFAULTS,
  DEFAULT_PRICING_PACKAGES,
  MARKETING_FEATURE_FLAGS_DEFAULTS,
  PRICING_DEFAULTS,
  SETTINGS_DEFAULTS,
  billingCadenceLabel,
  cmsSnapshotsEqual,
  defaultSnapshotForSection,
  settingsSnapshotsEqual,
} from "./cmsShared";

describe("SETTINGS_DEFAULTS", () => {
  test("exposes a non-empty title + description", () => {
    expect(SETTINGS_DEFAULTS.metadata?.title).toBeTruthy();
    expect(SETTINGS_DEFAULTS.metadata?.description).toBeTruthy();
  });
});

describe("DEFAULT_PRICING_PACKAGES", () => {
  test("ships with at least one package", () => {
    expect(DEFAULT_PRICING_PACKAGES.length).toBeGreaterThan(0);
  });

  test("every package has a valid shape", () => {
    for (const pkg of DEFAULT_PRICING_PACKAGES) {
      expect(typeof pkg.id).toBe("string");
      expect(pkg.id.length).toBeGreaterThan(0);
      expect(typeof pkg.name).toBe("string");
      expect(Number.isInteger(pkg.priceCents)).toBe(true);
      expect(pkg.priceCents).toBeGreaterThanOrEqual(0);
      expect(typeof pkg.currency).toBe("string");
      expect(pkg.currency.length).toBeGreaterThan(0);
      expect(typeof pkg.highlight).toBe("boolean");
      expect(typeof pkg.isActive).toBe("boolean");
    }
  });

  test("exactly one default is the highlight", () => {
    const highlighted = DEFAULT_PRICING_PACKAGES.filter((p) => p.highlight);
    expect(highlighted.length).toBe(1);
  });

  test("default ids are unique", () => {
    const ids = DEFAULT_PRICING_PACKAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("sort orders are strictly ascending", () => {
    const sorts = DEFAULT_PRICING_PACKAGES.map((p) => p.sortOrder);
    const sorted = [...sorts].sort((a, b) => a - b);
    expect(sorts).toEqual(sorted);
  });
});

describe("PRICING_DEFAULTS (legacy shape)", () => {
  test("re-exposes default packages via `.packages`", () => {
    expect(PRICING_DEFAULTS.packages).toEqual(DEFAULT_PRICING_PACKAGES);
  });

  test("flags.priceTabEnabled defaults to true (legacy)", () => {
    expect(PRICING_DEFAULTS.flags.priceTabEnabled).toBe(true);
  });
});

describe("MARKETING_FEATURE_FLAGS_DEFAULTS", () => {
  test("pricing section ships enabled; about + recordings off", () => {
    expect(MARKETING_FEATURE_FLAGS_DEFAULTS.pricingSection).toBe(true);
    expect(MARKETING_FEATURE_FLAGS_DEFAULTS.aboutPage).toBe(false);
    expect(MARKETING_FEATURE_FLAGS_DEFAULTS.recordingsPage).toBe(false);
  });
});

describe("ABOUT_DEFAULTS", () => {
  test("has a hero title and at least one body block", () => {
    expect(ABOUT_DEFAULTS.heroTitle.length).toBeGreaterThan(0);
    expect(Array.isArray(ABOUT_DEFAULTS.body)).toBe(true);
    expect(ABOUT_DEFAULTS.body.length).toBeGreaterThan(0);
    expect(ABOUT_DEFAULTS.body[0].type).toBe("paragraph");
  });

  test("starts with empty highlights and team", () => {
    expect(ABOUT_DEFAULTS.highlights).toEqual([]);
    expect(ABOUT_DEFAULTS.teamMembers).toEqual([]);
  });
});

describe("defaultSnapshotForSection", () => {
  test("returns the matching defaults for each section", () => {
    expect(defaultSnapshotForSection("settings")).toEqual(SETTINGS_DEFAULTS);
    expect(defaultSnapshotForSection("pricing")).toEqual(PRICING_DEFAULTS);
    expect(defaultSnapshotForSection("about")).toEqual(ABOUT_DEFAULTS);
  });

  test("recordings returns an about-shaped placeholder (no content table)", () => {
    const recording = defaultSnapshotForSection("recordings");
    // Structural check — should not throw and should at least have heroTitle.
    expect((recording as { heroTitle?: string }).heroTitle).toBe(
      ABOUT_DEFAULTS.heroTitle,
    );
  });
});

describe("billingCadenceLabel", () => {
  test("returns human labels for every defined cadence", () => {
    expect(billingCadenceLabel("hourly")).toBe("per hour");
    expect(billingCadenceLabel("six_hour_block")).toBe("per 6-hour block");
    expect(billingCadenceLabel("daily")).toBe("per day");
    expect(billingCadenceLabel("per_song")).toBe("per song");
    expect(billingCadenceLabel("per_album")).toBe("per album");
    expect(billingCadenceLabel("per_project")).toBe("per project");
    expect(billingCadenceLabel("flat")).toBe("flat rate");
  });

  test("returns empty string for custom (callers must use unitLabel)", () => {
    expect(billingCadenceLabel("custom")).toBe("");
  });
});

describe("cmsSnapshotsEqual", () => {
  test("is true for structurally equal snapshots regardless of key order", () => {
    const a = { metadata: { title: "a", description: "b" } };
    const b = { metadata: { description: "b", title: "a" } };
    expect(cmsSnapshotsEqual(a, b)).toBe(true);
  });

  test("is false when any nested field differs", () => {
    const a = { metadata: { title: "a", description: "b" } };
    const b = { metadata: { title: "a", description: "different" } };
    expect(cmsSnapshotsEqual(a, b)).toBe(false);
  });

  test("handles nested arrays deeply", () => {
    const a = { ...PRICING_DEFAULTS };
    const b = { ...PRICING_DEFAULTS, packages: [...DEFAULT_PRICING_PACKAGES] };
    expect(cmsSnapshotsEqual(a, b)).toBe(true);
  });

  test("mismatched array length is not equal", () => {
    const a = { ...PRICING_DEFAULTS };
    const b = { ...PRICING_DEFAULTS, packages: [DEFAULT_PRICING_PACKAGES[0]] };
    expect(cmsSnapshotsEqual(a, b)).toBe(false);
  });

  test("handles undefined on both sides (no-op)", () => {
    expect(cmsSnapshotsEqual(undefined, undefined)).toBe(true);
  });

  test("one side undefined is not equal", () => {
    expect(cmsSnapshotsEqual(undefined, SETTINGS_DEFAULTS)).toBe(false);
  });

  test("null values compared correctly", () => {
    const a = { metadata: { title: null as unknown as string } };
    const b = { metadata: { title: null as unknown as string } };
    expect(cmsSnapshotsEqual(a, b)).toBe(true);
  });

  test("array order matters", () => {
    const a = { ...PRICING_DEFAULTS };
    const reversed = [...DEFAULT_PRICING_PACKAGES].reverse();
    const b = { ...PRICING_DEFAULTS, packages: reversed };
    expect(cmsSnapshotsEqual(a, b)).toBe(false);
  });
});

describe("settingsSnapshotsEqual (legacy alias)", () => {
  test("is exactly cmsSnapshotsEqual", () => {
    expect(settingsSnapshotsEqual).toBe(cmsSnapshotsEqual);
  });
});
