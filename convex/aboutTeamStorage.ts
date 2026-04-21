import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { AboutSnapshot } from "./cmsShared";
import {
  ALLOWED_GALLERY_IMAGE_TYPES,
  MAX_GALLERY_IMAGE_BYTES,
  getStorageMetadata,
} from "./galleryPhotos";

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
 * Collect Convex storage ids referenced by `teamMembers` on an about-shaped snapshot.
 */
export function collectAboutTeamStorageIds(snap: unknown): Set<Id<"_storage">> {
  const out = new Set<Id<"_storage">>();
  if (!snap || typeof snap !== "object") return out;
  const team = (snap as { teamMembers?: unknown }).teamMembers;
  if (!Array.isArray(team)) return out;
  for (const m of team) {
    if (!m || typeof m !== "object") continue;
    const sid = (m as { storageId?: unknown }).storageId;
    if (typeof sid === "string" && sid.length > 0) {
      out.add(sid as Id<"_storage">);
    }
  }
  return out;
}

/** Union of team headshot ids in published + draft for the about `cmsSections` row. */
export function unionAboutTeamStorageForRow(
  row: Doc<"cmsSections"> | null,
): Set<Id<"_storage">> {
  if (!row || row.section !== "about") return new Set();
  const a = collectAboutTeamStorageIds(row.publishedSnapshot);
  const b = row.draftSnapshot
    ? collectAboutTeamStorageIds(row.draftSnapshot)
    : new Set<Id<"_storage">>();
  return new Set([...a, ...b]);
}

async function getAboutSectionRow(
  ctx: MutationCtx,
): Promise<Doc<"cmsSections"> | null> {
  return await ctx.db
    .query("cmsSections")
    .withIndex("by_section", (q) => q.eq("section", "about"))
    .unique();
}

/**
 * Delete a storage blob if it is not referenced by the gallery or any about team field.
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

  const aboutRow = await getAboutSectionRow(ctx);
  if (aboutRow && unionAboutTeamStorageForRow(aboutRow).has(storageId)) {
    return;
  }

  const meta = await getStorageMetadata(ctx, storageId);
  if (!meta) return;
  await ctx.storage.delete(storageId);
}

/**
 * Async validation for team headshot blobs (publish / preflight).
 */
export async function collectAboutTeamBlobIssues(
  ctx: MutationCtx | QueryCtx,
  draft: AboutSnapshot,
): Promise<AboutPublishIssue[]> {
  const issues: AboutPublishIssue[] = [];
  const team = draft.teamMembers;
  if (team === undefined || team.length === 0) return issues;

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
        message: `${who}: image must be ${Math.floor(MAX_GALLERY_IMAGE_BYTES / (1024 * 1024))}MB or smaller.`,
      });
    }
  }
  return issues;
}

/**
 * After publish: remove team headshot blobs that were dropped from the published snapshot.
 */
export async function pruneAboutTeamBlobsAfterPublish(
  ctx: MutationCtx,
  previousPublishedSnapshot: unknown,
  newPublishedSnapshot: unknown,
): Promise<void> {
  const prev = collectAboutTeamStorageIds(previousPublishedSnapshot);
  const next = collectAboutTeamStorageIds(newPublishedSnapshot);
  for (const id of prev) {
    if (!next.has(id)) {
      await deleteBlobIfUnreferencedByGalleryOrAbout(ctx, id);
    }
  }
}

/**
 * After saveDraft (about): drop blobs no longer referenced by published ∪ new draft.
 */
export async function pruneAboutTeamBlobsAfterSaveDraft(
  ctx: MutationCtx,
  rowBefore: Doc<"cmsSections">,
  newDraftContent: AboutSnapshot,
): Promise<void> {
  if (rowBefore.section !== "about") return;
  const beforeUnion = unionAboutTeamStorageForRow(rowBefore);
  const publishedIds = collectAboutTeamStorageIds(rowBefore.publishedSnapshot);
  const draftIds = collectAboutTeamStorageIds(newDraftContent);
  const afterUnion = new Set([...publishedIds, ...draftIds]);
  for (const id of beforeUnion) {
    if (!afterUnion.has(id)) {
      await deleteBlobIfUnreferencedByGalleryOrAbout(ctx, id);
    }
  }
}

/**
 * Storage ids that appeared only on the draft (not on published) before discard.
 * Call after `patch` clears the draft so `deleteBlobIfUnreferencedByGalleryOrAbout`
 * no longer sees those ids on the about row.
 */
export function collectDraftOnlyAboutTeamStorageIds(
  rowBeforeDiscard: Doc<"cmsSections">,
): Id<"_storage">[] {
  if (rowBeforeDiscard.section !== "about" || !rowBeforeDiscard.draftSnapshot) {
    return [];
  }
  const publishedIds = collectAboutTeamStorageIds(
    rowBeforeDiscard.publishedSnapshot,
  );
  const draftIds = collectAboutTeamStorageIds(rowBeforeDiscard.draftSnapshot);
  return [...draftIds].filter((id) => !publishedIds.has(id));
}

/** Delete draft-only headshot blobs after discard (invoke after DB patch). */
export async function deleteDraftOnlyAboutTeamBlobs(
  ctx: MutationCtx,
  storageIds: Id<"_storage">[],
): Promise<void> {
  for (const id of storageIds) {
    await deleteBlobIfUnreferencedByGalleryOrAbout(ctx, id);
  }
}
