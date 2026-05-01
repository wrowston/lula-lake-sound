import { describe, expect, test } from "bun:test";
import {
  normalizeExternalIdForProvider,
  parseHttpsThumbnailUrl,
} from "./videoUrls";

describe("normalizeExternalIdForProvider", () => {
  test("youtube: accepts bare id", () => {
    expect(normalizeExternalIdForProvider("youtube", "dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  test("youtube: parses watch URL", () => {
    expect(
      normalizeExternalIdForProvider(
        "youtube",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      ),
    ).toBe("dQw4w9WgXcQ");
  });

  test("youtube: rejects invalid host", () => {
    expect(() =>
      normalizeExternalIdForProvider(
        "youtube",
        "https://evil.com/embed/dQw4w9WgXcQ",
      ),
    ).toThrow();
  });

  test("vimeo: parses numeric id from URL path", () => {
    expect(
      normalizeExternalIdForProvider("vimeo", "https://vimeo.com/123456789"),
    ).toBe("123456789");
  });

  test("mux: accepts playback id string", () => {
    expect(normalizeExternalIdForProvider("mux", "abc123xyz")).toBe(
      "abc123xyz",
    );
  });
});

describe("parseHttpsThumbnailUrl", () => {
  test("allows YouTube CDN", () => {
    expect(
      parseHttpsThumbnailUrl(
        "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      ).hostname,
    ).toBe("i.ytimg.com");
  });

  test("rejects arbitrary host", () => {
    expect(() =>
      parseHttpsThumbnailUrl("https://evil.com/thumb.jpg"),
    ).toThrow();
  });
});
