import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  aboutContentValidator,
  cmsSectionValidator,
  pricingContentValidator,
  settingsContentValidator,
} from "./schema.shared";
import {
  defaultSnapshotForSection,
  type AboutSnapshot,
  type PricingSnapshot,
  type SettingsSnapshot,
} from "./cmsShared";
import { requireAuthenticatedIdentity, requireCmsOwner } from "./lib/auth";
import {
  collectAboutTeamBlobIssues,
  pruneAboutTeamBlobsAfterSaveDraftScoped,
  unionAboutTeamStorage,
} from "./aboutTeamStorage";
import {
  collectPublishIssues,
  publishSectionCore,
} from "./cmsPublishHelpers";
import {
  DEFAULT_IS_ENABLED,
  effectiveIsEnabled,
  ensureSectionMetaRow,
  getSectionMetaRow,
  publishedIsEnabled,
  recomputeSectionHasDraftChanges,
  sectionHasContentDraftDiff,
  anyMarketingFlagDraftPending,
  sectionHasPendingFlagDraft,
} from "./cmsMeta";
import {
  copyAboutScope,
  loadAboutTree,
  replaceAboutDraftTree,
} from "./aboutTree";
import {
  copyPricingScope,
  loadPricingPackages,
  pricingPackageFromRow,
  replacePricingDraftFromPackages,
} from "./pricingTree";
import {
  copySettingsScope,
  loadSettingsContent,
  replaceSettingsDraft,
} from "./settingsTree";
import { cmsValidationError } from "./errors";

/**
 * Snapshot-shaped admin view of a section. Reads per-section scoped tables
 * and folds them back into the historical `publishedSnapshot` / `draftSnapshot`
 * shape so admin editors don't have to change while the storage model does.
 *
 * Requires an authenticated identity (admin-only surface).
 */
export const getSection = query({
  args: { section: cmsSectionValidator },
  handler: async (ctx, args) => {
    await requireAuthenticatedIdentity(ctx);
    const row = await getSectionMetaRow(ctx, args.section);

    const publishedSnapshot = await readSnapshotForAdmin(
      ctx,
      args.section,
      "published",
    );
    const hasContentDraft = await sectionHasContentDraftDiff(
      ctx,
      args.section,
    );
    const draftSnapshot = hasContentDraft
      ? await readSnapshotForAdmin(ctx, args.section, "draft")
      : null;

    return {
      section: args.section,
      publishedSnapshot,
      publishedAt: row?.publishedAt ?? null,
      publishedBy: row?.publishedBy ?? null,
      draftSnapshot,
      hasDraftChanges: row?.hasDraftChanges ?? false,
      updatedAt: row?.updatedAt ?? null,
      updatedBy: row?.updatedBy ?? null,
      isEnabled: row
        ? publishedIsEnabled(row, args.section)
        : DEFAULT_IS_ENABLED[args.section],
      isEnabledDraft: effectiveIsEnabled(row ?? null, args.section),
    };
  },
});

/**
 * Compatibility shim: accept a whole-snapshot `content` payload from the
 * admin editor and decompose it into per-section scoped-table rows at
 * `scope="draft"`. The public storage model is normalised; the editor's
 * API stays the same for now to minimise churn.
 */
