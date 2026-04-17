import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

export type GearScope = "draft" | "published";

type GearCategoryDoc = Doc<"gearCategories">;
type GearItemDoc = Doc<"gearItems">;

export type SortedGearCategoryRow<T> = {
  stableId: string;
  name: string;
  sort: number;
  items: T[];
};

/**
 * Group items by category, sort categories and items by `sort` then `stableId`,
 * and map each item through `mapItem`. Used by public site reads and admin payloads
 * so ordering rules stay in one place.
 */
export function mapSortedGearTree<T>(
  categories: GearCategoryDoc[],
  items: GearItemDoc[],
  mapItem: (item: GearItemDoc) => T,
): SortedGearCategoryRow<T>[] {
  const byCat = new Map<string, GearItemDoc[]>();
  for (const it of items) {
    const list = byCat.get(it.categoryStableId) ?? [];
    list.push(it);
    byCat.set(it.categoryStableId, list);
  }
  for (const list of byCat.values()) {
    list.sort((a, b) => a.sort - b.sort || a.stableId.localeCompare(b.stableId));
  }
  const sortedCats = [...categories].sort(
    (a, b) => a.sort - b.sort || a.stableId.localeCompare(b.stableId),
  );
  return sortedCats.map((c) => ({
    stableId: c.stableId,
    name: c.name,
    sort: c.sort,
    items: (byCat.get(c.stableId) ?? []).map(mapItem),
  }));
}

function normalizeSpecsForCompare(specs: GearItemDoc["specs"]): unknown {
  if (specs.kind === "kv") {
    return {
      kind: "kv" as const,
      pairs: [...specs.pairs].sort((a, b) => a.key.localeCompare(b.key)),
    };
  }
  return specs;
}

/** Deterministic shape for deep equality between draft and published trees. */
export function normalizeGearTreeForCompare(
  categories: GearCategoryDoc[],
  items: GearItemDoc[],
): unknown {
  const catNorm = [...categories]
    .sort((a, b) => a.sort - b.sort || a.stableId.localeCompare(b.stableId))
    .map((c) => ({
      stableId: c.stableId,
      name: c.name,
      sort: c.sort,
    }));
  const itemNorm = [...items]
    .sort(
      (a, b) =>
        a.categoryStableId.localeCompare(b.categoryStableId) ||
        a.sort - b.sort ||
        a.stableId.localeCompare(b.stableId),
    )
    .map((i) => ({
      stableId: i.stableId,
      categoryStableId: i.categoryStableId,
      name: i.name,
      sort: i.sort,
      specs: normalizeSpecsForCompare(i.specs),
      url: i.url ?? null,
    }));
  return { categories: catNorm, items: itemNorm };
}

export async function loadGearDocs(
  ctx: QueryCtx | MutationCtx,
  scope: GearScope,
): Promise<{ categories: GearCategoryDoc[]; items: GearItemDoc[] }> {
  const categories = await ctx.db
    .query("gearCategories")
    .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
    .order("asc")
    .collect();
  const items = await ctx.db
    .query("gearItems")
    .withIndex("by_scope", (q) => q.eq("scope", scope))
    .collect();
  items.sort((a, b) => {
    if (a.categoryStableId !== b.categoryStableId) {
      return a.categoryStableId.localeCompare(b.categoryStableId);
    }
    return a.sort - b.sort || a.stableId.localeCompare(b.stableId);
  });
  return { categories, items };
}

export function gearDraftMatchesPublished(
  draft: { categories: GearCategoryDoc[]; items: GearItemDoc[] },
  published: { categories: GearCategoryDoc[]; items: GearItemDoc[] },
): boolean {
  const a = normalizeGearTreeForCompare(draft.categories, draft.items);
  const b = normalizeGearTreeForCompare(published.categories, published.items);
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Delete all gear docs for a scope (items first). */
export async function deleteAllGearForScope(
  ctx: MutationCtx,
  scope: GearScope,
): Promise<void> {
  for (;;) {
    const batch = await ctx.db
      .query("gearItems")
      .withIndex("by_scope", (q) => q.eq("scope", scope))
      .take(100);
    if (batch.length === 0) break;
    for (const row of batch) {
      await ctx.db.delete(row._id);
    }
  }
  for (;;) {
    const batch = await ctx.db
      .query("gearCategories")
      .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
      .take(100);
    if (batch.length === 0) break;
    for (const row of batch) {
      await ctx.db.delete(row._id);
    }
  }
}

/** Copy entire tree from one scope to another; clears destination first. */
export async function copyGearScope(
  ctx: MutationCtx,
  from: GearScope,
  to: GearScope,
): Promise<void> {
  await deleteAllGearForScope(ctx, to);
  const { categories, items } = await loadGearDocs(ctx, from);
  for (const c of categories) {
    await ctx.db.insert("gearCategories", {
      scope: to,
      stableId: c.stableId,
      name: c.name,
      sort: c.sort,
    });
  }
  for (const i of items) {
    await ctx.db.insert("gearItems", {
      scope: to,
      stableId: i.stableId,
      categoryStableId: i.categoryStableId,
      name: i.name,
      sort: i.sort,
      specs: i.specs,
      url: i.url,
    });
  }
}

export async function ensureGearMeta(
  ctx: MutationCtx,
): Promise<{ id: Id<"gearMeta">; row: Doc<"gearMeta"> }> {
  const existing = await ctx.db
    .query("gearMeta")
    .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
    .unique();
  const now = Date.now();
  if (existing) {
    return { id: existing._id, row: existing };
  }
  const id = await ctx.db.insert("gearMeta", {
    singletonKey: "default",
    hasDraftChanges: false,
    publishedAt: null,
    updatedAt: now,
  });
  const row = await ctx.db.get(id);
  if (!row) throw new Error("gearMeta insert failed");
  return { id, row };
}
