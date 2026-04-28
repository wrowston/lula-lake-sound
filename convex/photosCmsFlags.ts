import type { MutationCtx } from "./_generated/server";
import {
  ensureSectionMetaRow,
  recomputeSectionHasDraftChanges,
  sectionHasPendingFlagDraft,
} from "./cmsMeta";

/**
 * Promote `cmsSections.photos.isEnabledDraft` → `isEnabled` (public gallery page + nav).
 * Call after `publishGalleryDraftCore` so one Publish button flips the gallery flag too.
 * Idempotent when there is no pending flag draft.
 */
export async function promoteGalleryPageCmsFlag(
  ctx: MutationCtx,
  args: {
    userId: string;
    updatedBy: string | undefined;
    publishedAt?: number;
  },
): Promise<void> {
  const { id, row } = await ensureSectionMetaRow(ctx, "photos", args.updatedBy);
  const now = args.publishedAt ?? Date.now();
  if (typeof row.isEnabledDraft !== "boolean") {
    await ctx.db.patch(id, {
      hasDraftChanges: false,
      publishedAt: now,
      publishedBy: args.userId,
      updatedAt: now,
      updatedBy: args.updatedBy,
    });
    return;
  }

  if (!sectionHasPendingFlagDraft(row, "photos")) {
    await ctx.db.patch(id, {
      isEnabledDraft: undefined,
      hasDraftChanges: false,
      publishedAt: now,
      publishedBy: args.userId,
      updatedAt: now,
      updatedBy: args.updatedBy,
    });
    await recomputeSectionHasDraftChanges(ctx, "photos", args.updatedBy);
    return;
  }

  const nextIsEnabled = row.isEnabledDraft;
  await ctx.db.patch(id, {
    isEnabled: nextIsEnabled,
    isEnabledDraft: undefined,
    hasDraftChanges: false,
    publishedAt: now,
    publishedBy: args.userId,
    updatedAt: now,
    updatedBy: args.updatedBy,
  });
  await recomputeSectionHasDraftChanges(ctx, "photos", args.updatedBy);
}
