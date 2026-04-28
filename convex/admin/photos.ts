import { v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
  ALLOWED_GALLERY_IMAGE_TYPES,
  GALLERY_CATEGORY_SLUGS,
  MAX_GALLERY_IMAGE_BYTES,
  MAX_GALLERY_PHOTOS,
  type GalleryPhotoDoc,
  type GalleryPublishIssue,
  deleteStorageIfUnreferenced,
  ensureGalleryMeta,
  galleryDraftMatchesPublished,
  getStorageMetadata,
  isGalleryCategorySlug,
  loadGalleryPhotos,
  materializeGalleryPhotos,
  normalizeGalleryCategories,
  patchGalleryMetaAfterDraftChange,
  replaceGalleryScope,
} from "../galleryPhotos";
import { getSectionMetaRow, recomputeSectionHasDraftChanges } from "../cmsMeta";
import { cmsNotFound, cmsPublishValidationFailed, cmsValidationError } from "../errors";
import { requireCmsOwner } from "../lib/auth";
import { promoteGalleryPageCmsFlag } from "../photosCmsFlags";

const MAX_ALT_LENGTH = 240;
const MAX_CAPTION_LENGTH = 600;
const MAX_FILENAME_LENGTH = 255;
const MAX_IMAGE_DIMENSION = 20_000;

function isAllowedGalleryImageType(
  contentType: string,
): contentType is (typeof ALLOWED_GALLERY_IMAGE_TYPES)[number] {
  return (ALLOWED_GALLERY_IMAGE_TYPES as readonly string[]).includes(contentType);
}

