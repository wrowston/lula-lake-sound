import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  ALLOWED_GALLERY_IMAGE_TYPES,
  MAX_GALLERY_IMAGE_BYTES,
  getStorageMetadata,
} from "./galleryPhotos";
import {
  collectAboutTeamStorageIdsFromTree,
  loadAboutTree,
  type AboutTree,
} from "./aboutTree";

/** Max team members per About snapshot (CMS guard). */
export const MAX_ABOUT_TEAM_MEMBERS = 20;

/** Matches {@link cmsPublishHelpers.PublishIssue} — kept local to avoid circular imports. */
type AboutPublishIssue = { path: string; message: string };

function isAllowedImageType(
  contentType: string,
): contentType is (typeof ALLOWED_GALLERY_IMAGE_TYPES)[number] {
  return (ALLOWED_GALLERY_IMAGE_TYPES as readonly string[]).includes(
    contentType,
  );
}

/**
 * Union of team headshot + hero image ids across published ∪ draft scopes.
 * Used by blob-cleanup helpers so we never delete a blob still referenced by
 * either scope.
 */
export async function unionAboutTeamStorage(
  ctx: QueryCtx | MutationCtx,
): Promise<Set<Id<"_storage">>> {
  const [draft, published] = await Promise.all([
    loadAboutTree(ctx, "draft"),
    loadAboutTree(ctx, "published"),
  ]);
  const a = collectAboutTeamStorageIdsFromTree(draft);
  const b = collectAboutTeamStorageIdsFromTree(published);
  return new Set([...a, ...b]);
}

/**
 * Delete a storage blob if it is not referenced by the gallery or any
 * About team / hero field in either scope.
 */
export async function deleteBlobIfUnreferencedByGalleryOrAbout(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
): Promise<void> {
  const galleryRefs = await ctx.db
    .query("galleryPhotos")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .take(1);
  if (galleryRefs.length > 0) return;

  const referenced = await unionAboutTeamStorage(ctx);
  if (referenced.has(storageId)) return;

  const meta = await getStorageMetadata(ctx, storageId);
  if (!meta) return;
  await ctx.storage.delete(storageId);
}

/**
 * Async validation for team headshot blobs (publish / preflight). Reads the
 * already-loaded draft tree so callers don't pay a second DB round-trip.
 */
export async function collectAboutTeamBlobIssuesForTree(
  ctx: MutationCtx | QueryCtx,
  tree: AboutTree,
): Promise<AboutPublishIssue[]> {
  const issues: AboutPublishIssue[] = [];
  const team = tree.teamMembers;
  if (team.length === 0) return issues;

  for (let i = 0; i < team.length; i++) {
    const base = `teamMembers[${i}]`;
    const who = `Team member ${i + 1}`;
    const storageId = team[i].storageId;
    if (storageId === undefined) {
      continue;
    }
    const storage = await getStorageMetadata(ctx, storageId);
    if (!storage) {
      issues.push({
        path: `${base}.storageId`,
        message: `${who}: uploaded image was not found. Try uploading again.`,
      });
      continue;
    }
    if (!storage.contentType) {
      issues.push({
        path: `${base}.storageId`,
        message: `${who}: image type is missing. Use JPEG, PNG, or WebP.`,
      });
      continue;
    }
    if (!isAllowedImageType(storage.contentType)) {
      issues.push({
        path: `${base}.storageId`,
        message: `${who}: only JPEG, PNG, and WebP images are allowed.`,
      });
      continue;
    }
    if (storage.size > MAX_GALLERY_IMAGE_BYTES) {
      issues.push({
        path: `${base}.storageId`,
        message: `${who}: image must be ${Math.floor(
          MAX_GALLERY_IMAGE_BYTES / (1024 * 1024),
        )}MB or smaller.`,
      });
    }
  }
  return issues;
}

/**
 * @deprecated Use {@link collectAboutTeamBlobIssuesForTree}. This wrapper
 * loads the draft tree from the DB for callers that don't have it yet.
 */
export async function collectAboutTeamBlobIssues(
  ctx: MutationCtx | QueryCtx,
): Promise<AboutPublishIssue[]> {
  const draft = await loadAboutTree(ctx, "draft");
  return collectAboutTeamBlobIssuesForTree(ctx, draft);
}

/**
 * After publish: remove team headshot / hero blobs that were dropped from
 * the published scope.
 */
export async function pruneAboutTeamBlobsAfterPublishScoped(
  ctx: MutationCtx,
  previousPublished: AboutTree,
  newPublished: AboutTree,
): Promise<void> {
  const prev = collectAboutTeamStorageIdsFromTree(previousPublished);
  const next = collectAboutTeamStorageIdsFromTree(newPublished);
  for (const id of prev) {
    if (!next.has(id)) {
      await deleteBlobIfUnreferencedByGalleryOrAbout(ctx, id);
    }
  }
}

/**
 * After saveDraft (about): drop blobs no longer referenced by published ∪
 * the freshly-persisted draft scope.
 */
export async function pruneAboutTeamBlobsAfterSaveDraftScoped(
  ctx: MutationCtx,
  previousUnion: Set<Id<"_storage">>,
): Promise<void> {
  const afterUnion = await unionAboutTeamStorage(ctx);
  for (const id of previousUnion) {
    if (!afterUnion.has(id)) {
      await deleteBlobIfUnreferencedByGalleryOrAbout(ctx, id);
    }
  }
}
