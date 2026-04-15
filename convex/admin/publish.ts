/**
 * Admin publish API (INF-75).
 *
 * Prefer **`api.admin.publish.publish`** for explicit admin flows and **`api.cms.publishSection`**
 * for the shared CMS module (both enforce owner gate when `CMS_OWNER_TOKEN_IDENTIFIERS` is set).
 *
 * Env: `CMS_OWNER_TOKEN_IDENTIFIERS` — comma-separated Convex `tokenIdentifier` values (Clerk).
 * When unset, any signed-in user may publish (dev convenience).
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { cmsSectionValidator } from "../schema.shared";
import type { Doc } from "../_generated/dataModel";
import { requireCmsOwner } from "../lib/auth";
import { cmsPublishValidationFailed } from "../errors";
import {
  collectAllPublishIssues,
  ensureSectionRow,
  publishSettingsSectionCore,
  rowsWithPublishableDraft,
} from "../cmsPublishHelpers";

export const publish = mutation({
  args: { section: cmsSectionValidator },
  handler: async (ctx, args) => {
    const { identity, userId, updatedBy } = await requireCmsOwner(ctx);
    void identity;
    const { id, row } = await ensureSectionRow(ctx, args.section, updatedBy);
    return await publishSettingsSectionCore(ctx, {
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
    const { identity, userId, updatedBy } = await requireCmsOwner(ctx);
    void identity;

    const rows = await ctx.db.query("cmsSections").take(50);
    const targets = rowsWithPublishableDraft(rows);

    if (targets.length === 0) {
      return {
        ok: true as const,
        kind: "nothing_to_publish" as const,
        publishedSections: [] as Doc<"cmsSections">["section"][],
      };
    }

    const issues = collectAllPublishIssues(targets);
    if (issues.length > 0) {
      cmsPublishValidationFailed(
        "site",
        "One or more sections failed publish validation.",
        issues,
      );
    }

    const results: Awaited<ReturnType<typeof publishSettingsSectionCore>>[] =
      [];

    for (const row of targets) {
      const r = await publishSettingsSectionCore(ctx, {
        section: row.section,
        id: row._id,
        row,
        publishedByUserId: userId,
        updatedByTokenId: updatedBy,
      });
      results.push(r);
    }

    return {
      ok: true as const,
      kind: "published" as const,
      publishedSections: targets.map((t) => t.section),
      results,
    };
  },
});