export const saveDraft = mutation({
  args: {
    section: cmsSectionValidator,
    content: v.union(
      settingsContentValidator,
      pricingContentValidator,
      aboutContentValidator,
    ),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);

    const isSettingsPayload =
      "metadata" in args.content &&
      !("heroTitle" in args.content) &&
      !("packages" in args.content);
    const isPricingPayload =
      "flags" in args.content &&
      typeof (args.content as { flags?: unknown }).flags === "object" &&
      (args.content as { flags?: { priceTabEnabled?: unknown } }).flags
        ?.priceTabEnabled !== undefined;
    const isAboutPayload =
      "heroTitle" in args.content && "body" in args.content;

    if (args.section === "settings") {
      if (!isSettingsPayload) {
        cmsValidationError(
          "Settings content must include metadata.",
          "content",
        );
      }
    } else if (args.section === "pricing") {
      if ("metadata" in args.content) {
        cmsValidationError(
          "Pricing content cannot include metadata.",
          "content",
        );
      }
      if (!isPricingPayload) {
        cmsValidationError(
          "Pricing content must include flags.priceTabEnabled.",
          "content",
        );
      }
    } else if (args.section === "about") {
      if (!isAboutPayload) {
        cmsValidationError(
          "About content must include heroTitle and body blocks.",
          "content",
        );
      }
    } else {
      cmsValidationError(
        "Recordings has no content; only the visibility flag is editable.",
        "section",
      );
    }

    await ensureSectionMetaRow(ctx, args.section, updatedBy);

    if (args.section === "settings") {
      await replaceSettingsDraftFromSnapshot(ctx, args.content as SettingsSnapshot);
    } else if (args.section === "pricing") {
      await replacePricingDraftFromSnapshot(ctx, args.content as PricingSnapshot);
    } else if (args.section === "about") {
      const beforeUnion = await unionAboutTeamStorage(ctx);
      await replaceAboutDraftFromSnapshot(ctx, args.content as AboutSnapshot);
      await pruneAboutTeamBlobsAfterSaveDraftScoped(ctx, beforeUnion);
    }

    await recomputeSectionHasDraftChanges(ctx, args.section, updatedBy);

    const row = await getSectionMetaRow(ctx, args.section);
    return {
      ok: true as const,
      section: args.section,
      hasDraftChanges: row?.hasDraftChanges ?? false,
    };
  },
});

/**
 * Owner-only view of the three marketing-visibility flags (about / recordings
 * / homepage pricing block). Reads per-section `cmsSections` rows and returns
 * the historical shape so the admin hook stays simple.
 */
export const listMarketingFlagsDraft = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    const [aboutRow, recordingsRow, pricingRow] = await Promise.all([
      getSectionMetaRow(ctx, "about"),
      getSectionMetaRow(ctx, "recordings"),
      getSectionMetaRow(ctx, "pricing"),
    ]);

    const flags = {
      aboutPage: effectiveIsEnabled(aboutRow, "about"),
      recordingsPage: effectiveIsEnabled(recordingsRow, "recordings"),
      pricingSection: effectiveIsEnabled(pricingRow, "pricing"),
    };

    const hasDraftChanges = anyMarketingFlagDraftPending(
      aboutRow,
      recordingsRow,
      pricingRow,
    );

    // Expose per-section meta so the publish toolbar can disambiguate which
    // sections need the `publishSection` mutation to promote a flag draft.
    const publishedAt = latestNumber([
      aboutRow?.publishedAt ?? null,
      recordingsRow?.publishedAt ?? null,
      pricingRow?.publishedAt ?? null,
    ]);
    const updatedAt = latestNumber([
      aboutRow?.updatedAt ?? null,
      recordingsRow?.updatedAt ?? null,
      pricingRow?.updatedAt ?? null,
    ]);

    return {
      flags,
      hasDraftChanges,
      publishedAt,
      publishedBy:
        mostRecentPublishedBy([aboutRow, recordingsRow, pricingRow]) ?? null,
      updatedAt,
      updatedBy:
        mostRecentUpdatedBy([aboutRow, recordingsRow, pricingRow]) ?? null,
      perSection: {
        about: {
          isEnabled: publishedIsEnabled(aboutRow, "about"),
          isEnabledDraft: aboutRow?.isEnabledDraft ?? null,
          hasPendingFlagChange:
            aboutRow?.isEnabledDraft !== undefined &&
            aboutRow.isEnabledDraft !== publishedIsEnabled(aboutRow, "about"),
        },
        recordings: {
          isEnabled: publishedIsEnabled(recordingsRow, "recordings"),
          isEnabledDraft: recordingsRow?.isEnabledDraft ?? null,
          hasPendingFlagChange:
            recordingsRow?.isEnabledDraft !== undefined &&
            recordingsRow.isEnabledDraft !==
              publishedIsEnabled(recordingsRow, "recordings"),
        },
        pricing: {
          isEnabled: publishedIsEnabled(pricingRow, "pricing"),
          isEnabledDraft: pricingRow?.isEnabledDraft ?? null,
          hasPendingFlagChange:
            pricingRow?.isEnabledDraft !== undefined &&
            pricingRow.isEnabledDraft !==
              publishedIsEnabled(pricingRow, "pricing"),
        },
      },
    };
  },
});