function generatePhotoStableId(): string {
  return `photo_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeAlt(raw: string): string {
  const value = raw.trim();
  if (value.length === 0) {
    cmsValidationError("Alt text is required.", "alt");
  }
  if (value.length > MAX_ALT_LENGTH) {
    cmsValidationError(
      `Alt text must be at most ${MAX_ALT_LENGTH} characters.`,
      "alt",
    );
  }
  return value;
}

function normalizeCaption(raw?: string | null): string | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const value = raw.trim();
  if (value.length === 0) {
    return undefined;
  }
  if (value.length > MAX_CAPTION_LENGTH) {
    cmsValidationError(
      `Caption must be at most ${MAX_CAPTION_LENGTH} characters.`,
      "caption",
    );
  }
  return value;
}

function normalizeFileName(raw?: string | null): string | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const value = raw.trim();
  if (value.length === 0) {
    return undefined;
  }
  if (value.length > MAX_FILENAME_LENGTH) {
    cmsValidationError(
      `Filename must be at most ${MAX_FILENAME_LENGTH} characters.`,
      "originalFileName",
    );
  }
  return value;
}

function normalizeCategoriesInput(
  raw: readonly string[] | null | undefined,
): string[] | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (raw.length === 0) return undefined;
  for (const value of raw) {
    if (typeof value !== "string") {
      cmsValidationError("Category values must be strings.", "categories");
    }
    const slug = value.trim().toLowerCase();
    if (slug.length === 0) continue;
    if (!isGalleryCategorySlug(slug)) {
      cmsValidationError(
        `Unknown gallery category: ${value}. Allowed: ${GALLERY_CATEGORY_SLUGS.join(", ")}.`,
        "categories",
      );
    }
  }
  // Re-use the public normaliser to dedupe + canonicalise the order.
  return normalizeGalleryCategories(raw);
}

function normalizeDimension(
  value: number | null | undefined,
  field: "width" | "height",
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Number.isInteger(value) || value < 1 || value > MAX_IMAGE_DIMENSION) {
    cmsValidationError(
      `${field} must be a whole number between 1 and ${MAX_IMAGE_DIMENSION}.`,
      field,
    );
  }
  return value;
}

function validateStorageMetadataOrThrow(
  storage: Awaited<ReturnType<typeof getStorageMetadata>>,
): asserts storage is NonNullable<
  Awaited<ReturnType<typeof getStorageMetadata>>
> & { contentType: string } {
  if (!storage) {
    cmsValidationError("Uploaded file was not found in storage.", "storageId");
  }

  if (!storage.contentType) {
    cmsValidationError(
      "Uploaded image is missing a content type. Upload JPEG, PNG, or WebP files only.",
      "storageId",
    );
  }

  if (!isAllowedGalleryImageType(storage.contentType)) {
    cmsValidationError(
      "Only JPEG, PNG, and WebP images are allowed.",
      "storageId",
    );
  }

  if (storage.size > MAX_GALLERY_IMAGE_BYTES) {
    cmsValidationError(
      `Images must be ${Math.floor(MAX_GALLERY_IMAGE_BYTES / (1024 * 1024))}MB or smaller.`,
      "storageId",
    );
  }
}

function collectPhotoIssues(
  rows: GalleryPhotoDoc[],
  storageById: Map<Id<"_storage">, Awaited<ReturnType<typeof getStorageMetadata>>>,
): GalleryPublishIssue[] {
  const issues: GalleryPublishIssue[] = [];
  const stableIds = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const base = `photos[${i}]`;

    if (row.alt.trim().length === 0) {
      issues.push({
        path: `${base}.alt`,
        message: "Alt text is required.",
      });
    }
    if (row.alt.length > MAX_ALT_LENGTH) {
      issues.push({
        path: `${base}.alt`,
        message: `Alt text must be at most ${MAX_ALT_LENGTH} characters.`,
      });
    }
    if ((row.caption ?? "").length > MAX_CAPTION_LENGTH) {
      issues.push({
        path: `${base}.caption`,
        message: `Caption must be at most ${MAX_CAPTION_LENGTH} characters.`,
      });
    }
    if (
      row.width !== undefined &&
      (!Number.isInteger(row.width) || row.width < 1 || row.width > MAX_IMAGE_DIMENSION)
    ) {
      issues.push({
        path: `${base}.width`,
        message: `Width must be between 1 and ${MAX_IMAGE_DIMENSION}.`,
      });
    }
    if (
      row.height !== undefined &&
      (!Number.isInteger(row.height) || row.height < 1 || row.height > MAX_IMAGE_DIMENSION)
    ) {
      issues.push({
        path: `${base}.height`,
        message: `Height must be between 1 and ${MAX_IMAGE_DIMENSION}.`,
      });
    }
    if (stableIds.has(row.stableId)) {
      issues.push({
        path: `${base}.stableId`,
        message: `Duplicate stableId: ${row.stableId}`,
      });
    } else {
      stableIds.add(row.stableId);
    }

    if (row.categories !== undefined) {
      for (const category of row.categories) {
        if (!isGalleryCategorySlug(category)) {
          issues.push({
            path: `${base}.categories`,
            message: `Unknown category: ${category}. Allowed: ${GALLERY_CATEGORY_SLUGS.join(", ")}.`,
          });
        }
      }
    }

    const storage = storageById.get(row.storageId) ?? null;
    if (!storage) {
      issues.push({
        path: `${base}.storageId`,
        message: "Referenced storage blob is missing.",
      });
      continue;
    }
    if (!storage.contentType) {
      issues.push({
        path: `${base}.storageId`,
        message: "Storage blob is missing a content type.",
      });
      continue;
    }
    if (!isAllowedGalleryImageType(storage.contentType)) {
      issues.push({
        path: `${base}.storageId`,
        message: `Unsupported content type: ${storage.contentType}`,
      });
    }
    if (storage.size > MAX_GALLERY_IMAGE_BYTES) {
      issues.push({
        path: `${base}.storageId`,
        message: `Image exceeds ${Math.floor(MAX_GALLERY_IMAGE_BYTES / (1024 * 1024))}MB.`,
      });
    }
  }

  return issues;
}

async function getDraftPhotoByStableId(
  ctx: MutationCtx,
  stableId: string,
): Promise<GalleryPhotoDoc | null> {
  return await ctx.db
    .query("galleryPhotos")
    .withIndex("by_scope_and_stableId", (q) =>
      q.eq("scope", "draft").eq("stableId", stableId),
    )
    .unique();
}

async function resequenceDraftPhotos(ctx: MutationCtx): Promise<void> {
  const draft = await loadGalleryPhotos(ctx, "draft");
  for (let i = 0; i < draft.length; i++) {
    if (draft[i].sortOrder !== i) {
      await ctx.db.patch(draft[i]._id, { sortOrder: i });
    }
  }
}

export async function validateDraftForPublish(
  ctx: MutationCtx,
  rows: GalleryPhotoDoc[],
): Promise<GalleryPublishIssue[]> {
  const storageRecords = await Promise.all(
    Array.from(new Set(rows.map((row) => row.storageId))).map(async (storageId) => [
      storageId,
      await getStorageMetadata(ctx, storageId),
    ] as const),
  );
  return collectPhotoIssues(rows, new Map(storageRecords));
}

export const listDraftPhotos = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    const rows = await loadGalleryPhotos(ctx, "draft");
    const [meta, photosCms] = await Promise.all([
      ctx.db
        .query("galleryPhotoMeta")
        .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
        .unique(),
      getSectionMetaRow(ctx, "photos"),
    ]);
    const metaAt = meta?.publishedAt ?? null;
    const cmsAt = photosCms?.publishedAt ?? null;
    const publishedAt =
      metaAt !== null && cmsAt !== null
        ? Math.max(metaAt, cmsAt)
        : (metaAt ?? cmsAt);
    const publishedBy =
      metaAt !== null && cmsAt !== null
        ? (metaAt >= cmsAt
            ? meta?.publishedBy
            : photosCms?.publishedBy)
        : (metaAt !== null ? meta?.publishedBy : photosCms?.publishedBy);
    return {
      photos: await materializeGalleryPhotos(ctx, rows),
      hasDraftChanges: meta?.hasDraftChanges ?? false,
      publishedAt,
      publishedBy: publishedBy ?? null,
      updatedAt: meta?.updatedAt ?? null,
      updatedBy: meta?.updatedBy ?? null,
      galleryPage: {
        isEnabledPublished: photosCms?.isEnabled,
        isEnabledDraft: photosCms?.isEnabledDraft,
      },
      limits: {
        maxPhotos: MAX_GALLERY_PHOTOS,
        maxImageBytes: MAX_GALLERY_IMAGE_BYTES,
        acceptedMimeTypes: [...ALLOWED_GALLERY_IMAGE_TYPES],
      },
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    return { uploadUrl: await ctx.storage.generateUploadUrl() };
  },
});

export const saveUploadedPhoto = mutation({
  args: {
    storageId: v.id("_storage"),
    alt: v.string(),
    caption: v.optional(v.union(v.string(), v.null())),
    width: v.optional(v.union(v.number(), v.null())),
    height: v.optional(v.union(v.number(), v.null())),
    originalFileName: v.optional(v.union(v.string(), v.null())),
    categories: v.optional(v.union(v.array(v.string()), v.null())),
    showInCarousel: v.optional(v.boolean()),
    showInGallery: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    await ensureGalleryMeta(ctx);

    const draft = await loadGalleryPhotos(ctx, "draft");
    if (draft.length >= MAX_GALLERY_PHOTOS) {
      await deleteStorageIfUnreferenced(ctx, args.storageId);
      cmsValidationError(
        `Gallery supports up to ${MAX_GALLERY_PHOTOS} photos.`,
        "storageId",
      );
    }

    try {
      const storage = await getStorageMetadata(ctx, args.storageId);
      validateStorageMetadataOrThrow(storage);
      const contentType = storage.contentType;

      const caption = normalizeCaption(args.caption);
      const width = normalizeDimension(args.width, "width");
      const height = normalizeDimension(args.height, "height");
      const originalFileName = normalizeFileName(args.originalFileName);
      const categories = normalizeCategoriesInput(args.categories);
      const showInCarousel = args.showInCarousel ?? true;
      const showInGallery = args.showInGallery ?? true;

      const sortOrder =
        draft.length === 0
          ? 0
          : Math.max(...draft.map((row) => row.sortOrder)) + 1;

      await ctx.db.insert("galleryPhotos", {
        scope: "draft",
        stableId: generatePhotoStableId(),
        storageId: args.storageId,
        alt: normalizeAlt(args.alt),
        ...(caption !== undefined ? { caption } : {}),
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
        sortOrder,
        contentType,
        sizeBytes: storage.size,
        ...(originalFileName !== undefined ? { originalFileName } : {}),
        ...(categories !== undefined ? { categories } : {}),
        ...(showInCarousel !== true || showInGallery !== true
          ? { showInCarousel, showInGallery }
          : {}),
      });
    } catch (error) {
      await deleteStorageIfUnreferenced(ctx, args.storageId);
      throw error;
    }

    await patchGalleryMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

export const updateDraftPhotoMetadata = mutation({
  args: {
    stableId: v.string(),
    alt: v.string(),
    caption: v.optional(v.union(v.string(), v.null())),
    /**
     * INF-47 — full replacement of the photo's category tags. Pass `[]`
     * (or `null`) to clear all categories. Field omitted = leave the
     * existing categories untouched, so old admin clients that haven't
     * been redeployed still work unchanged.
     */
    categories: v.optional(v.union(v.array(v.string()), v.null())),
    showInCarousel: v.optional(v.boolean()),
    showInGallery: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getDraftPhotoByStableId(ctx, args.stableId);
    if (!row) {
      cmsNotFound("galleryPhoto", args.stableId);
    }

    const patch: {
      alt: string;
      caption: string | undefined;
      categories?: string[] | undefined;
      showInCarousel?: boolean;
      showInGallery?: boolean;
    } = {
      alt: normalizeAlt(args.alt),
      caption: normalizeCaption(args.caption),
    };

    if (args.categories !== undefined) {
      patch.categories = normalizeCategoriesInput(args.categories);
    }
    if (args.showInCarousel !== undefined) {
      patch.showInCarousel = args.showInCarousel;
    }
    if (args.showInGallery !== undefined) {
      patch.showInGallery = args.showInGallery;
    }

    await ctx.db.patch(row._id, patch);

    await patchGalleryMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

export const reorderDraftPhotos = mutation({
  args: { orderedStableIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const draft = await loadGalleryPhotos(ctx, "draft");
    if (draft.length !== args.orderedStableIds.length) {
      cmsValidationError(
        "Reorder payload must include every draft photo exactly once.",
        "orderedStableIds",
      );
    }

    const draftIds = new Set(draft.map((row) => row.stableId));
    const orderedIds = new Set(args.orderedStableIds);
    if (
      orderedIds.size !== args.orderedStableIds.length ||
      draftIds.size !== orderedIds.size ||
      args.orderedStableIds.some((stableId) => !draftIds.has(stableId))
    ) {
      cmsValidationError(
        "Reorder payload must include every draft photo exactly once.",
        "orderedStableIds",
      );
    }

    const byStableId = new Map(draft.map((row) => [row.stableId, row]));
    for (let i = 0; i < args.orderedStableIds.length; i++) {
      const row = byStableId.get(args.orderedStableIds[i]);
      if (!row) {
        cmsNotFound("galleryPhoto", args.orderedStableIds[i]);
      }
      if (row.sortOrder !== i) {
        await ctx.db.patch(row._id, { sortOrder: i });
      }
    }

    await patchGalleryMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

export const removeDraftPhoto = mutation({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getDraftPhotoByStableId(ctx, args.stableId);
    if (!row) {
      return { ok: true as const, removed: false };
    }

    await ctx.db.delete(row._id);
    await resequenceDraftPhotos(ctx);
    await deleteStorageIfUnreferenced(ctx, row.storageId);
    await patchGalleryMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const, removed: true };
  },
});

/** Shared draft → published promote for gallery (used by `publishPhotos` and `publishSite`). */
export async function publishGalleryDraftCore(
  ctx: MutationCtx,
  args: { userId: string; updatedBy: string },
): Promise<{
  ok: true;
  kind: "published";
  /** Latest publish stamp across gallery photos and gallery-page CMS flag. */
  publishedAt: number | null;
  publishedBy: string | undefined;
}> {
  const { userId, updatedBy } = args;
  const draft = await loadGalleryPhotos(ctx, "draft");
  const published = await loadGalleryPhotos(ctx, "published");
  const issues = await validateDraftForPublish(ctx, draft);
  if (issues.length > 0) {
    cmsPublishValidationFailed(
      "photos",
      "Publish validation failed.",
      issues,
    );
  }

  const photosMatch = galleryDraftMatchesPublished(draft, published);
  const now = Date.now();
  const { id: metaId } = await ensureGalleryMeta(ctx);

  if (!photosMatch) {
    await replaceGalleryScope(ctx, "draft", "published");
    await ctx.db.patch(metaId, {
      hasDraftChanges: false,
      publishedAt: now,
      publishedBy: userId,
      updatedAt: now,
      updatedBy,
    });
  } else {
    await ctx.db.patch(metaId, {
      hasDraftChanges: false,
      publishedAt: now,
      publishedBy: userId,
      updatedAt: now,
      updatedBy,
    });
  }

  await promoteGalleryPageCmsFlag(ctx, { userId, updatedBy, publishedAt: now });

  const metaFinal = await ctx.db.get(metaId);
  const photosCmsFinal = await getSectionMetaRow(ctx, "photos");
  const metaAt = metaFinal?.publishedAt ?? null;
  const cmsAt = photosCmsFinal?.publishedAt ?? null;
  const publishedAt =
    metaAt !== null && cmsAt !== null
      ? Math.max(metaAt, cmsAt)
      : (metaAt ?? cmsAt);
  const publishedBy =
    metaAt !== null && cmsAt !== null
      ? (metaAt >= cmsAt
          ? metaFinal?.publishedBy
          : photosCmsFinal?.publishedBy)
      : (metaAt !== null ? metaFinal?.publishedBy : photosCmsFinal?.publishedBy);

  return {
    ok: true as const,
    kind: "published" as const,
    publishedAt,
    publishedBy,
  };
}

/**
 * One-shot: set `showInCarousel` / `showInGallery` to `true` where missing so
 * existing rows behave like before surface flags existed.
 *
 * `bunx convex run admin/photos:backfillGallerySurfaceFlags`
 */
export const backfillGallerySurfaceFlags = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("galleryPhotos").collect();
    let updated = 0;
    for (const row of rows) {
      if (
        row.showInCarousel !== undefined &&
        row.showInGallery !== undefined
      ) {
        continue;
      }
      await ctx.db.patch(row._id, {
        ...(row.showInCarousel === undefined ? { showInCarousel: true } : {}),
        ...(row.showInGallery === undefined ? { showInGallery: true } : {}),
      });
      updated++;
    }
    return { ok: true as const, updated };
  },
});

export const publishPhotos = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId, updatedBy } = await requireCmsOwner(ctx);
    return await publishGalleryDraftCore(ctx, { userId, updatedBy });
  },
});

export const discardDraftPhotos = mutation({
  args: {},
  handler: async (ctx) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    await ensureGalleryMeta(ctx);

    const draft = await loadGalleryPhotos(ctx, "draft");
    const published = await loadGalleryPhotos(ctx, "published");
    if (!galleryDraftMatchesPublished(draft, published)) {
      await replaceGalleryScope(ctx, "published", "draft");
    }

    await patchGalleryMetaAfterDraftChange(ctx, updatedBy);

    const cmsRow = await getSectionMetaRow(ctx, "photos");
    if (
      cmsRow &&
      (cmsRow.hasDraftChanges || typeof cmsRow.isEnabledDraft === "boolean")
    ) {
      const now = Date.now();
      await ctx.db.patch(cmsRow._id, {
        isEnabledDraft: undefined,
        updatedAt: now,
        updatedBy,
      });
      await recomputeSectionHasDraftChanges(ctx, "photos", updatedBy);
    }

    return { ok: true as const, discarded: true };
  },
});
