import { describe, expect, test } from "bun:test";
import type { Doc, Id } from "./_generated/dataModel";
import {
  SETTINGS_METADATA_DEFAULTS,
  normalizeSettingsForCompare,
  settingsDraftMatchesPublished,
} from "./settingsTree";

type Row = Doc<"settingsContent">;

function row(patch: Partial<Row> = {}): Row {
  return {
    _id: "settings-row" as unknown as Id<"settingsContent">,
    _creationTime: 0,
    scope: "draft",
    title: "Lula Lake Sound",
    description: "Music Production and Recording Services",
    ...patch,
  } as Row;
}

describe("SETTINGS_METADATA_DEFAULTS", () => {
  test("exposes the site title + description", () => {
    expect(SETTINGS_METADATA_DEFAULTS.title).toBeTruthy();
    expect(SETTINGS_METADATA_DEFAULTS.description).toBeTruthy();
  });
});

describe("normalizeSettingsForCompare", () => {
  test("returns null for a null row", () => {
    expect(normalizeSettingsForCompare(null)).toBeNull();
  });

  test("replaces undefined fields with null for diff stability", () => {
    const shape = normalizeSettingsForCompare(
      row({ title: undefined, description: undefined }),
    ) as { title: unknown; description: unknown };
    expect(shape.title).toBeNull();
    expect(shape.description).toBeNull();
  });

  test("preserves set fields verbatim", () => {
    const shape = normalizeSettingsForCompare(
      row({ title: "Hi", description: "Ho" }),
    ) as { title: string; description: string };
    expect(shape.title).toBe("Hi");
    expect(shape.description).toBe("Ho");
  });
});

describe("settingsDraftMatchesPublished", () => {
  test("both null means equal", () => {
    expect(settingsDraftMatchesPublished(null, null)).toBe(true);
  });

  test("null vs a row with content is not equal", () => {
    expect(settingsDraftMatchesPublished(null, row())).toBe(false);
    expect(settingsDraftMatchesPublished(row(), null)).toBe(false);
  });

  test("identical rows are equal", () => {
    expect(settingsDraftMatchesPublished(row(), row())).toBe(true);
  });

  test("different description is not equal", () => {
    expect(
      settingsDraftMatchesPublished(
        row({ description: "A" }),
        row({ description: "B" }),
      ),
    ).toBe(false);
  });

  test("undefined-vs-absent normalises to equal", () => {
    const a = row({ title: undefined });
    const b = row({ title: undefined });
    expect(settingsDraftMatchesPublished(a, b)).toBe(true);
  });
});
