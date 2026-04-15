import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { SETTINGS_DEFAULTS, settingsSnapshotsEqual } from "./cmsShared";
import { cmsNotFound, cmsPublishValidationFailed } from "./errors";

export type PublishIssue = { path: string; message: string };

export async function getSectionRow(
  ctx: MutationCtx,
  section: Doc<"cmsSections">["section"],
): Promise<Doc<"cmsSections"> | null> {
  return await ctx.db
    .query("cmsSections")
    .withIndex("by_section", (q) => q.eq("section", section))
    .unique();
}

export async function ensureSectionRow(
  ctx: MutationCtx,
  section: Doc<"cmsSections">["section"],
  updatedBy: string | undefined,
): Promise<{ row: Doc<"cmsSections">; id: Id<"cmsSections"> }> {
  const existing = await getSectionRow(ctx, section);
  const now = Date.now();

  if (existing) {
    return { row: existing, id: existing._id };
  }

  if (section !== "settings") {
    cmsNotFound("cmsSection", section, `Unknown CMS section: ${section}`);
  }

  const id = await ctx.db.insert("cmsSections", {
    section: "settings",
    updatedAt: now,
    updatedBy,
    publishedSnapshot: SETTINGS_DEFAULTS,
    publishedAt: now,
    hasDraftChanges: false,
  });
  const row = await ctx.db.get("cmsSections", id);
  if (!row) {
    throw new Error("Failed to load cmsSections row after insert");
  }
  return { row, id };
}

const trimOrEmpty = (s: string | undefined): string =>
  s === undefined ? "" : s.trim();

/** Best-effort checks before promoting `draft` to published (INF-75). */
export function collectSettingsPublishIssues(
  draft: Doc<"cmsSections">["publishedSnapshot"],
): PublishIssue[] {
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

export type PublishSectionResult =
  | {
      ok: true;
      kind: "published";
      section: Doc<"cmsSections">["section"];
      publishedAt: number;
      publishedBy: string;
    }
  | {
      ok: true;
      kind: "already_current";
      section: Doc<"cmsSections">["section"];
      publishedAt: number | null;
      publishedBy: string | undefined;
    };

/**
 * Single-transaction promote draft → published, or no-op when there is no draft and nothing pending.
 */
export async function publishSettingsSectionCore(
  ctx: MutationCtx,
  args: {
    section: Doc<"cmsSections">["section"];
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

  const issues = collectSettingsPublishIssues(draft);
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

/** Rows that have a draft different from published (site-wide publish targets). */
export function rowsWithPublishableDraft(
  rows: Doc<"cmsSections">[],
): Doc<"cmsSections">[] {
  return rows.filter(
    (row) =>
      row.draftSnapshot !== undefined &&
      !settingsSnapshotsEqual(row.draftSnapshot, row.publishedSnapshot),
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
    for (const issue of collectSettingsPublishIssues(d)) {
      issues.push({
        path: `${row.section}.${issue.path}`,
        message: issue.message,
      });
    }
  }
  return issues;
}
