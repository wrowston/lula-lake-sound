import { describe, expect, test } from "bun:test";
import type { Doc, Id } from "./_generated/dataModel";
import {
  normalizePricingForCompare,
  pricingDraftMatchesPublished,
  pricingPackageFromRow,
} from "./pricingTree";

type Row = Doc<"pricingPackages">;

function row(patch: Partial<Row> = {}): Row {
  return {
    _id: ("row-" + (patch.stableId ?? "x")) as unknown as Id<"pricingPackages">,
    _creationTime: 0,
    scope: "draft",
    stableId: "pkg_1",
    name: "Recording — Hourly",
    priceCents: 6000,
    currency: "USD",
    billingCadence: "hourly",
    highlight: false,
    sortOrder: 0,
    isActive: true,
    ...patch,
  } as Row;
}

describe("pricingPackageFromRow", () => {
  test("maps required fields", () => {
    const pkg = pricingPackageFromRow(row());
    expect(pkg.id).toBe("pkg_1");
    expect(pkg.priceCents).toBe(6000);
    expect(pkg.billingCadence).toBe("hourly");
    expect(pkg.currency).toBe("USD");
  });

  test("omits optional fields when undefined", () => {
    const pkg = pricingPackageFromRow(row());
    expect("description" in pkg).toBe(false);
    expect("unitLabel" in pkg).toBe(false);
    expect("features" in pkg).toBe(false);
  });

  test("preserves optional fields when present", () => {
    const pkg = pricingPackageFromRow(
      row({
        description: "desc",
        unitLabel: "per show",
        features: ["fast", "cheap"],
        billingCadence: "custom",
      }),
    );
    expect(pkg.description).toBe("desc");
    expect(pkg.unitLabel).toBe("per show");
    expect(pkg.features).toEqual(["fast", "cheap"]);
    expect(pkg.billingCadence).toBe("custom");
  });
});

describe("normalizePricingForCompare", () => {
  test("fills optional fields with null for stable equality", () => {
    const shape = normalizePricingForCompare([row()]) as Array<{
      description: unknown;
      unitLabel: unknown;
      features: unknown;
    }>;
    expect(shape[0].description).toBeNull();
    expect(shape[0].unitLabel).toBeNull();
    expect(shape[0].features).toBeNull();
  });

  test("sorts by sortOrder then stableId", () => {
    const rows = [
      row({ stableId: "b", sortOrder: 1 }),
      row({ stableId: "a", sortOrder: 1 }),
      row({ stableId: "c", sortOrder: 0 }),
    ];
    const shape = normalizePricingForCompare(rows) as Array<{
      stableId: string;
    }>;
    expect(shape.map((r) => r.stableId)).toEqual(["c", "a", "b"]);
  });

  test("does not mutate the input array", () => {
    const input = [row({ stableId: "b", sortOrder: 2 }), row({ stableId: "a", sortOrder: 1 })];
    const before = input.map((r) => r.stableId);
    normalizePricingForCompare(input);
    expect(input.map((r) => r.stableId)).toEqual(before);
  });
});

describe("pricingDraftMatchesPublished", () => {
  test("empty tables match", () => {
    expect(pricingDraftMatchesPublished([], [])).toBe(true);
  });

  test("draft with packages does not match empty published", () => {
    expect(pricingDraftMatchesPublished([row()], [])).toBe(false);
  });

  test("identical catalogues match", () => {
    const draft = [row()];
    const published = [row()];
    expect(pricingDraftMatchesPublished(draft, published)).toBe(true);
  });

  test("differing priceCents is not a match", () => {
    expect(
      pricingDraftMatchesPublished([row({ priceCents: 6000 })], [row({ priceCents: 7000 })]),
    ).toBe(false);
  });

  test("order differences are normalized by stableId + sortOrder", () => {
    const a = [
      row({ stableId: "b", sortOrder: 1 }),
      row({ stableId: "a", sortOrder: 0 }),
    ];
    const b = [
      row({ stableId: "a", sortOrder: 0 }),
      row({ stableId: "b", sortOrder: 1 }),
    ];
    expect(pricingDraftMatchesPublished(a, b)).toBe(true);
  });
});
