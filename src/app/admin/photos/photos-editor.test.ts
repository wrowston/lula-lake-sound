import { describe, expect, test } from "bun:test";
import {
  defaultAltFromFileName,
  formatBytes,
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
