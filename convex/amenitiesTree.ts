import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import {
  AMENITIES_NEARBY_DEFAULT_ROWS,
  type AmenitiesNearbySnapshot,
} from "./cmsShared";
import {
  normalizeAmenitiesWebsiteInput,
  websiteForStorage,
} from "./lib/amenitiesUrl";

export type CmsScope = "draft" | "published";

type CopyDoc = Doc<"amenitiesNearbyCopy">;
type ItemDoc = Doc<"amenitiesNearbyItems">;

export type AmenitiesNearbyTree = {
  copy: CopyDoc | null;
  items: ItemDoc[];
};

function compareBySortThenStableId(
  a: { sort: number; stableId: string },
  b: { sort: number; stableId: string },
): number {
  return a.sort - b.sort || a.stableId.localeCompare(b.stableId);
}

export async function loadAmenitiesNearbyCopy(
  ctx: QueryCtx | MutationCtx,
  scope: CmsScope,
): Promise<CopyDoc | null> {
  return await ctx.db
    .query("amenitiesNearbyCopy")
    .withIndex("by_scope", (q) => q.eq("scope", scope))
    .unique();
}

export async function loadAmenitiesNearbyItems(
  ctx: QueryCtx | MutationCtx,
  scope: CmsScope,
): Promise<ItemDoc[]> {
  const rows = await ctx.db
    .query("amenitiesNearbyItems")
    .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
    .collect();
  rows.sort(compareBySortThenStableId);
  return rows;
}

export async function loadAmenitiesNearbyTree(
  ctx: QueryCtx | MutationCtx,
  scope: CmsScope,
): Promise<AmenitiesNearbyTree> {
  const [copy, items] = await Promise.all([
    loadAmenitiesNearbyCopy(ctx, scope),
    loadAmenitiesNearbyItems(ctx, scope),
  ]);
  return { copy, items };
}

/**
 * Inserts `AMENITIES_NEARBY_DEFAULT_ROWS` from `cmsShared` into
 * `amenitiesNearbyItems` for `scope="published"` when the published copy row
 * is absent and there are no published item rows. Used by the dev seed and the
 * one-time migration.
 *
 * @returns whether rows were inserted (false when published already has copy or items).
 */
export async function insertDefaultAmenitiesNearbyPublishedIfEmpty(
  ctx: MutationCtx,
): Promise<boolean> {
  const copyPublished = await loadAmenitiesNearbyCopy(ctx, "published");
  const itemsPublished = await loadAmenitiesNearbyItems(ctx, "published");
  if (copyPublished !== null || itemsPublished.length > 0) {
    return false;
  }
  for (let i = 0; i < AMENITIES_NEARBY_DEFAULT_ROWS.length; i++) {
    const row = AMENITIES_NEARBY_DEFAULT_ROWS[i];
    await ctx.db.insert("amenitiesNearbyItems", {
      scope: "published",
      stableId: row.stableId,
      name: row.name,
      type: row.type,
      description: row.description,
      website: amenitiesWebsiteForDbStorage(row.website),
      sort: i,
    });
  }
  return true;
}

/** Same URL string written by {@link replaceAmenitiesNearbyDraft} / publish paths. */
export function amenitiesWebsiteForDbStorage(raw: string): string {
  const normalized = normalizeAmenitiesWebsiteInput(raw);
  return normalized !== null ? websiteForStorage(normalized) : "";
}

/**
 * Snapshot used when DB rows are empty: optional copy from the tree plus
 * shipped default cards.
 */
export function fallbackAmenitiesSnapshotFromTree(
  tree: AmenitiesNearbyTree,
): AmenitiesNearbySnapshot {
  const c = tree.copy;
  return {
    ...(c?.eyebrow !== undefined && c.eyebrow.trim().length > 0
      ? { eyebrow: c.eyebrow }
      : {}),
    ...(c?.heading !== undefined && c.heading.trim().length > 0
      ? { heading: c.heading }
      : {}),
    ...(c?.intro !== undefined && c.intro.trim().length > 0 ? { intro: c.intro } : {}),
    rows: AMENITIES_NEARBY_DEFAULT_ROWS,
  };
}

