/**
 * Admin publish API (INF-75).
 *
 * Prefer **`api.admin.publish.publish`** for explicit admin flows and
 * **`api.cms.publishSection`** for the shared CMS module (both enforce the
 * owner gate when `CMS_OWNER_TOKEN_IDENTIFIERS` is set).
 *
 * Env: `CMS_OWNER_TOKEN_IDENTIFIERS` — comma-separated Convex `tokenIdentifier`
 * values (Clerk). When unset, any signed-in user may publish (dev convenience).
 */
import { mutation } from "../_generated/server";
import { cmsSectionValidator } from "../schema.shared";
import type { Doc } from "../_generated/dataModel";
import { requireCmsOwner } from "../lib/auth";
import { cmsPublishValidationFailed } from "../errors";
import { loadGalleryPhotos } from "../galleryPhotos";
import { loadAudioTracks } from "../audioTracks";
import { loadVideos } from "../videos";
import { collectAboutTeamBlobIssues } from "../aboutTeamStorage";
import {
  collectAllPublishIssues,
  publishSectionCore,
  rowsWithPublishableDraft,
} from "../cmsPublishHelpers";
import { ensureSectionMetaRow } from "../cmsMeta";
import { publishGalleryDraftCore, validateDraftForPublish } from "./photos";
import { publishAudioDraftCore, validateDraftAudioForPublish } from "./audio";
import {
  publishVideosDraftCore,
  validateDraftVideosForPublish,
} from "./videos";
import { CMS_PENDING_DRAFT_QUERY_LIMIT } from "../cmsShared";

export const publish = mutation({
  args: { section: cmsSectionValidator },
  handler: async (ctx, args) => {
    const { userId, updatedBy } = await requireCmsOwner(ctx);
    const { id, row } = await ensureSectionMetaRow(ctx, args.section, updatedBy);
    return await publishSectionCore(ctx, {
      section: args.section,
      id,
      row,
      publishedByUserId: userId,
      updatedByTokenId: updatedBy,
    });
  },
});

export const publishSite = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId, updatedBy } = await requireCmsOwner(ctx);

    const rows = await ctx.db
      .query("cmsSections")
      .withIndex("by_hasDraftChanges", (q) => q.eq("hasDraftChanges", true))
      .take(CMS_PENDING_DRAFT_QUERY_LIMIT);
    const targets = rowsWithPublishableDraft(rows);

    const galleryMeta = await ctx.db
      .query("galleryPhotoMeta")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();
    const galleryPending = galleryMeta?.hasDraftChanges ?? false;

    const audioMeta = await ctx.db
      .query("audioTrackMeta")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();
    const audioPending = audioMeta?.hasDraftChanges ?? false;

    const videoMeta = await ctx.db
      .query("videoMeta")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();
    const videosPending = videoMeta?.hasDraftChanges ?? false;

    if (targets.length === 0 && !galleryPending && !audioPending && !videosPending) {
      return {
        ok: true as const,
        kind: "nothing_to_publish" as const,
        publishedSections: [] as Doc<"cmsSections">["section"][],
      };
    }

    const issues = await collectAllPublishIssues(ctx, targets);
    for (const row of targets) {
      if (row.section === "about") {
        const blobIssues = await collectAboutTeamBlobIssues(ctx);
        for (const issue of blobIssues) {
          issues.push({
            path: `about.${issue.path}`,
            message: issue.message,
          });
        }
      }
    }
    if (galleryPending) {
      const draft = await loadGalleryPhotos(ctx, "draft");
      const photoIssues = await validateDraftForPublish(ctx, draft);
      for (const issue of photoIssues) {
        issues.push({
          path: `photos.${issue.path}`,
          message: issue.message,
        });
      }
    }
    if (audioPending) {
      const draftAudio = await loadAudioTracks(ctx, "draft");
      const audioIssues = await validateDraftAudioForPublish(ctx, draftAudio);
      for (const issue of audioIssues) {
        issues.push({
          path: `audio.${issue.path}`,
          message: issue.message,
        });
      }
    }
    if (videosPending) {
      const draftVideos = await loadVideos(ctx, "draft");
      const videoIssues = await validateDraftVideosForPublish(ctx, draftVideos);
      for (const issue of videoIssues) {
        issues.push({
          path: `videos.${issue.path}`,
          message: issue.message,
        });
      }
    }
    if (issues.length > 0) {
      cmsPublishValidationFailed(
        "site",
        "One or more sections failed publish validation.",
        issues,
      );
    }

    const results: Awaited<ReturnType<typeof publishSectionCore>>[] = [];

    for (const row of targets) {
      const r = await publishSectionCore(ctx, {
        section: row.section,
        id: row._id,
        row,
        publishedByUserId: userId,
        updatedByTokenId: updatedBy,
      });
      results.push(r);
    }

    const galleryResult = galleryPending
      ? await publishGalleryDraftCore(ctx, { userId, updatedBy })
      : undefined;

    const audioResult = audioPending
      ? await publishAudioDraftCore(ctx, { userId, updatedBy })
      : undefined;

    const videosResult = videosPending
      ? await publishVideosDraftCore(ctx, { userId, updatedBy })
      : undefined;

    return {
      ok: true as const,
      kind: "published" as const,
      publishedSections: targets.map((t) => t.section),
      results,
      ...(galleryResult !== undefined ? { gallery: galleryResult } : {}),
      ...(audioResult !== undefined ? { audio: audioResult } : {}),
      ...(videosResult !== undefined ? { videos: videosResult } : {}),
    };
  },
});
