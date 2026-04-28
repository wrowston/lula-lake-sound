/**
 * Backward-compat shim for the pre-refactor `marketingFeatureFlags:*` module.
 *
 * Before commit 9427f2e all marketing visibility queries/mutations lived in
 * `convex/marketingFeatureFlags.ts` (e.g. `marketingFeatureFlags:listDraft`,
 * `marketingFeatureFlags:getPreviewMarketingFeatureFlags`). The refactor moved
 * them into `convex/cms.ts` under new names. Browser tabs that were open
 * against the old deploy still hold compiled JS that targets the old function
 * paths; once Convex is redeployed, every call from those stale tabs throws
 * `Could not find public function for 'marketingFeatureFlags:…'` and React
 * crashes the admin / preview page. Reloading the tab fixes it, but nothing
 * on the page ever updates until the user does.
 *
 * This shim re-creates the four legacy endpoints so long-lived admin tabs and
 * preview tabs keep working until they're manually reloaded. Every function
 * here is a thin adapter that delegates to the per-section helpers in
 * `cms.ts` / `cmsMeta.ts` and reshapes the response to the historical
 * singleton-snapshot shape.
 *
 * Safe to delete once enough time has passed that no one could still have a
 * pre-refactor tab open.
 */
import { mutation, query } from "./_generated/server";
import { marketingFeatureFlagsSnapshotValidator } from "./schema.shared";
import {
  anyMarketingFlagDraftPending,
  effectiveIsEnabled,
  ensureSectionMetaRow,
  getSectionMetaRow,
  publishedIsEnabled,
  recomputeSectionHasDraftChanges,
} from "./cmsMeta";
import { publishSectionCore } from "./cmsPublishHelpers";
import { requireCmsOwner } from "./lib/auth";
import type { CmsSection } from "./cmsShared";

const SECTIONS: Array<"about" | "recordings" | "pricing" | "photos"> = [
  "about",
  "recordings",
  "pricing",
  "photos",
];
const MARKETING_FLAG_SECTIONS: Array<"about" | "recordings" | "pricing"> = [
  "about",
  "recordings",
  "pricing",
];

function latestTimestamp(values: Array<number | null | undefined>): number | null {
  let out: number | null = null;
  for (const v of values) {
    if (v === null || v === undefined) continue;
    if (out === null || v > out) out = v;
  }
  return out;
}

/**
 * Legacy `marketingFeatureFlags:getPublishedMarketingFeatureFlags`. Same
 * shape as the new `public:getPublishedMarketingFeatureFlags`.
 */
export const getPublishedMarketingFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    const [aboutRow, recordingsRow, pricingRow, photosRow] = await Promise.all(
      SECTIONS.map((section) => getSectionMetaRow(ctx, section)),
    );
    return {
      aboutPage: publishedIsEnabled(aboutRow, "about"),
      recordingsPage: publishedIsEnabled(recordingsRow, "recordings"),
      pricingSection: publishedIsEnabled(pricingRow, "pricing"),
      galleryPage: publishedIsEnabled(photosRow, "photos"),
    };
  },
});

/**
 * Legacy `marketingFeatureFlags:listDraft` — owner-only view of the draft
 * flag singleton. Maps the per-section rows back onto
 * `{ flags, hasDraftChanges, publishedAt, publishedBy, updatedAt, updatedBy }`.
 */
export const listDraft = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    const [aboutRow, recordingsRow, pricingRow, photosRow] = await Promise.all(
      SECTIONS.map((section) => getSectionMetaRow(ctx, section)),
    );
    const flags = {
      aboutPage: effectiveIsEnabled(aboutRow, "about"),
      recordingsPage: effectiveIsEnabled(recordingsRow, "recordings"),
      pricingSection: effectiveIsEnabled(pricingRow, "pricing"),
      galleryPage: publishedIsEnabled(photosRow, "photos"),
    };
    const hasDraftChanges = anyMarketingFlagDraftPending(
      aboutRow,
      recordingsRow,
      pricingRow,
      photosRow,
    );

    const publishedAt = latestTimestamp([
      aboutRow?.publishedAt ?? null,
      recordingsRow?.publishedAt ?? null,
      pricingRow?.publishedAt ?? null,
    ]);
    const updatedAt = latestTimestamp([
      aboutRow?.updatedAt,
      recordingsRow?.updatedAt,
      pricingRow?.updatedAt,
    ]);

    return {
      flags,
      hasDraftChanges,
      publishedAt,
      publishedBy:
        aboutRow?.publishedBy ??
        recordingsRow?.publishedBy ??
        pricingRow?.publishedBy ??
        null,
      updatedAt,
      updatedBy:
        aboutRow?.updatedBy ??
        recordingsRow?.updatedBy ??
        pricingRow?.updatedBy ??
        null,
    };
  },
});

