import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export type CmsScope = "draft" | "published";

type SettingsContentDoc = Doc<"settingsContent">;

export type SettingsMetadata = {
  title?: string;
  description?: string;
};

export const SETTINGS_METADATA_DEFAULTS: SettingsMetadata = {
  title: "Lula Lake Sound",
  description: "Music Production and Recording Services",
};

export async function loadSettingsContent(
  ctx: QueryCtx | MutationCtx,
  scope: CmsScope,
): Promise<SettingsContentDoc | null> {
  return await ctx.db
    .query("settingsContent")
    .withIndex("by_scope", (q) => q.eq("scope", scope))
    .unique();
}

export function normalizeSettingsForCompare(
  row: SettingsContentDoc | null,
): unknown {
  if (row === null) return null;
  return {
    title: row.title ?? null,
    description: row.description ?? null,
  };
}

export function settingsDraftMatchesPublished(
  draft: SettingsContentDoc | null,
  published: SettingsContentDoc | null,
): boolean {
  return (
    JSON.stringify(normalizeSettingsForCompare(draft)) ===
    JSON.stringify(normalizeSettingsForCompare(published))
  );
}

export async function deleteAllSettingsForScope(
  ctx: MutationCtx,
  scope: CmsScope,
): Promise<void> {
  for (;;) {
    const batch = await ctx.db
      .query("settingsContent")
      .withIndex("by_scope", (q) => q.eq("scope", scope))
      .take(100);
    if (batch.length === 0) break;
    for (const row of batch) {
      await ctx.db.delete(row._id);
    }
  }
}

export async function copySettingsScope(
  ctx: MutationCtx,
  from: CmsScope,
  to: CmsScope,
): Promise<void> {
  await deleteAllSettingsForScope(ctx, to);
  const source = await loadSettingsContent(ctx, from);
  if (source === null) return;
  await ctx.db.insert("settingsContent", {
    scope: to,
    ...(source.title !== undefined ? { title: source.title } : {}),
    ...(source.description !== undefined
      ? { description: source.description }
      : {}),
  });
}

/**
 * Replace the draft-scope settings row with a fresh payload. Used by
 * the compatibility `saveDraft` mutation.
 */
export async function replaceSettingsDraft(
  ctx: MutationCtx,
  metadata: SettingsMetadata,
): Promise<void> {
  await deleteAllSettingsForScope(ctx, "draft");
  await ctx.db.insert("settingsContent", {
    scope: "draft",
    ...(metadata.title !== undefined ? { title: metadata.title } : {}),
    ...(metadata.description !== undefined
      ? { description: metadata.description }
      : {}),
  });
}