/**
 * Preview view of the three marketing-visibility flags for owner-gated preview
 * routes. Returns `null` for unauthenticated or non-owner callers.
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

    const [aboutRow, recordingsRow, pricingRow] = await Promise.all([
      getSectionMetaRow(ctx, "about"),
      getSectionMetaRow(ctx, "recordings"),
      getSectionMetaRow(ctx, "pricing"),
    ]);

    const hasDraftChanges = anyMarketingFlagDraftPending(
      aboutRow,
      recordingsRow,
      pricingRow,
    );

    return {
      aboutPage: effectiveIsEnabled(aboutRow, "about"),
      recordingsPage: effectiveIsEnabled(recordingsRow, "recordings"),
      pricingSection: effectiveIsEnabled(pricingRow, "pricing"),
      hasDraftChanges,
    };
  },
});

function latestNumber(values: Array<number | null>): number | null {
  let out: number | null = null;
  for (const v of values) {
    if (v === null) continue;
    if (out === null || v > out) out = v;
  }
  return out;
}

function mostRecentPublishedBy(
  rows: Array<import("./_generated/dataModel").Doc<"cmsSections"> | null>,
): string | undefined {
  let latest: {
    at: number;
    by: string | undefined;
  } | null = null;
  for (const row of rows) {
    if (!row || row.publishedAt === null) continue;
    if (latest === null || row.publishedAt > latest.at) {
      latest = { at: row.publishedAt, by: row.publishedBy };
    }
  }
  return latest?.by;
}

function mostRecentUpdatedBy(
  rows: Array<import("./_generated/dataModel").Doc<"cmsSections"> | null>,
): string | undefined {
  let latest: {
    at: number;
    by: string | undefined;
  } | null = null;
  for (const row of rows) {
    if (!row) continue;
    if (latest === null || row.updatedAt > latest.at) {
      latest = { at: row.updatedAt, by: row.updatedBy };
    }
  }
  return latest?.by;
}

/**
 * Publish marketing-flag drafts only: iterates About / Recordings / Pricing
 * and calls `publishSectionCore` when `isEnabledDraft` differs from published.
 * Sections with content-only drafts are skipped so `runPublishFF` does not
 * publish unrelated copy.
 */
export const publishMarketingFlags = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId, updatedBy } = await requireCmsOwner(ctx);
    const published: Array<
      Awaited<ReturnType<typeof publishSectionCore>>
    > = [];
    for (const section of ["about", "recordings", "pricing"] as const) {
      const row = await getSectionMetaRow(ctx, section);
      if (!row || !sectionHasPendingFlagDraft(row, section)) continue;
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
      results: published,
    };
  },
});

/**
 * Discard marketing-flag drafts: clears `isEnabledDraft` on About /
 * Recordings / Pricing (without rewinding their content drafts).
 */