function normalizeTreeForCompare(tree: AmenitiesNearbyTree): unknown {
  const c = tree.copy;
  return {
    eyebrow: c?.eyebrow?.trim() ?? null,
    heading: c?.heading?.trim() ?? null,
    intro: c?.intro?.trim() ?? null,
    items: [...tree.items].sort(compareBySortThenStableId).map((r) => ({
      stableId: r.stableId,
      name: r.name,
      type: r.type,
      description: r.description,
      website: r.website,
      sort: r.sort,
    })),
  };
}

export function amenitiesNearbyDraftMatchesPublished(
  draft: AmenitiesNearbyTree,
  published: AmenitiesNearbyTree,
): boolean {
  return (
    JSON.stringify(normalizeTreeForCompare(draft)) ===
    JSON.stringify(normalizeTreeForCompare(published))
  );
}

export async function deleteAllAmenitiesItemsForScope(
  ctx: MutationCtx,
  scope: CmsScope,
): Promise<void> {
  for (;;) {
    const batch = await ctx.db
      .query("amenitiesNearbyItems")
      .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
      .take(100);
    if (batch.length === 0) break;
    for (const row of batch) {
      await ctx.db.delete(row._id);
    }
  }
}

export async function deleteAmenitiesCopyForScope(
  ctx: MutationCtx,
  scope: CmsScope,
): Promise<void> {
  const row = await loadAmenitiesNearbyCopy(ctx, scope);
  if (row) await ctx.db.delete(row._id);
}

export async function copyAmenitiesNearbyScope(
  ctx: MutationCtx,
  from: CmsScope,
  to: CmsScope,
): Promise<void> {
  await deleteAmenitiesCopyForScope(ctx, to);
  await deleteAllAmenitiesItemsForScope(ctx, to);

  const sourceCopy = await loadAmenitiesNearbyCopy(ctx, from);
  if (sourceCopy) {
    await ctx.db.insert("amenitiesNearbyCopy", {
      scope: to,
      ...(sourceCopy.eyebrow !== undefined ? { eyebrow: sourceCopy.eyebrow } : {}),
      ...(sourceCopy.heading !== undefined ? { heading: sourceCopy.heading } : {}),
      ...(sourceCopy.intro !== undefined ? { intro: sourceCopy.intro } : {}),
    });
  }

  const sourceItems = await loadAmenitiesNearbyItems(ctx, from);
  for (const row of sourceItems) {
    await ctx.db.insert("amenitiesNearbyItems", {
      scope: to,
      stableId: row.stableId,
      name: row.name,
      type: row.type,
      description: row.description,
      website: row.website,
      sort: row.sort,
    });
  }
}

function trimOpt(s: string | undefined): string | undefined {
  if (s === undefined) return undefined;
  const t = s.trim();
  return t.length === 0 ? undefined : t;
}

/**
 * Replace draft-scope amenities content (copy row + item rows).
 */
export async function replaceAmenitiesNearbyDraft(
  ctx: MutationCtx,
  snapshot: AmenitiesNearbySnapshot,
): Promise<void> {
  await deleteAmenitiesCopyForScope(ctx, "draft");
  await deleteAllAmenitiesItemsForScope(ctx, "draft");

  const eyebrow = trimOpt(snapshot.eyebrow);
  const heading = trimOpt(snapshot.heading);
  const intro = trimOpt(snapshot.intro);
  if (eyebrow !== undefined || heading !== undefined || intro !== undefined) {
    await ctx.db.insert("amenitiesNearbyCopy", {
      scope: "draft",
      ...(eyebrow !== undefined ? { eyebrow } : {}),
      ...(heading !== undefined ? { heading } : {}),
      ...(intro !== undefined ? { intro } : {}),
    });
  }

  for (let i = 0; i < snapshot.rows.length; i++) {
    const row = snapshot.rows[i];
    await ctx.db.insert("amenitiesNearbyItems", {
      scope: "draft",
      stableId: row.stableId.trim(),
      name: row.name.trim(),
      type: row.type.trim(),
      description: row.description.trim(),
      website: amenitiesWebsiteForDbStorage(row.website),
      sort: i,
    });
  }
}

export function snapshotFromAmenitiesTree(
  tree: AmenitiesNearbyTree,
): AmenitiesNearbySnapshot {
  const c = tree.copy;
  return {
    ...(c?.eyebrow !== undefined && c.eyebrow.trim().length > 0
      ? { eyebrow: c.eyebrow }
      : {}),
    ...(c?.heading !== undefined && c.heading.trim().length > 0
      ? { heading: c.heading }
      : {}),
    ...(c?.intro !== undefined && c.intro.trim().length > 0
      ? { intro: c.intro }
      : {}),
    rows: tree.items.map((r) => ({
      stableId: r.stableId,
      name: r.name,
      type: r.type,
      description: r.description,
      website: r.website,
    })),
  };
}

