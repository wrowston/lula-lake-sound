import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { CmsSection } from "./cmsShared";
import { defaultSnapshotForSection } from "./cmsShared";
import { cmsPublishValidationFailed } from "./errors";
import {
  MAX_ABOUT_TEAM_MEMBERS,
  collectAboutTeamBlobIssuesForTree,
  pruneAboutTeamBlobsAfterPublishScoped,
} from "./aboutTeamStorage";
import {
  copyAboutScope,
  loadAboutTree,
  type AboutTree,
} from "./aboutTree";
import {
  copyPricingScope,
  loadPricingPackages,
} from "./pricingTree";
import { copySettingsScope, loadSettingsContent } from "./settingsTree";
import { copyFaqScope, loadFaqTree, type FaqTree } from "./faqTree";
import {
  collectAmenitiesNearbyPublishIssues,
  copyAmenitiesNearbyScope,
} from "./amenitiesTree";
import {
  DEFAULT_IS_ENABLED,
  effectiveIsEnabled,
  ensureSectionMetaRow,
  getSectionMetaRow,
  publishedIsEnabled,
  sectionHasContentDraftDiff,
} from "./cmsMeta";

export type PublishIssue = { path: string; message: string };

/**
 * @deprecated Use {@link getSectionMetaRow}. Kept so callers that imported
 * the old name keep compiling.
 */
export const getSectionRow = getSectionMetaRow;

/**
 * @deprecated Use {@link ensureSectionMetaRow}. The previous implementation
 * also synthesised a `publishedSnapshot`; rows no longer need that column
 * because content lives in the per-section scoped tables.
 */
export const ensureSectionRow = ensureSectionMetaRow;

const trimOrEmpty = (s: string | undefined | null): string =>
  s === undefined || s === null ? "" : s.trim();

async function collectSettingsIssues(
  ctx: QueryCtx | MutationCtx,
): Promise<PublishIssue[]> {
  const issues: PublishIssue[] = [];
  const draft = await loadSettingsContent(ctx, "draft");
  const source = draft ?? (await loadSettingsContent(ctx, "published"));
  const title = trimOrEmpty(source?.title);
  if (title.length === 0) {
    issues.push({
      path: "metadata.title",
      message: "Site title is required to publish.",
    });
  }
  const description = trimOrEmpty(source?.description);
  if (description.length === 0) {
    issues.push({
      path: "metadata.description",
      message: "Site description is required to publish.",
    });
  }
  return issues;
}

/**
 * Pure package-array validator. Exported so unit tests can exercise it
 * directly without a Convex DB harness. Every row is expected to expose
 * `stableId` (the historical `id`), `name`, `priceCents`, `currency`,
 * `billingCadence`, `sortOrder`, and `unitLabel` for custom cadences.
 */
export function validatePricingPackageArray(
  packages: ReadonlyArray<{
    stableId: string;
    name: string;
    priceCents: number;
    currency: string;
    billingCadence: string;
    unitLabel?: string;
    sortOrder: number;
  }>,
): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const seenIds = new Set<string>();
  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    const base = `packages[${i}]`;
    if (typeof pkg.stableId !== "string" || pkg.stableId.trim().length === 0) {
      issues.push({
        path: `${base}.id`,
        message: "Each pricing package requires a stable id.",
      });
    } else if (seenIds.has(pkg.stableId)) {
      issues.push({
        path: `${base}.id`,
        message: `Duplicate package id: ${pkg.stableId}`,
      });
    } else {
      seenIds.add(pkg.stableId);
    }

    if (typeof pkg.name !== "string" || pkg.name.trim().length === 0) {
      issues.push({
        path: `${base}.name`,
        message: "Display name is required.",
      });
    }

    if (
      typeof pkg.priceCents !== "number" ||
      !Number.isFinite(pkg.priceCents) ||
      pkg.priceCents < 0 ||
      !Number.isInteger(pkg.priceCents)
    ) {
      issues.push({
        path: `${base}.priceCents`,
        message: "Price must be a non-negative whole-cent value.",
      });
    }

    if (typeof pkg.currency !== "string" || pkg.currency.trim().length === 0) {
      issues.push({
        path: `${base}.currency`,
        message: "Currency code is required (e.g. USD).",
      });
    }

    if (typeof pkg.sortOrder !== "number" || !Number.isFinite(pkg.sortOrder)) {
      issues.push({
        path: `${base}.sortOrder`,
        message: "Sort order must be a finite number.",
      });
    }

    if (
      pkg.billingCadence === "custom" &&
      (typeof pkg.unitLabel !== "string" || pkg.unitLabel.trim().length === 0)
    ) {
      issues.push({
        path: `${base}.unitLabel`,
        message:
          'Custom cadence requires a unit label (e.g. "per weekend").',
      });
    }
  }
  return issues;
}

