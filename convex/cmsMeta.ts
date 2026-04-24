import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { CmsSection } from "./cmsShared";
import {
  aboutDraftMatchesPublished,
  loadAboutTree,
  type AboutTree,
} from "./aboutTree";
import {
  loadPricingPackages,
  pricingDraftMatchesPublished,
} from "./pricingTree";
import {
  loadSettingsContent,
  settingsDraftMatchesPublished,
} from "./settingsTree";

/**
 * Default `isEnabled` value for a brand-new deployment / row. Matches the
 * seed behaviour: About and Recordings pages stay dark until the owner
 * publishes them; the homepage pricing block ships on.
 */
export const DEFAULT_IS_ENABLED: Record<CmsSection, boolean> = {
  settings: true,
  pricing: true,
  about: false,
  recordings: false,
};

export async function getSectionMetaRow(
  ctx: QueryCtx | MutationCtx,
  section: CmsSection,
): Promise<Doc<"cmsSections"> | null> {
  return await ctx.db
    .query("cmsSections")
    .withIndex("by_section", (q) => q.eq("section", section))
    .unique();
}

/**
 * Get or create the metadata row for `section`. New rows start with the
 * seeded `isEnabled` default and no draft. Content lives in the per-section
 * scoped tables; this row tracks visibility + publish bookkeeping only.
 */
export async function ensureSectionMetaRow(
  ctx: MutationCtx,
  section: CmsSection,
  updatedBy: string | undefined,
): Promise<{ id: Id<"cmsSections">; row: Doc<"cmsSections"> }> {
  const existing = await getSectionMetaRow(ctx, section);
  if (existing) {
    return { id: existing._id, row: existing };
  }

  const now = Date.now();
  const id = await ctx.db.insert("cmsSections", {
    section,
    isEnabled: DEFAULT_IS_ENABLED[section],
    hasDraftChanges: false,
    publishedAt: now,
    updatedAt: now,
    updatedBy,
  });
  const row = await ctx.db.get(id);
  if (!row) {
    throw new Error(`Failed to load cmsSections row after insert (${section})`);
  }
  return { id, row };
}

/**
 * Effective `isEnabled` for an admin editor / preview render
 * (`isEnabledDraft ?? isEnabled ?? default`). Public routes should read
 * `publishedIsEnabled` instead.
 */
export function effectiveIsEnabled(
  row: Doc<"cmsSections"> | null,
  section: CmsSection,
): boolean {
  if (!row) return DEFAULT_IS_ENABLED[section];
  if (typeof row.isEnabledDraft === "boolean") return row.isEnabledDraft;
  if (typeof row.isEnabled === "boolean") return row.isEnabled;
  return DEFAULT_IS_ENABLED[section];
}

/** Published `isEnabled` for anonymous public readers. */
export function publishedIsEnabled(
  row: Doc<"cmsSections"> | null,
  section: CmsSection,
): boolean {
  if (!row) return DEFAULT_IS_ENABLED[section];
  if (typeof row.isEnabled === "boolean") return row.isEnabled;
  return DEFAULT_IS_ENABLED[section];
}

/**
 * `true` when the section has a content draft that differs from the published
 * scope. **Empty draft scope always counts as "no content draft"** — the
 * admin editors always populate the full working copy on save, so an empty
 * draft scope means "the user has not edited content". This is what lets
 * flag-only toggles (`saveSectionIsEnabledDraft`) publish without wiping
 * published content.
 */
export async function sectionHasContentDraftDiff(
  ctx: QueryCtx | MutationCtx,
  section: CmsSection,
): Promise<boolean> {
  if (section === "recordings") return false;

  if (section === "about") {
    const draft = await loadAboutTree(ctx, "draft");
    if (!draftExistsInAbout(draft)) return false;
    const published = await loadAboutTree(ctx, "published");
    return !aboutDraftMatchesPublished(draft, published);
  }

  if (section === "pricing") {
    const draft = await loadPricingPackages(ctx, "draft");
    if (draft.length === 0) return false;
    const published = await loadPricingPackages(ctx, "published");
    return !pricingDraftMatchesPublished(draft, published);
  }

  // section === "settings"
  const draft = await loadSettingsContent(ctx, "draft");
  if (draft === null) return false;
  const published = await loadSettingsContent(ctx, "published");
  return !settingsDraftMatchesPublished(draft, published);
}

/** Pending visibility draft: `isEnabledDraft` set and differs from published. */
export function sectionHasPendingFlagDraft(
  row: Doc<"cmsSections"> | null,
  section: CmsSection,
): boolean {
  if (!row || typeof row.isEnabledDraft !== "boolean") return false;
  return row.isEnabledDraft !== (row.isEnabled ?? DEFAULT_IS_ENABLED[section]);
}

/**
 * `true` when the section has any pending draft — content or flag. Used by
 * `recomputeSectionHasDraftChanges` to keep the `hasDraftChanges` indicator
 * honest.
 */
export async function sectionHasPendingDraft(
  ctx: QueryCtx | MutationCtx,
  section: CmsSection,
  row: Doc<"cmsSections"> | null,
): Promise<boolean> {
  if (sectionHasPendingFlagDraft(row, section)) return true;

  return await sectionHasContentDraftDiff(ctx, section);
}

function draftExistsInAbout(tree: AboutTree): boolean {
  return (
    tree.content !== null ||
    tree.highlights.length > 0 ||
    tree.teamMembers.length > 0
  );
}

/**
 * Recompute `hasDraftChanges` on the `cmsSections` row after a draft write and
 * persist it. Called by every admin mutation that touches draft-scope content
 * or flips `isEnabledDraft` so the publish toolbar stays accurate.
 */
export async function recomputeSectionHasDraftChanges(
  ctx: MutationCtx,
  section: CmsSection,
  updatedBy: string | undefined,
): Promise<void> {
  const row = await getSectionMetaRow(ctx, section);
  if (!row) return;
  const pending = await sectionHasPendingDraft(ctx, section, row);
  const now = Date.now();
  await ctx.db.patch(row._id, {
    hasDraftChanges: pending,
    updatedAt: now,
    ...(updatedBy !== undefined ? { updatedBy } : {}),
  });
}
