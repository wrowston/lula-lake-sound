import { describe, expect, test } from "bun:test";
import type { Doc } from "./_generated/dataModel";
import {
  DEFAULT_IS_ENABLED,
  anyMarketingFlagDraftPending,
  effectiveIsEnabled,
  publishedIsEnabled,
  sectionHasPendingFlagDraft,
} from "./cmsMeta";

type SectionRow = Doc<"cmsSections">;

function row(patch: Partial<SectionRow> = {}): SectionRow {
  return {
    _id: "row1" as unknown as SectionRow["_id"],
    _creationTime: 0,
    section: "about",
    hasDraftChanges: false,
    publishedAt: null,
    updatedAt: 0,
    ...patch,
  } as SectionRow;
}

describe("DEFAULT_IS_ENABLED", () => {
  test("ships the pricing homepage block on", () => {
    expect(DEFAULT_IS_ENABLED.pricing).toBe(true);
    expect(DEFAULT_IS_ENABLED.settings).toBe(true);
  });

  test("about + recordings default to off (must be explicitly published)", () => {
    expect(DEFAULT_IS_ENABLED.about).toBe(false);
    expect(DEFAULT_IS_ENABLED.recordings).toBe(false);
  });

  test("amenities nearby ships on with the homepage", () => {
    expect(DEFAULT_IS_ENABLED.amenitiesNearby).toBe(true);
  });
});

describe("effectiveIsEnabled", () => {
  test("null row falls back to section default", () => {
    expect(effectiveIsEnabled(null, "pricing")).toBe(true);
    expect(effectiveIsEnabled(null, "about")).toBe(false);
  });

  test("draft override wins over published value", () => {
    const r = row({ isEnabled: false, isEnabledDraft: true });
    expect(effectiveIsEnabled(r, "about")).toBe(true);
  });

  test("falls back to isEnabled when no draft", () => {
    const r = row({ isEnabled: true });
    expect(effectiveIsEnabled(r, "about")).toBe(true);
  });

  test("isEnabled undefined falls back to default", () => {
    const r = row({ isEnabled: undefined });
    expect(effectiveIsEnabled(r, "pricing")).toBe(true);
    expect(effectiveIsEnabled(r, "about")).toBe(false);
  });
});

describe("publishedIsEnabled", () => {
  test("ignores draft even when set", () => {
    const r = row({ isEnabled: false, isEnabledDraft: true });
    expect(publishedIsEnabled(r, "about")).toBe(false);
  });

  test("falls back to section default when row is missing", () => {
    expect(publishedIsEnabled(null, "pricing")).toBe(true);
    expect(publishedIsEnabled(null, "about")).toBe(false);
  });

  test("falls back to default when isEnabled unset", () => {
    const r = row({ isEnabled: undefined });
    expect(publishedIsEnabled(r, "about")).toBe(false);
  });
});

describe("sectionHasPendingFlagDraft", () => {
  test("null row has no pending flag draft", () => {
    expect(sectionHasPendingFlagDraft(null, "about")).toBe(false);
  });

  test("row with no draft has no pending flag draft", () => {
    expect(sectionHasPendingFlagDraft(row(), "about")).toBe(false);
  });

  test("pending flag draft when draft differs from published", () => {
    const r = row({ isEnabled: false, isEnabledDraft: true });
    expect(sectionHasPendingFlagDraft(r, "about")).toBe(true);
  });

  test("no pending draft when draft matches published", () => {
    const r = row({ isEnabled: true, isEnabledDraft: true });
    expect(sectionHasPendingFlagDraft(r, "about")).toBe(false);
  });

  test("published unset → compares against section default", () => {
    // Section default for about is false; draft true means pending.
    const r = row({ isEnabledDraft: true });
    expect(sectionHasPendingFlagDraft(r, "about")).toBe(true);
    // Draft false equals default false → not pending.
    const r2 = row({ isEnabledDraft: false });
    expect(sectionHasPendingFlagDraft(r2, "about")).toBe(false);
  });
});

describe("anyMarketingFlagDraftPending", () => {
  test("false when no section has a flag draft", () => {
    expect(
      anyMarketingFlagDraftPending(row(), row(), row()),
    ).toBe(false);
  });

  test("true when about has a pending flag draft", () => {
    const about = row({ isEnabled: false, isEnabledDraft: true });
    expect(
      anyMarketingFlagDraftPending(about, row(), row()),
    ).toBe(true);
  });

  test("true when recordings has a pending flag draft", () => {
    const recordings = row({
      section: "recordings",
      isEnabled: false,
      isEnabledDraft: true,
    });
    expect(
      anyMarketingFlagDraftPending(row(), recordings, row()),
    ).toBe(true);
  });

  test("true when pricing has a pending flag draft", () => {
    const pricing = row({
      section: "pricing",
      isEnabled: true,
      isEnabledDraft: false,
    });
    expect(
      anyMarketingFlagDraftPending(row(), row(), pricing),
    ).toBe(true);
  });

  test("null rows are tolerated", () => {
    expect(anyMarketingFlagDraftPending(null, null, null)).toBe(false);
  });
});
