import { describe, expect, test } from "bun:test";
import type { Doc, Id } from "./_generated/dataModel";
import {
  DEFAULT_IS_ENABLED,
  defaultSnapshotForSection,
  effectiveIsEnabled,
  publishedIsEnabled,
  rowsWithPublishableDraft,
  validatePricingPackageArray,
} from "./cmsPublishHelpers";

type Row = Doc<"cmsSections">;

function row(patch: Partial<Row> = {}): Row {
  return {
    _id: ("row-" + (patch.section ?? "x")) as unknown as Id<"cmsSections">,
    _creationTime: 0,
    section: "about",
    hasDraftChanges: false,
    publishedAt: null,
    updatedAt: 0,
    ...patch,
  } as Row;
}

describe("rowsWithPublishableDraft", () => {
  test("returns only rows where hasDraftChanges is true", () => {
    const rows = [
      row({ section: "about", hasDraftChanges: true }),
      row({ section: "pricing", hasDraftChanges: false }),
      row({ section: "settings", hasDraftChanges: true }),
    ];
    const out = rowsWithPublishableDraft(rows);
    expect(out.map((r) => r.section)).toEqual(["about", "settings"]);
  });

  test("empty input returns empty output", () => {
    expect(rowsWithPublishableDraft([])).toEqual([]);
  });

  test("ignores legacy photos rows handled by galleryPhotoMeta", () => {
    const rows = [
      row({ section: "photos", hasDraftChanges: true }),
      row({ section: "about", hasDraftChanges: true }),
    ];

    expect(rowsWithPublishableDraft(rows).map((r) => r.section)).toEqual([
      "about",
    ]);
  });

  test("does not mutate the input", () => {
    const rows = [
      row({ section: "about", hasDraftChanges: true }),
      row({ section: "pricing", hasDraftChanges: false }),
    ];
    const copy = [...rows];
    rowsWithPublishableDraft(rows);
    expect(rows).toEqual(copy);
  });
});

describe("re-exports", () => {
  test("exports DEFAULT_IS_ENABLED from cmsMeta", () => {
    expect(DEFAULT_IS_ENABLED.pricing).toBe(true);
  });

  test("exports effectiveIsEnabled / publishedIsEnabled from cmsMeta", () => {
    expect(effectiveIsEnabled(null, "pricing")).toBe(true);
    expect(publishedIsEnabled(null, "about")).toBe(false);
  });

  test("exports defaultSnapshotForSection from cmsShared", () => {
    const settings = defaultSnapshotForSection("settings");
    expect(settings).toBeDefined();
  });
});

describe("validatePricingPackageArray — additional coverage", () => {
  const valid = {
    stableId: "pkg_1",
    name: "Recording",
    priceCents: 6000,
    currency: "USD",
    billingCadence: "hourly",
    sortOrder: 0,
  };

  test("flags missing currency", () => {
    const issues = validatePricingPackageArray([
      { ...valid, currency: "   " },
    ]);
    expect(issues.some((i) => i.path === "packages[0].currency")).toBe(true);
  });

  test("flags non-numeric sortOrder (NaN)", () => {
    const issues = validatePricingPackageArray([
      { ...valid, sortOrder: Number.NaN },
    ]);
    expect(issues.some((i) => i.path === "packages[0].sortOrder")).toBe(true);
  });

  test("flags empty stableId (requires a stable id)", () => {
    const issues = validatePricingPackageArray([
      { ...valid, stableId: "" },
    ]);
    expect(issues.some((i) => i.path === "packages[0].id")).toBe(true);
  });

  test("duplicate id reports once for the duplicate row", () => {
    const issues = validatePricingPackageArray([
      { ...valid },
      { ...valid, name: "Dup" },
    ]);
    const idIssues = issues.filter((i) => i.path === "packages[1].id");
    expect(idIssues.length).toBe(1);
    expect(idIssues[0].message).toContain("Duplicate");
  });
});
