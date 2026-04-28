import { describe, expect, test } from "bun:test";
import {
  buildMuxPlayerUrl,
  buildVimeoEmbedUrl,
  buildYouTubeEmbedUrl,
  defaultTitleFromFileName,
  formatBytes,
  formatDuration,
  getProviderLabel,
  isPlayableForPublish,
  resolveVideoPreview,
} from "./video-embed";

describe("buildYouTubeEmbedUrl", () => {
  test("uses the no-cookie host and privacy-enhanced params", () => {
    const url = buildYouTubeEmbedUrl("dQw4w9WgXcQ");
    expect(url.startsWith("https://www.youtube-nocookie.com/embed/")).toBe(
      true,
    );
    expect(url).toContain("dQw4w9WgXcQ");
    expect(url).toContain("rel=0");
    expect(url).toContain("modestbranding=1");
    expect(url).toContain("playsinline=1");
  });

  test("encodes the id (defense in depth — server already validated)", () => {
    const url = buildYouTubeEmbedUrl("safe id");
    expect(url).toContain("safe%20id");
  });
});

describe("buildVimeoEmbedUrl", () => {
  test("uses player.vimeo.com with dnt=1", () => {
    const url = buildVimeoEmbedUrl("123456789");
    expect(url.startsWith("https://player.vimeo.com/video/123456789")).toBe(
      true,
    );
    expect(url).toContain("dnt=1");
  });
});

describe("buildMuxPlayerUrl", () => {
  test("uses player.mux.com", () => {
    const url = buildMuxPlayerUrl("abc-123");
    expect(url).toBe("https://player.mux.com/abc-123");
  });

  test("includes metadata-video-title when provided", () => {
    const url = buildMuxPlayerUrl("abc-123", { title: "Live session" });
    expect(url.startsWith("https://player.mux.com/abc-123?")).toBe(true);
    expect(url).toContain("metadata-video-title=Live+session");
  });
});

describe("resolveVideoPreview", () => {
  test("youtube descriptor → iframe with privacy host", () => {
    const result = resolveVideoPreview({
      provider: "youtube",
      externalId: "dQw4w9WgXcQ",
    });
    if (result.kind !== "iframe") {
      throw new Error(`expected iframe, got ${result.kind}`);
    }
    expect(result.src).toContain("youtube-nocookie.com");
    expect(result.providerLabel).toBe("YouTube");
    expect(result.allowFullScreen).toBe(true);
  });

  test("vimeo descriptor → iframe", () => {
    const result = resolveVideoPreview({
      provider: "vimeo",
      externalId: "123456789",
    });
    expect(result.kind).toBe("iframe");
  });

  test("mux descriptor → iframe at player.mux.com", () => {
    const result = resolveVideoPreview(
      { provider: "mux", externalId: "playback-id" },
      { title: "Test" },
    );
    if (result.kind !== "iframe") {
      throw new Error(`expected iframe, got ${result.kind}`);
    }
    expect(result.src).toContain("player.mux.com/playback-id");
  });

  test("upload with materialized URL → video element with poster", () => {
    const result = resolveVideoPreview({
      provider: "upload",
      videoUrl: "https://example.com/x.mp4",
      thumbnailUrl: "https://example.com/poster.jpg",
    });
    if (result.kind !== "video") {
      throw new Error(`expected video, got ${result.kind}`);
    }
    expect(result.src).toBe("https://example.com/x.mp4");
    expect(result.poster).toBe("https://example.com/poster.jpg");
  });

  test("upload without URL → missing", () => {
    const result = resolveVideoPreview({ provider: "upload", videoUrl: null });
    expect(result.kind).toBe("missing");
  });

  test.each([
    ["youtube" as const],
    ["vimeo" as const],
    ["mux" as const],
  ])("%s without externalId → missing with helpful reason", (provider) => {
    const result = resolveVideoPreview({ provider, externalId: "" });
    if (result.kind !== "missing") {
      throw new Error(`expected missing, got ${result.kind}`);
    }
    expect(result.reason.length).toBeGreaterThan(0);
  });
});

describe("isPlayableForPublish", () => {
  test("missing title → not playable regardless of provider", () => {
    expect(
      isPlayableForPublish({
        title: "   ",
        provider: "youtube",
        externalId: "id",
      }),
    ).toBe(false);
  });

  test("youtube with externalId → playable", () => {
    expect(
      isPlayableForPublish({
        title: "Hello",
        provider: "youtube",
        externalId: "dQw4w9WgXcQ",
      }),
    ).toBe(true);
  });

  test("upload requires storageId or videoUrl", () => {
    expect(
      isPlayableForPublish({ title: "Hello", provider: "upload" }),
    ).toBe(false);
    expect(
      isPlayableForPublish({
        title: "Hello",
        provider: "upload",
        videoStorageId: "storage_id",
      }),
    ).toBe(true);
    expect(
      isPlayableForPublish({
        title: "Hello",
        provider: "upload",
        videoUrl: "https://example.com/x.mp4",
      }),
    ).toBe(true);
  });
});

describe("formatBytes", () => {
  test("bytes → KB → MB", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(900)).toBe("900 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("formatDuration", () => {
  test("null/undefined/negative → null", () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(undefined)).toBeNull();
    expect(formatDuration(-5)).toBeNull();
  });

  test("under an hour → m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(599)).toBe("9:59");
  });

  test("over an hour → h:mm:ss", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });
});

describe("defaultTitleFromFileName", () => {
  test("strips extension and capitalises", () => {
    expect(defaultTitleFromFileName("studio_session-01.mp4")).toBe(
      "Studio session 01",
    );
  });

  test("blank file name → studio video fallback", () => {
    expect(defaultTitleFromFileName(".mp4")).toBe("Studio video");
  });
});

describe("getProviderLabel", () => {
  test("known providers", () => {
    expect(getProviderLabel("youtube")).toBe("YouTube");
    expect(getProviderLabel("vimeo")).toBe("Vimeo");
    expect(getProviderLabel("mux")).toBe("Mux");
    expect(getProviderLabel("upload")).toBe("Upload");
  });
});