export const discardMarketingFlagsDraft = mutation({
  args: {},
  handler: async (ctx) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    let discarded = false;
    for (const section of ["about", "recordings", "pricing"] as const) {
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

/**
 * Draft override for the section's visibility flag. Flipping this on its
 * own marks the section with `hasDraftChanges` so the publish toolbar
 * surfaces a pending change.
 */
export const saveSectionIsEnabledDraft = mutation({
  args: {
    section: cmsSectionValidator,
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const { id } = await ensureSectionMetaRow(ctx, args.section, updatedBy);
    await ctx.db.patch(id, {
      isEnabledDraft: args.isEnabled,
      updatedAt: Date.now(),
      updatedBy,
    });
    await recomputeSectionHasDraftChanges(ctx, args.section, updatedBy);
    const row = await getSectionMetaRow(ctx, args.section);
    return {
      ok: true as const,
      section: args.section,
      hasDraftChanges: row?.hasDraftChanges ?? false,
    };
  },
});

/**
 * Promote the section's draft scope to published (and apply any
 * `isEnabledDraft`) inside a single transaction.
 */
export const publishSection = mutation({
  args: {
    section: cmsSectionValidator,
  },
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

/**
 * Read-only preflight: report validation issues against the current draft
 * scope (or the published scope when no draft exists).
 */
export const validatePublishSection = query({
  args: { section: cmsSectionValidator },
  handler: async (ctx, args) => {
    await requireCmsOwner(ctx);
    const issues = await collectPublishIssues(ctx, args.section);
    const blobIssues =
      args.section === "about"
        ? await collectAboutTeamBlobIssues(ctx)
        : [];
    const allIssues = [...issues, ...blobIssues];
    return {
      ok: allIssues.length === 0,
      section: args.section,
      issues: allIssues,
    };
  },
});

/**
 * Drop the section's pending edits: rewind draft-scope content from
 * published, clear `isEnabledDraft`, and clear the `hasDraftChanges` flag.
 * About team headshots: orphan blobs only referenced by the discarded draft
 * are removed (see INF-76).
 */
export const discardDraft = mutation({
  args: {
    section: cmsSectionValidator,
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getSectionMetaRow(ctx, args.section);
    if (!row) {
      return { ok: true as const, section: args.section, discarded: false };
    }

    if (!row.hasDraftChanges && row.isEnabledDraft === undefined) {
      return { ok: true as const, section: args.section, discarded: false };
    }

    // Only rewind content scope when there's an actual content draft to
    // revert. When the pending change is flag-only, copying published→draft
    // would create spurious draft rows that match published anyway.
    const hasContentDraft = await sectionHasContentDraftDiff(
      ctx,
      args.section,
    );

    const beforeUnion =
      args.section === "about" && hasContentDraft
        ? await unionAboutTeamStorage(ctx)
        : new Set<never>();

    if (hasContentDraft) {
      if (args.section === "about") {
        await copyAboutScope(ctx, "published", "draft");
      } else if (args.section === "pricing") {
        await copyPricingScope(ctx, "published", "draft");
      } else if (args.section === "settings") {
        await copySettingsScope(ctx, "published", "draft");
      }
    }

    const now = Date.now();
    await ctx.db.patch(row._id, {
      isEnabledDraft: undefined,
      hasDraftChanges: false,
      updatedAt: now,
      updatedBy,
    });

    if (args.section === "about" && hasContentDraft && beforeUnion.size > 0) {
      await pruneAboutTeamBlobsAfterSaveDraftScoped(
        ctx,
        beforeUnion as Set<import("./_generated/dataModel").Id<"_storage">>,
      );
    }

    return { ok: true as const, section: args.section, discarded: true };
  },
});

// --- Snapshot → scoped-rows decomposers (compat shim glue) -------------------

async function readSnapshotForAdmin(
  ctx: import("./_generated/server").QueryCtx,
  section: import("./cmsShared").CmsSection,
  scope: "draft" | "published",
): Promise<import("./cmsShared").CmsSnapshot> {
  if (section === "settings") {
    const row = await loadSettingsContent(ctx, scope);
    if (!row) return defaultSnapshotForSection(section);
    return {
      metadata: {
        ...(row.title !== undefined ? { title: row.title } : {}),
        ...(row.description !== undefined
          ? { description: row.description }
          : {}),
      },
    } satisfies SettingsSnapshot;
  }

  if (section === "pricing") {
    const [rows, metaRow] = await Promise.all([
      loadPricingPackages(ctx, scope),
      getSectionMetaRow(ctx, "pricing"),
    ]);
    const priceTabEnabled =
      scope === "draft"
        ? effectiveIsEnabled(metaRow, "pricing")
        : publishedIsEnabled(metaRow, "pricing");
    return {
      flags: { priceTabEnabled },
      packages: rows.map(pricingPackageFromRow),
    } satisfies PricingSnapshot;
  }

  if (section === "about") {
    const tree = await loadAboutTree(ctx, scope);
    if (tree.content === null) {
      return defaultSnapshotForSection(section);
    }
    return {
      ...(tree.content.heroImageStorageId !== undefined
        ? { heroImageStorageId: tree.content.heroImageStorageId }
        : {}),
      heroTitle: tree.content.heroTitle,
      ...(tree.content.heroSubtitle !== undefined
        ? { heroSubtitle: tree.content.heroSubtitle }
        : {}),
      ...(tree.content.bodyHtml !== undefined
        ? { bodyHtml: tree.content.bodyHtml }
        : {}),
      body: tree.content.bodyBlocks ?? [],
      ...(tree.content.pullQuote !== undefined
        ? { pullQuote: tree.content.pullQuote }
        : {}),
      ...(tree.highlights.length > 0
        ? { highlights: tree.highlights.map((h) => h.text) }
        : {}),
      ...(tree.content.seoTitle !== undefined
        ? { seoTitle: tree.content.seoTitle }
        : {}),
      ...(tree.content.seoDescription !== undefined
        ? { seoDescription: tree.content.seoDescription }
        : {}),
      ...(tree.teamMembers.length > 0
        ? {
            teamMembers: tree.teamMembers.map((m) => ({
              id: m.stableId,
              name: m.name,
              title: m.title,
              ...(m.storageId !== undefined ? { storageId: m.storageId } : {}),
            })),
          }
        : {}),
    } satisfies AboutSnapshot;
  }

  // recordings — flag-only, no content. Return an empty about-shaped default
  // that nothing actually reads.
  return defaultSnapshotForSection("about");
}

async function replaceSettingsDraftFromSnapshot(
  ctx: import("./_generated/server").MutationCtx,
  snapshot: SettingsSnapshot,
): Promise<void> {
  const metadata = snapshot.metadata ?? {};
  await replaceSettingsDraft(ctx, {
    ...(metadata.title !== undefined ? { title: metadata.title } : {}),
    ...(metadata.description !== undefined
      ? { description: metadata.description }
      : {}),
  });
}

async function replacePricingDraftFromSnapshot(
  ctx: import("./_generated/server").MutationCtx,
  snapshot: PricingSnapshot,
): Promise<void> {
  await replacePricingDraftFromPackages(ctx, snapshot.packages ?? []);
}

async function replaceAboutDraftFromSnapshot(
  ctx: import("./_generated/server").MutationCtx,
  snapshot: AboutSnapshot,
): Promise<void> {
  await replaceAboutDraftTree(ctx, {
    content: {
      ...(snapshot.heroImageStorageId !== undefined
        ? { heroImageStorageId: snapshot.heroImageStorageId }
        : {}),
      heroTitle: snapshot.heroTitle,
      ...(snapshot.heroSubtitle !== undefined
        ? { heroSubtitle: snapshot.heroSubtitle }
        : {}),
      ...(snapshot.bodyHtml !== undefined
        ? { bodyHtml: snapshot.bodyHtml }
        : {}),
      ...(snapshot.body.length > 0 ? { bodyBlocks: snapshot.body } : {}),
      ...(snapshot.pullQuote !== undefined
        ? { pullQuote: snapshot.pullQuote }
        : {}),
      ...(snapshot.seoTitle !== undefined
        ? { seoTitle: snapshot.seoTitle }
        : {}),
      ...(snapshot.seoDescription !== undefined
        ? { seoDescription: snapshot.seoDescription }
        : {}),
    },
    highlights: (snapshot.highlights ?? []).map((text, index) => ({
      stableId: `hl_${index}`,
      text,
      sort: index,
    })),
    teamMembers: (snapshot.teamMembers ?? []).map((m, index) => ({
      stableId: m.id,
      name: m.name,
      title: m.title,
      ...(m.storageId !== undefined ? { storageId: m.storageId } : {}),
      sort: index,
    })),
  });
}
