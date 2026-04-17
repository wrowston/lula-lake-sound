import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  PRICING_DEFAULTS,
  SETTINGS_DEFAULTS,
  cmsSnapshotsEqual,
  defaultSnapshotForSection,
  type CmsSection,
  type CmsSnapshot,
  type PricingSnapshot,
  type SettingsSnapshot,
} from "./cmsShared";
import { cmsPublishValidationFailed } from "./errors";

export type PublishIssue = { path: string; message: string };

export async function getSectionRow(
  ctx: MutationCtx,
  section: CmsSection,
): Promise<Doc<"cmsSections"> | null> {
  return await ctx.db
    .query("cmsSections")
    .withIndex("by_section", (q) => q.eq("section", section))
    .unique();
}

/**
 * Resolve the initial published snapshot for a brand new row.
 *
 * For `pricing`, we opportunistically backfill from any legacy `flags`
 * stored on the existing `settings` row so the first write doesn’t reset
 * the user’s previously-published value. Packages always start empty so
 * that creating the row from a draft save never leaks default packages
 * to the public site — the owner must explicitly publish to populate
 * `packages`.
 */
async function initialSnapshotForSection(
  ctx: MutationCtx,
  section: CmsSection,
): Promise<CmsSnapshot> {
  if (section === "pricing") {
    const legacy = await getSectionRow(ctx, "settings");
    const legacyFlags = (legacy?.publishedSnapshot as SettingsSnapshot | undefined)
      ?.flags;
    return {
      flags: legacyFlags ?? PRICING_DEFAULTS.flags,
      packages: [],
    } satisfies PricingSnapshot;
  }
  return SETTINGS_DEFAULTS;
}

export async function ensureSectionRow(
  ctx: MutationCtx,
  section: CmsSection,
  updatedBy: string | undefined,
): Promise<{ row: Doc<"cmsSections">; id: Id<"cmsSections"> }> {
  const existing = await getSectionRow(ctx, section);

  if (existing) {
    return { row: existing, id: existing._id };
  }

  const now = Date.now();
  const publishedSnapshot = await initialSnapshotForSection(ctx, section);

  const id = await ctx.db.insert("cmsSections", {
    section,
    updatedAt: now,
    updatedBy,
    publishedSnapshot,
    publishedAt: now,
    hasDraftChanges: false,
  });
  const row = await ctx.db.get(id);
  if (!row) {
    throw new Error("Failed to load cmsSections row after insert");
  }
  return { row, id };
}

const trimOrEmpty = (s: string | undefined): string =>
  s === undefined ? "" : s.trim();

function collectSettingsIssues(draft: SettingsSnapshot): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const title = trimOrEmpty(draft.metadata?.title);
  if (title.length === 0) {
    issues.push({
      path: "metadata.title",
      message: "Site title is required to publish.",
    });
  }
  const description = trimOrEmpty(draft.metadata?.description);
  if (description.length === 0) {
    issues.push({
      path: "metadata.description",
      message: "Site description is required to publish.",
    });
  }
  return issues;
}

function collectPricingIssues(draft: PricingSnapshot): PublishIssue[] {
  const issues: PublishIssue[] = [];
  if (typeof draft.flags?.priceTabEnabled !== "boolean") {
    issues.push({
      path: "flags.priceTabEnabled",
      message: "Pricing visibility flag must be a boolean.",
    });
  }

  const packages = draft.packages ?? [];
  const seenIds = new Set<string>();
  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    const base = `packages[${i}]`;
    if (typeof pkg.id !== "string" || pkg.id.trim().length === 0) {
      issues.push({
        path: `${base}.id`,
        message: "Each pricing package requires a stable id.",
      });
    } else if (seenIds.has(pkg.id)) {
      issues.push({
        path: `${base}.id`,
        message: `Duplicate package id: ${pkg.id}`,
      });
    } else {
      seenIds.add(pkg.id);
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
          "Custom cadence requires a unit label (e.g. \"per weekend\").",
      });
    }
  }

  return issues;
}

/** Best-effort checks before promoting `draft` to published (INF-75). */
export function collectPublishIssues(
  section: CmsSection,
  draft: CmsSnapshot,
): PublishIssue[] {
  if (section === "settings") {
    return collectSettingsIssues(draft as SettingsSnapshot);
  }
  return collectPricingIssues(draft as PricingSnapshot);
}

/**
 * @deprecated Kept for back-compat with older callers. Prefer
 * {@link collectPublishIssues} with an explicit section.
 */
export function collectSettingsPublishIssues(
  draft: SettingsSnapshot,
): PublishIssue[] {
  return collectSettingsIssues(draft);
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
 * Single-transaction promote draft → published, or no-op when there is no draft and nothing pending.
 */
export async function publishSectionCore(
  ctx: MutationCtx,
  args: {
    section: CmsSection;
    id: Id<"cmsSections">;
    row: Doc<"cmsSections">;
    /** Clerk `subject` — stored as `publishedBy` for audit. */
    publishedByUserId: string;
    updatedByTokenId: string;
  },
): Promise<PublishSectionResult> {
  const { section, id, row, publishedByUserId, updatedByTokenId } = args;
  const draft = row.draftSnapshot;

  if (!draft) {
    if (row.hasDraftChanges) {
      cmsPublishValidationFailed(
        section,
        "Draft data is missing but changes are flagged. Save a draft again, then publish.",
        [{ path: "_state", message: "Inconsistent draft state." }],
      );
    }
    return {
      ok: true,
      kind: "already_current",
      section,
      publishedAt: row.publishedAt,
      publishedBy: row.publishedBy,
    };
  }

  const issues = collectPublishIssues(section, draft);
  if (issues.length > 0) {
    cmsPublishValidationFailed(section, "Publish validation failed.", issues);
  }

  const now = Date.now();

  await ctx.db.patch(id, {
    publishedSnapshot: draft,
    publishedAt: now,
    publishedBy: publishedByUserId,
    draftSnapshot: undefined,
    hasDraftChanges: false,
    updatedAt: now,
    updatedBy: updatedByTokenId,
  });

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

/** Rows that have a draft different from published (site-wide publish targets). */
export function rowsWithPublishableDraft(
  rows: Doc<"cmsSections">[],
): Doc<"cmsSections">[] {
  return rows.filter(
    (row) =>
      row.draftSnapshot !== undefined &&
      !cmsSnapshotsEqual(row.draftSnapshot, row.publishedSnapshot),
  );
}

/** Aggregate validation issues across sections (preflight for `publishSite`). */
export function collectAllPublishIssues(
  targets: Doc<"cmsSections">[],
): PublishIssue[] {
  const issues: PublishIssue[] = [];
  for (const row of targets) {
    const d = row.draftSnapshot;
    if (!d) continue;
    for (const issue of collectPublishIssues(row.section, d)) {
      issues.push({
        path: `${row.section}.${issue.path}`,
        message: issue.message,
      });
    }
  }
  return issues;
}

// Preserve legacy default re-exports for callers that imported from this module.
export { defaultSnapshotForSection };
