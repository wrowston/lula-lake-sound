import { describe, expect, test } from "bun:test";
import type { Doc, Id } from "./_generated/dataModel";
import {
  ABANDONED_DRAFT_AUDIO_MS,
  ALLOWED_AUDIO_MIME_TYPES,
  MAX_AUDIO_FILE_BYTES,
  MAX_AUDIO_TRACKS,
  audioDraftMatchesPublished,
} from "./audioTracks";

type Row = Doc<"audioTracks">;

function row(patch: Partial<Row> = {}): Row {
  return {
    _id: ("at-" + (patch.stableId ?? "x")) as unknown as Id<"audioTracks">,
    _creationTime: 0,
    scope: "draft",
    stableId: "at_1",
    storageId: "st_1" as unknown as Id<"_storage">,
    title: "Song",
    description: "Sample description",
    mimeType: "audio/mpeg",
    sortOrder: 0,
    sizeBytes: 1024,
    createdAt: 0,
    ...patch,
  } as Row;
}

describe("audio constants", () => {
  test("ALLOWED_AUDIO_MIME_TYPES covers the expected MP3/WAV variants", () => {
    expect([...ALLOWED_AUDIO_MIME_TYPES]).toEqual([
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
    ]);
  });

  test("MAX_AUDIO_FILE_BYTES is 100MB", () => {
    expect(MAX_AUDIO_FILE_BYTES).toBe(100 * 1024 * 1024);
  });

  test("MAX_AUDIO_TRACKS caps at 30", () => {
    expect(MAX_AUDIO_TRACKS).toBe(30);
  });

  test("ABANDONED_DRAFT_AUDIO_MS is 7 days", () => {
    expect(ABANDONED_DRAFT_AUDIO_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("audioDraftMatchesPublished", () => {
  test("empty arrays match", () => {
    expect(audioDraftMatchesPublished([], [])).toBe(true);
  });

  test("different lengths do not match", () => {
    expect(audioDraftMatchesPublished([row()], [])).toBe(false);
  });

  test("same content → match", () => {
    expect(
      audioDraftMatchesPublished(
        [row({ stableId: "a" }), row({ stableId: "b" })],
        [row({ stableId: "a" }), row({ stableId: "b" })],
      ),
    ).toBe(true);
  });

  test("different storageId → not a match (replace file is a draft change)", () => {
    // Replace-flow sanity check: swapping the blob for the same stableId
    // must flip `hasDraftChanges` to true so the toolbar enables Publish.
    expect(
      audioDraftMatchesPublished(
        [row({ storageId: "new" as unknown as Id<"_storage"> })],
        [row({ storageId: "old" as unknown as Id<"_storage"> })],
      ),
    ).toBe(false);
  });

  test("different title / description → not a match", () => {
    expect(
      audioDraftMatchesPublished(
        [row({ title: "A" })],
        [row({ title: "B" })],
      ),
    ).toBe(false);
    expect(
      audioDraftMatchesPublished(
        [row({ description: "A" })],
        [row({ description: "B" })],
      ),
    ).toBe(false);
  });

  test("order matters", () => {
    expect(
      audioDraftMatchesPublished(
        [row({ stableId: "a", sortOrder: 0 }), row({ stableId: "b", sortOrder: 1 })],
        [row({ stableId: "b", sortOrder: 1 }), row({ stableId: "a", sortOrder: 0 })],
      ),
    ).toBe(false);
  });
});
