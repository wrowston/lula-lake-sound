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

/**
 * Mirrors the server allowlist returned by `listDraftAudioTracks().limits`.
 * Kept locally so the test doesn't depend on a Convex import.
 */
const ACCEPTED_MIME_TYPES: readonly string[] = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
];

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
    expect(validateTrackFields("", "", "", "", "", "something")).toContain(
      "Title",
    );
    expect(validateTrackFields("   ", "", "", "", "", "something")).toContain(
      "Title",
    );
  });

  test("title at most 200 chars", () => {
    expect(
      validateTrackFields("a".repeat(200), "", "", "", "", "desc"),
    ).toBeNull();
    expect(validateTrackFields("a".repeat(201), "", "", "", "", "desc")).toContain(
      "200",
    );
  });

  test("artist over 200 chars rejected", () => {
    expect(
      validateTrackFields("ok", "a".repeat(201), "", "", "", "desc"),
    ).toContain("200");
  });

  test("recording metadata is capped and year is bounded", () => {
    expect(validateTrackFields("ok", "", "a".repeat(101), "", "", "desc")).toContain(
      "100",
    );
    expect(validateTrackFields("ok", "", "", "1799", "", "desc")).toContain(
      "1800",
    );
    expect(validateTrackFields("ok", "", "", "2026", "a".repeat(201), "desc"))
      .toContain("200");
  });

  test("description required and capped", () => {
    expect(validateTrackFields("ok", "", "", "", "", "")).toContain(
      "Description",
    );
    expect(
      validateTrackFields("ok", "", "", "", "", "a".repeat(2001)),
    ).toContain("2000");
  });

  test("valid input passes", () => {
    expect(
      validateTrackFields(
        "Track 1",
        "Artist",
        "Americana",
        "2026",
        "Recorded and mixed",
        "Desc",
      ),
    ).toBeNull();
  });
});

describe("isAcceptedAudioFile", () => {
  test("accepts MP3 by mime type", () => {
    expect(
      isAcceptedAudioFile(makeFile("a.mp3", "audio/mpeg"), ACCEPTED_MIME_TYPES),
    ).toBe(true);
    expect(
      isAcceptedAudioFile(makeFile("a.mp3", "audio/mp3"), ACCEPTED_MIME_TYPES),
    ).toBe(true);
  });

  test("accepts WAV by mime type variants", () => {
    expect(
      isAcceptedAudioFile(makeFile("a.wav", "audio/wav"), ACCEPTED_MIME_TYPES),
    ).toBe(true);
    expect(
      isAcceptedAudioFile(
        makeFile("a.wav", "audio/x-wav"),
        ACCEPTED_MIME_TYPES,
      ),
    ).toBe(true);
    expect(
      isAcceptedAudioFile(makeFile("a.wav", "audio/wave"), ACCEPTED_MIME_TYPES),
    ).toBe(true);
  });

  test("rejects audio/* MIME types not on the server allowlist", () => {
    // The server enforces the same list, so refusing FLAC client-side avoids
    // a wasted upload + round-trip rejection.
    expect(
      isAcceptedAudioFile(
        makeFile("a.flac", "audio/flac"),
        ACCEPTED_MIME_TYPES,
      ),
    ).toBe(false);
  });

  test("accepts by filename extension when mime type is missing", () => {
    expect(
      isAcceptedAudioFile(makeFile("track.mp3", ""), ACCEPTED_MIME_TYPES),
    ).toBe(true);
    expect(
      isAcceptedAudioFile(makeFile("track.wav", ""), ACCEPTED_MIME_TYPES),
    ).toBe(true);
  });

  test("rejects .mpeg / unknown extensions when mime type is missing", () => {
    // Server allowlist only accepts .mp3 / .wav files; the filename fallback
    // mirrors that.
    expect(
      isAcceptedAudioFile(makeFile("track.mpeg", ""), ACCEPTED_MIME_TYPES),
    ).toBe(false);
  });

  test("accepts a Set or array allowlist interchangeably", () => {
    const asSet = new Set(ACCEPTED_MIME_TYPES);
    expect(
      isAcceptedAudioFile(makeFile("a.mp3", "audio/mpeg"), asSet),
    ).toBe(true);
  });

  test("rejects non-audio files", () => {
    expect(
      isAcceptedAudioFile(
        makeFile("doc.pdf", "application/pdf"),
        ACCEPTED_MIME_TYPES,
      ),
    ).toBe(false);
    expect(
      isAcceptedAudioFile(
        makeFile("image.png", "image/png"),
        ACCEPTED_MIME_TYPES,
      ),
    ).toBe(false);
    expect(
      isAcceptedAudioFile(makeFile("no-extension", ""), ACCEPTED_MIME_TYPES),
    ).toBe(false);
  });
});
