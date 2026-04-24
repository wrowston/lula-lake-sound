import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { PricingPackage } from "./cmsShared";

export type CmsScope = "draft" | "published";

type PricingPackageDoc = Doc<"pricingPackages">;

function compareBySortOrderThenStableId(
  a: { sortOrder: number; stableId: string },
  b: { sortOrder: number; stableId: string },
): number {
  return (
    a.sortOrder - b.sortOrder || a.stableId.localeCompare(b.stableId)
  );
}

export async function loadPricingPackages(
  ctx: QueryCtx | MutationCtx,
  scope: CmsScope,
): Promise<PricingPackageDoc[]> {
  const rows = await ctx.db
    .query("pricingPackages")
    .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
    .collect();
  rows.sort(compareBySortOrderThenStableId);
  return rows;
}

/**
 * Flatten stored rows to the snapshot-shaped `PricingPackage` used by
 * legacy callers (the admin editor and front-end helpers).
 */
export function pricingPackageFromRow(row: PricingPackageDoc): PricingPackage {
  return {
    id: row.stableId,
    name: row.name,
    ...(row.description !== undefined ? { description: row.description } : {}),
    priceCents: row.priceCents,
    currency: row.currency,
    billingCadence: row.billingCadence,
    ...(row.unitLabel !== undefined ? { unitLabel: row.unitLabel } : {}),
    highlight: row.highlight,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    ...(row.features !== undefined ? { features: row.features } : {}),
  };
}

/** Deterministic shape for deep equality between draft and published catalogues. */
export function normalizePricingForCompare(
  rows: PricingPackageDoc[],
): unknown {
  return [...rows]
    .sort(compareBySortOrderThenStableId)
    .map((r) => ({
      stableId: r.stableId,
      name: r.name,
      description: r.description ?? null,
      priceCents: r.priceCents,
      currency: r.currency,
      billingCadence: r.billingCadence,
      unitLabel: r.unitLabel ?? null,
      highlight: r.highlight,
      sortOrder: r.sortOrder,
      isActive: r.isActive,
      features: r.features ?? null,
    }));
}

export function pricingDraftMatchesPublished(
  draft: PricingPackageDoc[],
  published: PricingPackageDoc[],
): boolean {
  return (
    JSON.stringify(normalizePricingForCompare(draft)) ===
    JSON.stringify(normalizePricingForCompare(published))
  );
}

/** Delete all pricing packages for a scope. */
export async function deleteAllPricingForScope(
  ctx: MutationCtx,
  scope: CmsScope,
): Promise<void> {
  for (;;) {
    const batch = await ctx.db
      .query("pricingPackages")
      .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
      .take(100);
    if (batch.length === 0) break;
    for (const row of batch) {
      await ctx.db.delete(row._id);
    }
  }
}

/**
 * Copy the pricing catalogue from one scope to another; clears destination
 * first so the result is a pure replacement.
 */
export async function copyPricingScope(
  ctx: MutationCtx,
  from: CmsScope,
  to: CmsScope,
): Promise<void> {
  await deleteAllPricingForScope(ctx, to);
  const source = await loadPricingPackages(ctx, from);
  for (const row of source) {
    await ctx.db.insert("pricingPackages", {
      scope: to,
      stableId: row.stableId,
      name: row.name,
      ...(row.description !== undefined ? { description: row.description } : {}),
      priceCents: row.priceCents,
      currency: row.currency,
      billingCadence: row.billingCadence,
      ...(row.unitLabel !== undefined ? { unitLabel: row.unitLabel } : {}),
      highlight: row.highlight,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      ...(row.features !== undefined ? { features: row.features } : {}),
    });
  }
}

/**
 * Replace the draft-scope pricing catalogue with a fresh snapshot-shaped
 * payload. Used by the compatibility `saveDraftPricing` mutation.
 */
export async function replacePricingDraftFromPackages(
  ctx: MutationCtx,
  packages: PricingPackage[],
): Promise<void> {
  await deleteAllPricingForScope(ctx, "draft");
  for (const pkg of packages) {
    await ctx.db.insert("pricingPackages", {
      scope: "draft",
      stableId: pkg.id,
      name: pkg.name,
      ...(pkg.description !== undefined ? { description: pkg.description } : {}),
      priceCents: pkg.priceCents,
      currency: pkg.currency,
      billingCadence: pkg.billingCadence,
      ...(pkg.unitLabel !== undefined ? { unitLabel: pkg.unitLabel } : {}),
      highlight: pkg.highlight,
      sortOrder: pkg.sortOrder,
      isActive: pkg.isActive,
      ...(pkg.features !== undefined ? { features: pkg.features } : {}),
    });
  }
}
