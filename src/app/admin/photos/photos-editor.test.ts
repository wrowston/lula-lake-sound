import { describe, expect, test } from "bun:test";
import {
  GALLERY_CATEGORY_OPTIONS,
  defaultAltFromFileName,
  formatBytes,
  sameCategories,
  validatePhotoFields,
} from "./photos-editor";

describe("defaultAltFromFileName", () => {
  test("drops the extension", () => {
    expect(defaultAltFromFileName("studio.jpg")).toBe("Studio");
    expect(defaultAltFromFileName("live-room.webp")).toBe("Live room");
  });

  test("converts dashes/underscores to spaces", () => {
    expect(defaultAltFromFileName("behind_the_board.png")).toBe(
      "Behind the board",
    );
  });

  test("capitalises the first letter only", () => {
    expect(defaultAltFromFileName("session one.jpg")).toBe("Session one");
  });

  test("collapses repeated whitespace", () => {
    expect(defaultAltFromFileName("a__b--c.jpg")).toBe("A b c");
  });

  test("empty / whitespace filename → 'Studio photo' fallback", () => {
    expect(defaultAltFromFileName(".jpg")).toBe("Studio photo");
    expect(defaultAltFromFileName("   .jpg")).toBe("Studio photo");
  });
});

describe("formatBytes", () => {
  test("bytes scale", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
  });

  test("kilobytes scale", () => {
    expect(formatBytes(2048)).toBe("2.0 KB");
  });

  test("megabytes scale", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("validatePhotoFields", () => {
  test("empty alt rejected", () => {
    expect(validatePhotoFields("", "caption")).toContain("Alt");
    expect(validatePhotoFields("   ", "caption")).toContain("Alt");
  });

  test("alt over 240 chars rejected", () => {
    expect(validatePhotoFields("a".repeat(241), "")).toContain("240");
  });

  test("alt exactly 240 chars accepted", () => {
    expect(validatePhotoFields("a".repeat(240), "")).toBeNull();
  });

  test("caption over 600 chars rejected", () => {
    expect(validatePhotoFields("ok", "a".repeat(601))).toContain("600");
  });

  test("valid alt + short caption passes", () => {
    expect(validatePhotoFields("cool studio", "")).toBeNull();
    expect(validatePhotoFields("cool studio", "A caption")).toBeNull();
  });
});

describe("sameCategories", () => {
  test("two empty arrays are equal", () => {
    expect(sameCategories([], [])).toBe(true);
  });

  test("different lengths are not equal", () => {
    expect(sameCategories(["rooms"], [])).toBe(false);
    expect(sameCategories(["rooms"], ["rooms", "gear"])).toBe(false);
  });

  test("same items in same order are equal", () => {
    expect(sameCategories(["rooms", "gear"], ["rooms", "gear"])).toBe(true);
  });

  test("same items in different order are not equal (canonical order matters)", () => {
    expect(sameCategories(["rooms", "gear"], ["gear", "rooms"])).toBe(false);
  });
});

describe("GALLERY_CATEGORY_OPTIONS", () => {
  test("matches the public Convex catalogue (rooms, gear, grounds)", () => {
    expect(GALLERY_CATEGORY_OPTIONS.map((option) => option.slug)).toEqual([
      "rooms",
      "gear",
      "grounds",
    ]);
  });

  test("every option carries a non-empty user-facing label", () => {
    for (const option of GALLERY_CATEGORY_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
    }
  });
});