/**
 * Legacy `marketingFeatureFlags:getPreviewMarketingFeatureFlags`. Same shape
 * as the new `cms:getPreviewMarketingFeatureFlags`; returns `null` for
 * unauthenticated / non-owner callers.
 */
export const getPreviewMarketingFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }

    const [aboutRow, recordingsRow, pricingRow, photosRow] = await Promise.all(
      SECTIONS.map((section) => getSectionMetaRow(ctx, section)),
    );
    const hasDraftChanges = anyMarketingFlagDraftPending(
      aboutRow,
      recordingsRow,
      pricingRow,
      photosRow,
    );

    return {
      aboutPage: effectiveIsEnabled(aboutRow, "about"),
      recordingsPage: effectiveIsEnabled(recordingsRow, "recordings"),
      pricingSection: effectiveIsEnabled(pricingRow, "pricing"),
      galleryPage: effectiveIsEnabled(photosRow, "photos"),
      hasDraftChanges,
    };
  },
});

/**
 * Legacy `marketingFeatureFlags:saveMarketingFeatureFlagsDraft`. Accepts the
 * full snapshot `{ aboutPage, recordingsPage, pricingSection }` and writes
 * each value onto the matching section's `isEnabledDraft`, mirroring what
 * the new `cms:saveSectionIsEnabledDraft` mutation does per-section.
 */
export const saveMarketingFeatureFlagsDraft = mutation({
  args: { snapshot: marketingFeatureFlagsSnapshotValidator },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const entries: Array<[CmsSection, boolean]> = [
      ["about", args.snapshot.aboutPage],
      ["recordings", args.snapshot.recordingsPage],
      ["pricing", args.snapshot.pricingSection],
    ];
    let hasDraftChanges = false;
    for (const [section, value] of entries) {
      const { id } = await ensureSectionMetaRow(ctx, section, updatedBy);
      await ctx.db.patch(id, {
        isEnabledDraft: value,
        updatedAt: Date.now(),
        updatedBy,
      });
      await recomputeSectionHasDraftChanges(ctx, section, updatedBy);
      const row = await getSectionMetaRow(ctx, section);
      if (row?.hasDraftChanges) hasDraftChanges = true;
    }
    return { ok: true as const, hasDraftChanges };
  },
});

/**
 * Legacy `marketingFeatureFlags:publishMarketingFeatureFlags`. Delegates to
 * the per-section publish helper for any section that still has a pending
 * flag draft.
 */
export const publishMarketingFeatureFlags = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId, updatedBy } = await requireCmsOwner(ctx);
    const published: Array<
      Awaited<ReturnType<typeof publishSectionCore>>
    > = [];
    for (const section of MARKETING_FLAG_SECTIONS) {
      const row = await getSectionMetaRow(ctx, section);
      if (!row) continue;
      const flagPending =
        row.isEnabledDraft !== undefined &&
        row.isEnabledDraft !== publishedIsEnabled(row, section);
      if (!flagPending) continue;
      const result = await publishSectionCore(ctx, {
        section,
        id: row._id,
        row,
        publishedByUserId: userId,
        updatedByTokenId: updatedBy,
      });
      published.push(result);
    }
    if (published.length === 0) {
      return { ok: true as const, kind: "nothing_to_publish" as const };
    }
    const latest = Math.max(
      ...published
        .filter((r) => r.kind === "published")
        .map((r) => (r.kind === "published" ? r.publishedAt : 0)),
    );
    return {
      ok: true as const,
      kind: "published" as const,
      publishedAt: latest,
    };
  },
});

/**
 * Legacy `marketingFeatureFlags:discardMarketingFeatureFlagsDraft`. Clears
 * `isEnabledDraft` on legacy marketing sections without touching their
 * content drafts. Gallery-page visibility drafts belong to `/admin/photos`.
 */
export const discardMarketingFeatureFlagsDraft = mutation({
  args: {},
  handler: async (ctx) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    let discarded = false;
    for (const section of MARKETING_FLAG_SECTIONS) {
      const row = await getSectionMetaRow(ctx, section);
      if (!row || row.isEnabledDraft === undefined) continue;
      await ctx.db.patch(row._id, {
        isEnabledDraft: undefined,
        updatedAt: Date.now(),
        updatedBy,
      });
      await recomputeSectionHasDraftChanges(ctx, section, updatedBy);
      discarded = true;
    }
    return { ok: true as const, discarded };
  },
});