export async function collectAmenitiesNearbyPublishIssues(
  ctx: QueryCtx | MutationCtx,
): Promise<Array<{ path: string; message: string }>> {
  const draftTree = await loadAmenitiesNearbyTree(ctx, "draft");
  const draftHasRows = draftTree.items.length > 0 || draftTree.copy !== null;
  const tree = draftHasRows
    ? draftTree
    : await loadAmenitiesNearbyTree(ctx, "published");

  const issues: Array<{ path: string; message: string }> = [];
  const seen = new Set<string>();

  for (let i = 0; i < tree.items.length; i++) {
    const row = tree.items[i];
    const base = `rows[${i}]`;
    if (typeof row.stableId !== "string" || row.stableId.trim().length === 0) {
      issues.push({
        path: `${base}.stableId`,
        message: "Each amenity requires a stable id.",
      });
    } else if (seen.has(row.stableId)) {
      issues.push({
        path: `${base}.stableId`,
        message: `Duplicate stable id: ${row.stableId}`,
      });
    } else {
      seen.add(row.stableId);
    }
    if (typeof row.name !== "string" || row.name.trim().length === 0) {
      issues.push({
        path: `${base}.name`,
        message: "Display name is required.",
      });
    }
    if (typeof row.type !== "string" || row.type.trim().length === 0) {
      issues.push({
        path: `${base}.type`,
        message: "Category line is required.",
      });
    }
    const normalized = normalizeAmenitiesWebsiteInput(row.website);
    if (normalized === null) {
      issues.push({
        path: `${base}.website`,
        message: "Enter a valid http(s) URL for the external link.",
      });
    }
  }

  return issues;
}

export type PublicAmenityCard = {
  stableId: string;
  name: string;
  type: string;
  description: string;
  website: string;
};

export type PublicAmenitiesNearbyPayload = {
  eyebrow: string | null;
  heading: string | null;
  intro: string | null;
  rows: PublicAmenityCard[];
};

/**
 * Published read: drop cards with invalid links; trim optional chrome.
 */
/**
 * Build the public payload from an in-memory snapshot (defaults / fallbacks
 * without Convex `_id` rows).
 */
export function materializePublicAmenitiesNearbyFromSnapshot(
  snapshot: AmenitiesNearbySnapshot,
): PublicAmenitiesNearbyPayload {
  const eyebrow = trimOpt(snapshot.eyebrow) ?? null;
  const heading = trimOpt(snapshot.heading) ?? null;
  const intro = trimOpt(snapshot.intro) ?? null;
  const rows: PublicAmenityCard[] = [];
  for (const r of snapshot.rows) {
    const name = r.name.trim();
    if (name.length === 0) continue;
    const normalized = normalizeAmenitiesWebsiteInput(r.website);
    if (normalized === null) continue;
    const website = websiteForStorage(normalized);
    rows.push({
      stableId: r.stableId.trim(),
      name,
      type: r.type.trim(),
      description: r.description.trim(),
      website,
    });
  }
  return {
    eyebrow: eyebrow ?? null,
    heading: heading ?? null,
    intro: intro ?? null,
    rows,
  };
}

export function materializePublicAmenitiesNearby(
  tree: AmenitiesNearbyTree,
): PublicAmenitiesNearbyPayload {
  const c = tree.copy;
  const eyebrow =
    c?.eyebrow !== undefined && c.eyebrow.trim().length > 0
      ? c.eyebrow.trim()
      : null;
  const heading =
    c?.heading !== undefined && c.heading.trim().length > 0
      ? c.heading.trim()
      : null;
  const intro =
    c?.intro !== undefined && c.intro.trim().length > 0 ? c.intro.trim() : null;

  const rows: PublicAmenityCard[] = [];
  for (const r of tree.items) {
    const name = r.name.trim();
    if (name.length === 0) continue;
    const normalized = normalizeAmenitiesWebsiteInput(r.website);
    if (normalized === null) continue;
    const website = websiteForStorage(normalized);
    rows.push({
      stableId: r.stableId,
      name,
      type: r.type.trim(),
      description: r.description.trim(),
      website,
    });
  }

  return { eyebrow, heading, intro, rows };
}
