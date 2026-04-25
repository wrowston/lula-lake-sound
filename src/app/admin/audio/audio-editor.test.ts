import { describe, expect, test } from "bun:test";
import {
  defaultTitleFromFileName,
  formatBytes,
  formatDuration,
  isAcceptedAudioFile,
  validateTrackFields,
} from "./audio-editor";

function makeFile(name: string, type: string, size = 1024): File {
  const data = new Uint8Array(size);
  return new File([data], name, { type });
}

describe("defaultTitleFromFileName", () => {
  test("drops the extension", () => {
    expect(defaultTitleFromFileName("session.mp3")).toBe("Session");
    expect(defaultTitleFromFileName("live-take.wav")).toBe("Live take");
  });

  test("converts dashes/underscores to spaces", () => {
    expect(defaultTitleFromFileName("behind_the_board.mp3")).toBe(
      "Behind the board",
    );
  });

  test("empty / whitespace filename → 'Untitled track' fallback", () => {
    expect(defaultTitleFromFileName(".mp3")).toBe("Untitled track");
    expect(defaultTitleFromFileName("   .wav")).toBe("Untitled track");
  });
});

describe("formatBytes", () => {
  test("bytes / KB / MB scales", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("formatDuration", () => {
  test("null / invalid / negative → dash", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(Number.NaN)).toBe("—");
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("—");
    expect(formatDuration(-3)).toBe("—");
  });

  test("rounds down to whole seconds and pads", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(5.8)).toBe("0:05");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3599)).toBe("59:59");
    expect(formatDuration(3600)).toBe("60:00");
  });
});

describe("validateTrackFields", () => {
  test("title is required", () => {
    expect(validateTrackFields("", "", "something")).toContain("Title");
    expect(validateTrackFields("   ", "", "something")).toContain("Title");
  });

  test("title at most 200 chars", () => {
    expect(validateTrackFields("a".repeat(200), "", "desc")).toBeNull();
    expect(validateTrackFields("a".repeat(201), "", "desc")).toContain("200");
  });

  test("artist over 200 chars rejected", () => {
    expect(validateTrackFields("ok", "a".repeat(201), "desc")).toContain("200");
  });

  test("description required and capped", () => {
    expect(validateTrackFields("ok", "", "")).toContain("Description");
    expect(
      validateTrackFields("ok", "", "a".repeat(2001)),
    ).toContain("2000");
  });

  test("valid input passes", () => {
    expect(validateTrackFields("Track 1", "Artist", "Desc")).toBeNull();
  });
});

describe("isAcceptedAudioFile", () => {
  test("accepts MP3 by mime type", () => {
    expect(isAcceptedAudioFile(makeFile("a.mp3", "audio/mpeg"))).toBe(true);
    expect(isAcceptedAudioFile(makeFile("a.mp3", "audio/mp3"))).toBe(true);
  });

  test("accepts WAV by mime type variants", () => {
    expect(isAcceptedAudioFile(makeFile("a.wav", "audio/wav"))).toBe(true);
    expect(isAcceptedAudioFile(makeFile("a.wav", "audio/x-wav"))).toBe(true);
    expect(isAcceptedAudioFile(makeFile("a.wav", "audio/wave"))).toBe(true);
  });

  test("accepts any audio/* mime type as a best-effort fallback", () => {
    // Server still enforces the strict allowlist — the client check only
    // needs to reject obviously-wrong files before uploading.
    expect(isAcceptedAudioFile(makeFile("a.flac", "audio/flac"))).toBe(true);
  });

  test("accepts by filename extension when mime type is missing", () => {
    expect(isAcceptedAudioFile(makeFile("track.mp3", ""))).toBe(true);
    expect(isAcceptedAudioFile(makeFile("track.wav", ""))).toBe(true);
    expect(isAcceptedAudioFile(makeFile("track.mpeg", ""))).toBe(true);
  });

  test("rejects non-audio files", () => {
    expect(isAcceptedAudioFile(makeFile("doc.pdf", "application/pdf"))).toBe(
      false,
    );
    expect(isAcceptedAudioFile(makeFile("image.png", "image/png"))).toBe(
      false,
    );
    expect(isAcceptedAudioFile(makeFile("no-extension", ""))).toBe(false);
  });
});