async function collectPricingIssues(
  ctx: QueryCtx | MutationCtx,
): Promise<PublishIssue[]> {
  const draft = await loadPricingPackages(ctx, "draft");
  if (draft.length > 0) {
    return validatePricingPackageArray(draft);
  }
  if (await sectionHasContentDraftDiff(ctx, "pricing")) {
    return validatePricingPackageArray(draft);
  }
  const published = await loadPricingPackages(ctx, "published");
  return validatePricingPackageArray(published);
}

/** Very small HTML-to-plaintext helper — good enough for emptiness checks. */
function htmlToPlaintext(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

async function collectAboutIssuesFromTree(
  ctx: QueryCtx | MutationCtx,
  tree: AboutTree,
): Promise<PublishIssue[]> {
  const issues: PublishIssue[] = [];

  const content = tree.content;
  const heroTitle = trimOrEmpty(content?.heroTitle);
  if (heroTitle.length === 0) {
    issues.push({
      path: "heroTitle",
      message: "Hero title is required to publish.",
    });
  }

  const hasRichBody =
    typeof content?.bodyHtml === "string" &&
    htmlToPlaintext(content.bodyHtml).length > 0;

  if (!hasRichBody) {
    const body = content?.bodyBlocks ?? [];
    if (body.length === 0) {
      issues.push({
        path: "bodyHtml",
        message: "Body content is required to publish.",
      });
    } else {
      for (let i = 0; i < body.length; i++) {
        const block = body[i];
        const base = `body[${i}]`;
        if (block.type !== "paragraph" && block.type !== "heading") {
          issues.push({
            path: `${base}.type`,
            message: `Block ${i + 1} must be a paragraph or heading.`,
          });
        }
        if (typeof block.text !== "string" || block.text.trim().length === 0) {
          issues.push({
            path: `${base}.text`,
            message: `Block ${i + 1} cannot be empty.`,
          });
        }
      }
    }
  }

  for (let i = 0; i < tree.highlights.length; i++) {
    if (tree.highlights[i].text.trim().length === 0) {
      issues.push({
        path: `highlights[${i}]`,
        message: `Highlight ${i + 1} cannot be empty.`,
      });
    }
  }

  const team = tree.teamMembers;
  if (team.length > 0) {
    if (team.length > MAX_ABOUT_TEAM_MEMBERS) {
      issues.push({
        path: "teamMembers",
        message: `At most ${MAX_ABOUT_TEAM_MEMBERS} team members are allowed.`,
      });
    }
    for (let i = 0; i < team.length; i++) {
      const base = `teamMembers[${i}]`;
      const who = `Team member ${i + 1}`;
      if (team[i].name.trim().length === 0) {
        issues.push({
          path: `${base}.name`,
          message: `${who} needs a name.`,
        });
      }
      if (team[i].title.trim().length === 0) {
        issues.push({
          path: `${base}.title`,
          message: `${who} needs a title.`,
        });
      }
      if (team[i].storageId === undefined) {
        issues.push({
          path: `${base}.storageId`,
          message: `${who} needs a headshot image to publish.`,
        });
      }
    }
  }

  return issues;
}

/**
 * Preflight validation for a section's draft scope. Reads directly from the
 * scoped tables so UI preflight and publish share one code path.
 */
export async function collectPublishIssues(
  ctx: QueryCtx | MutationCtx,
  section: CmsSection,
): Promise<PublishIssue[]> {
  if (section === "settings") {
    return collectSettingsIssues(ctx);
  }
  if (section === "pricing") {
    return collectPricingIssues(ctx);
  }
  if (section === "about") {
    const draftTree = await loadAboutTree(ctx, "draft");
    const draftHasContent =
      draftTree.content !== null ||
      draftTree.highlights.length > 0 ||
      draftTree.teamMembers.length > 0;
    const tree = draftHasContent
      ? draftTree
      : await loadAboutTree(ctx, "published");
    return collectAboutIssuesFromTree(ctx, tree);
  }
  if (section === "faq") {
    return collectFaqIssues(ctx);
  }
  if (section === "amenitiesNearby") {
    return collectAmenitiesNearbyPublishIssues(ctx);
  }
  return [];
}

async function collectFaqIssues(
  ctx: QueryCtx | MutationCtx,
): Promise<PublishIssue[]> {
  const draft = await loadFaqTree(ctx, "draft");
  const tree: FaqTree =
    draft.categories.length > 0
      ? draft
      : await loadFaqTree(ctx, "published");
  const issues: PublishIssue[] = [];

  if (tree.categories.length === 0) {
    issues.push({
      path: "categories",
      message: "At least one FAQ category is required to publish.",
    });
    return issues;
  }

  const seenCategoryIds = new Set<string>();
  for (let i = 0; i < tree.categories.length; i++) {
    const c = tree.categories[i];
    const base = `categories[${i}]`;
    if (c.stableId.trim().length === 0) {
      issues.push({
        path: `${base}.stableId`,
        message: "Each category requires a stable id.",
      });
    } else if (seenCategoryIds.has(c.stableId)) {
      issues.push({
        path: `${base}.stableId`,
        message: `Duplicate category id: ${c.stableId}`,
      });
    } else {
      seenCategoryIds.add(c.stableId);
    }
    if (c.title.trim().length === 0) {
      issues.push({
        path: `${base}.title`,
        message: "Category title cannot be empty.",
      });
    }
  }

  const qsInKnownCategories = tree.questions.filter((q) =>
    seenCategoryIds.has(q.categoryStableId),
  );
  if (qsInKnownCategories.length === 0) {
    issues.push({
      path: "questions",
      message: "Each category needs at least one question.",
    });
  }

  for (const q of tree.questions) {
    if (!seenCategoryIds.has(q.categoryStableId)) {
      issues.push({
        path: `question.${q.stableId}.categoryStableId`,
        message: `Unknown category id: ${q.categoryStableId}`,
      });
    }
  }

  const seenQuestionIds = new Set<string>();
  for (const q of tree.questions) {
    if (!seenCategoryIds.has(q.categoryStableId)) {
      continue;
    }
    if (q.stableId.trim().length === 0) {
      issues.push({
        path: `question.${q.categoryStableId}.stableId`,
        message: "Each question requires a stable id.",
      });
    } else if (seenQuestionIds.has(q.stableId)) {
      issues.push({
        path: `question.${q.stableId}`,
        message: `Duplicate question id: ${q.stableId}`,
      });
    } else {
      seenQuestionIds.add(q.stableId);
    }
    if (q.question.trim().length === 0) {
      issues.push({
        path: `question.${q.stableId}.question`,
        message: "Question text cannot be empty.",
      });
    }
    if (q.answer.trim().length === 0) {
      issues.push({
        path: `question.${q.stableId}.answer`,
        message: "Answer text cannot be empty.",
      });
    }
  }

  for (const cat of tree.categories) {
    const count = tree.questions.filter(
      (q) => q.categoryStableId === cat.stableId,
    ).length;
    if (count === 0) {
      issues.push({
        path: `categories.${cat.stableId}.questions`,
        message: `Category "${cat.title}" needs at least one question.`,
      });
    }
  }

  return issues;
}

export type PublishSectionResult =
  | {
      ok: true;
      kind: "published";
      section: CmsSection;
      publishedAt: number;
      publishedBy: string;
    }
  | {
      ok: true;
      kind: "already_current";
      section: CmsSection;
      publishedAt: number | null;
      publishedBy: string | undefined;
    };

/**
 * Atomically promote the section's draft-scope content (and any pending
 * `isEnabledDraft`) onto the published scope. Idempotent: when there is
 * nothing pending returns `already_current` without writes.
 */
export async function publishSectionCore(
  ctx: MutationCtx,
  args: {
    section: CmsSection;
    id: Id<"cmsSections">;
    row: Doc<"cmsSections">;
    /** Clerk `subject` — stored as `publishedBy` for audit. */
    publishedByUserId: string;
    updatedByTokenId: string | undefined;
  },
): Promise<PublishSectionResult> {
  const { section, id, row, publishedByUserId, updatedByTokenId } = args;

  if (!row.hasDraftChanges) {
    return {
      ok: true,
      kind: "already_current",
      section,
      publishedAt: row.publishedAt,
      publishedBy: row.publishedBy,
    };
  }

  // Only run content validation and scope-copy when the draft scope actually
  // differs from the published scope. Flag-only toggles (the draft scope is
  // empty) must NOT wipe the published content — they only patch
  // `isEnabled` on the metadata row below.
  const hasContentDraft = await sectionHasContentDraftDiff(ctx, section);

  if (hasContentDraft) {
    const issues = await collectPublishIssues(ctx, section);
    if (issues.length > 0) {
      cmsPublishValidationFailed(section, "Publish validation failed.", issues);
    }
  }

  let previousAboutTree: AboutTree | null = null;
  if (hasContentDraft && section === "about") {
    const draftTree = await loadAboutTree(ctx, "draft");
    const blobIssues = await collectAboutTeamBlobIssuesForTree(ctx, draftTree);
    if (blobIssues.length > 0) {
      cmsPublishValidationFailed(section, "Publish validation failed.", blobIssues);
    }
    previousAboutTree = await loadAboutTree(ctx, "published");
  }

  if (hasContentDraft) {
    if (section === "about") {
      await copyAboutScope(ctx, "draft", "published");
    } else if (section === "pricing") {
      await copyPricingScope(ctx, "draft", "published");
    } else if (section === "settings") {
      await copySettingsScope(ctx, "draft", "published");
    } else if (section === "faq") {
      await copyFaqScope(ctx, "draft", "published");
    } else if (section === "amenitiesNearby") {
      await copyAmenitiesNearbyScope(ctx, "draft", "published");
    }
  }

  const now = Date.now();
  const nextIsEnabled =
    typeof row.isEnabledDraft === "boolean"
      ? row.isEnabledDraft
      : publishedIsEnabled(row, section);

  await ctx.db.patch(id, {
    isEnabled: nextIsEnabled,
    isEnabledDraft: undefined,
    hasDraftChanges: false,
    publishedAt: now,
    publishedBy: publishedByUserId,
    updatedAt: now,
    updatedBy: updatedByTokenId,
  });

  if (hasContentDraft && section === "about" && previousAboutTree !== null) {
    const newPublished = await loadAboutTree(ctx, "published");
    await pruneAboutTeamBlobsAfterPublishScoped(
      ctx,
      previousAboutTree,
      newPublished,
    );
  }

  return {
    ok: true,
    kind: "published",
    section,
    publishedAt: now,
    publishedBy: publishedByUserId,
  };
}

/**
 * @deprecated Renamed to {@link publishSectionCore}. Kept for existing callers.
 */
export const publishSettingsSectionCore = publishSectionCore;

/**
 * Rows that have a pending draft (content or flag). Callers use this to
 * decide which sections to publish during the site-wide publish.
 */
export function rowsWithPublishableDraft(
  rows: Doc<"cmsSections">[],
): Array<Doc<"cmsSections"> & { section: CmsSection }> {
  return rows.filter(
    (row): row is Doc<"cmsSections"> & { section: CmsSection } =>
      row.hasDraftChanges === true && isPublishableCmsSection(row.section),
  );
}

function isPublishableCmsSection(
  section: Doc<"cmsSections">["section"],
): section is CmsSection {
  return section !== "photos";
}

/**
 * Aggregate validation issues across sections (preflight for `publishSite`).
 * Reads directly from the draft-scope rows for each pending section so the
 * checks match what `publishSectionCore` will run.
 */
export async function collectAllPublishIssues(
  ctx: QueryCtx | MutationCtx,
  targets: Array<Doc<"cmsSections"> & { section: CmsSection }>,
): Promise<PublishIssue[]> {
  const issues: PublishIssue[] = [];
  for (const row of targets) {
    for (const issue of await collectPublishIssues(ctx, row.section)) {
      issues.push({
        path: `${row.section}.${issue.path}`,
        message: issue.message,
      });
    }
  }
  return issues;
}

// Preserve legacy re-exports so callers that imported from this module
// keep compiling.
export {
  defaultSnapshotForSection,
  effectiveIsEnabled,
  publishedIsEnabled,
  DEFAULT_IS_ENABLED,
};
