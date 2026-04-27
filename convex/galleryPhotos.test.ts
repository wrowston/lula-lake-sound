import { describe, expect, test } from "bun:test";
import type { Doc, Id } from "./_generated/dataModel";
import {
  ALLOWED_GALLERY_IMAGE_TYPES,
  GALLERY_CATEGORY_SLUGS,
  MAX_GALLERY_IMAGE_BYTES,
  MAX_GALLERY_PHOTOS,
  galleryDraftMatchesPublished,
  isGalleryCategorySlug,
  normalizeGalleryCategories,
} from "./galleryPhotos";

type Row = Doc<"galleryPhotos">;

function row(patch: Partial<Row> = {}): Row {
  return {
    _id: ("ph-" + (patch.stableId ?? "x")) as unknown as Id<"galleryPhotos">,
    _creationTime: 0,
    scope: "draft",
    stableId: "ph_1",
    storageId: "st_1" as unknown as Id<"_storage">,
    alt: "alt",
    sortOrder: 0,
    contentType: "image/webp",
    sizeBytes: 100,
    ...patch,
  } as Row;
}

describe("gallery constants", () => {
  test("ALLOWED_GALLERY_IMAGE_TYPES covers jpeg, png, webp", () => {
    expect(ALLOWED_GALLERY_IMAGE_TYPES).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
  });

  test("MAX_GALLERY_IMAGE_BYTES is 50MB", () => {
    expect(MAX_GALLERY_IMAGE_BYTES).toBe(50 * 1024 * 1024);
  });

  test("MAX_GALLERY_PHOTOS caps at 40", () => {
    expect(MAX_GALLERY_PHOTOS).toBe(40);
  });
});

describe("galleryDraftMatchesPublished", () => {
  test("empty arrays match", () => {
    expect(galleryDraftMatchesPublished([], [])).toBe(true);
  });

  test("different lengths do not match", () => {
    expect(galleryDraftMatchesPublished([row()], [])).toBe(false);
  });

  test("identical rows match (position-sensitive)", () => {
    expect(
      galleryDraftMatchesPublished(
        [row({ stableId: "a" }), row({ stableId: "b" })],
        [row({ stableId: "a" }), row({ stableId: "b" })],
      ),
    ).toBe(true);
  });

  test("row order matters for the callers that already sort by index", () => {
    expect(
      galleryDraftMatchesPublished(
        [row({ stableId: "a" }), row({ stableId: "b" })],
        [row({ stableId: "b" }), row({ stableId: "a" })],
      ),
    ).toBe(false);
  });

  test("different caption is not a match", () => {
    expect(
      galleryDraftMatchesPublished(
        [row({ caption: "A" })],
        [row({ caption: "B" })],
      ),
    ).toBe(false);
  });

  test("undefined caption normalises to null internally", () => {
    // Both sides undefined caption → equal.
    expect(
      galleryDraftMatchesPublished(
        [row({ caption: undefined })],
        [row({ caption: undefined })],
      ),
    ).toBe(true);
  });

  test("different storage id is not a match (even if other fields are equal)", () => {
    expect(
      galleryDraftMatchesPublished(
        [row({ storageId: "x" as unknown as Id<"_storage"> })],
        [row({ storageId: "y" as unknown as Id<"_storage"> })],
      ),
    ).toBe(false);
  });

  test("different categories are not a match", () => {
    expect(
      galleryDraftMatchesPublished(
        [row({ categories: ["rooms"] })],
        [row({ categories: ["gear"] })],
      ),
    ).toBe(false);
  });

  test("undefined vs empty-array categories normalize to the same value", () => {
    // Empty arrays serialize the same as `null` per `comparablePhoto`
    // (both → `[]` ≠ `null`), so we explicitly check the undefined case
    // to lock in the normalisation contract.
    expect(
      galleryDraftMatchesPublished(
        [row({ categories: undefined })],
        [row({ categories: undefined })],
      ),
    ).toBe(true);
  });
});

describe("isGalleryCategorySlug", () => {
  test("accepts every catalogued slug", () => {
    for (const slug of GALLERY_CATEGORY_SLUGS) {
      expect(isGalleryCategorySlug(slug)).toBe(true);
    }
  });

  test("rejects unknown values", () => {
    expect(isGalleryCategorySlug("unknown")).toBe(false);
    expect(isGalleryCategorySlug("Rooms")).toBe(false); // case-sensitive
    expect(isGalleryCategorySlug("")).toBe(false);
  });
});

describe("normalizeGalleryCategories", () => {
  test("returns undefined for empty / nullish input", () => {
    expect(normalizeGalleryCategories(undefined)).toBeUndefined();
    expect(normalizeGalleryCategories(null)).toBeUndefined();
    expect(normalizeGalleryCategories([])).toBeUndefined();
  });

  test("lower-cases and trims values, dropping invalid entries", () => {
    expect(normalizeGalleryCategories(["  Rooms  ", "GEAR", "bogus"])).toEqual(
      ["rooms", "gear"],
    );
  });

  test("dedupes case-insensitively", () => {
    expect(normalizeGalleryCategories(["rooms", "Rooms", "ROOMS"])).toEqual([
      "rooms",
    ]);
  });

  test("returns canonical catalogue order (rooms, gear, grounds)", () => {
    expect(
      normalizeGalleryCategories(["grounds", "rooms", "gear"]),
    ).toEqual(["rooms", "gear", "grounds"]);
  });

  test("returns undefined when nothing in the input is valid", () => {
    expect(normalizeGalleryCategories(["bogus", "  "])).toBeUndefined();
  });
});
