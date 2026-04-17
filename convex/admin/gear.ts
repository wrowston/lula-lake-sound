/**
 * Studio gear CMS (INF-86): CRUD on **draft** only; `publishGear` / `discardDraftGear`
 * for atomic snapshot swaps. See `convex/gearTree.ts` for tree helpers.
 *
 * One-time import from legacy `equipment-specs.tsx` data: run
 * `bunx convex run internal.seed.seedGearFromEquipmentSpecs` after deploy
 * (or enter via admin when the UI exists).
 */
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import {
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "../_generated/server";
import { gearSpecsValidator } from "../schema.shared";
import {
  copyGearScope,
  ensureGearMeta,
  gearDraftMatchesPublished,
  loadGearDocs,
  mapSortedGearTree,
} from "../gearTree";
import { requireCmsOwner } from "../lib/auth";
import { cmsPublishValidationFailed, cmsValidationError } from "../errors";

type PublishIssue = { path: string; message: string };

function trimName(s: string): string {
  return s.trim();
}

function collectGearPublishIssues(draft: {
  categories: Doc<"gearCategories">[];
  items: Doc<"gearItems">[];
}): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const catIds = new Set(draft.categories.map((c) => c.stableId));

  for (let i = 0; i < draft.categories.length; i++) {
    const c = draft.categories[i];
    if (trimName(c.name).length === 0) {
      issues.push({
        path: `categories[${i}].name`,
        message: "Category name is required.",
      });
    }
  }

  for (let i = 0; i < draft.items.length; i++) {
    const it = draft.items[i];
    const base = `items[${i}]`;
    if (trimName(it.name).length === 0) {
      issues.push({
        path: `${base}.name`,
        message: "Gear item name is required.",
      });
    }
    if (!catIds.has(it.categoryStableId)) {
      issues.push({
        path: `${base}.categoryStableId`,
        message: `Unknown category stable id: ${it.categoryStableId}`,
      });
    }
  }

  return issues;
}

async function getDraftCategoryByStableId(
  ctx: MutationCtx,
  stableId: string,
): Promise<Doc<"gearCategories"> | null> {
  return await ctx.db
    .query("gearCategories")
    .withIndex("by_scope_and_stableId", (q) =>
      q.eq("scope", "draft").eq("stableId", stableId),
    )
    .unique();
}

async function getDraftItemByStableId(
  ctx: MutationCtx,
  stableId: string,
): Promise<Doc<"gearItems"> | null> {
  return await ctx.db
    .query("gearItems")
    .withIndex("by_scope_and_stableId", (q) =>
      q.eq("scope", "draft").eq("stableId", stableId),
    )
    .unique();
}

async function patchGearMetaAfterDraftChange(
  ctx: MutationCtx,
  updatedBy: string,
): Promise<void> {
  const draft = await loadGearDocs(ctx, "draft");
  const published = await loadGearDocs(ctx, "published");
  const hasDraftChanges = !gearDraftMatchesPublished(draft, published);
  const { id } = await ensureGearMeta(ctx);
  await ctx.db.patch(id, {
    hasDraftChanges,
    updatedAt: Date.now(),
    updatedBy,
  });
}

export type GearItemPayload = {
  stableId: string;
  categoryStableId: string;
  name: string;
  sort: number;
  specs: Doc<"gearItems">["specs"];
  url?: string | null;
};

export type GearCategoryPayload = {
  stableId: string;
  name: string;
  sort: number;
  items: GearItemPayload[];
};

function toPayload(
  categories: Doc<"gearCategories">[],
  items: Doc<"gearItems">[],
): GearCategoryPayload[] {
  return mapSortedGearTree<GearItemPayload>(categories, items, (i) => ({
    stableId: i.stableId,
    categoryStableId: i.categoryStableId,
    name: i.name,
    sort: i.sort,
    specs: i.specs,
    url: i.url ?? null,
  }));
}

export const listDraftGear = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    const { categories, items } = await loadGearDocs(ctx, "draft");
    const meta = await ctx.db
      .query("gearMeta")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();
    return {
      tree: toPayload(categories, items),
      hasDraftChanges: meta?.hasDraftChanges ?? false,
      publishedAt: meta?.publishedAt ?? null,
      publishedBy: meta?.publishedBy ?? null,
      updatedAt: meta?.updatedAt ?? null,
      updatedBy: meta?.updatedBy ?? null,
    };
  },
});

export const listPublishedGearAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    const { categories, items } = await loadGearDocs(ctx, "published");
    return { tree: toPayload(categories, items) };
  },
});

export const validateGearDraft = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    const draft = await loadGearDocs(ctx, "draft");
    const issues = collectGearPublishIssues(draft);
    return {
      ok: issues.length === 0,
      issues,
    };
  },
});

export const putDraftCategory = mutation({
  args: {
    stableId: v.string(),
    name: v.string(),
    sort: v.number(),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    await ensureGearMeta(ctx);
    if (trimName(args.name).length === 0) {
      cmsValidationError("Category name is required.", "name");
    }
    if (!Number.isFinite(args.sort)) {
      cmsValidationError("Sort order must be a finite number.", "sort");
    }

    const existing = await getDraftCategoryByStableId(ctx, args.stableId);
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name.trim(),
        sort: args.sort,
      });
    } else {
      await ctx.db.insert("gearCategories", {
        scope: "draft",
        stableId: args.stableId,
        name: args.name.trim(),
        sort: args.sort,
      });
    }
    await patchGearMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

export const removeDraftCategory = mutation({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const cat = await getDraftCategoryByStableId(ctx, args.stableId);
    if (!cat) {
      return { ok: true as const, removed: false };
    }

    for (;;) {
      const batch = await ctx.db
        .query("gearItems")
        .withIndex("by_scope_and_category_and_sort", (q) =>
          q.eq("scope", "draft").eq("categoryStableId", args.stableId),
        )
        .take(50);
      if (batch.length === 0) break;
      for (const row of batch) {
        await ctx.db.delete(row._id);
      }
    }

    await ctx.db.delete(cat._id);
    await patchGearMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const, removed: true };
  },
});

export const putDraftItem = mutation({
  args: {
    stableId: v.string(),
    categoryStableId: v.string(),
    name: v.string(),
    sort: v.number(),
    specs: gearSpecsValidator,
    url: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    await ensureGearMeta(ctx);
    if (trimName(args.name).length === 0) {
      cmsValidationError("Item name is required.", "name");
    }
    if (!Number.isFinite(args.sort)) {
      cmsValidationError("Sort order must be a finite number.", "sort");
    }

    const cat = await getDraftCategoryByStableId(ctx, args.categoryStableId);
    if (!cat) {
      cmsValidationError(
        `Draft category not found: ${args.categoryStableId}`,
        "categoryStableId",
      );
    }

    const url =
      args.url === undefined || args.url === null
        ? undefined
        : args.url.trim().length > 0
          ? args.url.trim()
          : undefined;

    const existing = await getDraftItemByStableId(ctx, args.stableId);
    const payload = {
      categoryStableId: args.categoryStableId,
      name: args.name.trim(),
      sort: args.sort,
      specs: args.specs,
      url,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("gearItems", {
        scope: "draft",
        stableId: args.stableId,
        ...payload,
      });
    }

    await patchGearMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const };
  },
});

export const removeDraftItem = mutation({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getDraftItemByStableId(ctx, args.stableId);
    if (!row) {
      return { ok: true as const, removed: false };
    }
    await ctx.db.delete(row._id);
    await patchGearMetaAfterDraftChange(ctx, updatedBy);
    return { ok: true as const, removed: true };
  },
});

export const publishGear = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId, updatedBy } = await requireCmsOwner(ctx);
    const draft = await loadGearDocs(ctx, "draft");
    const issues = collectGearPublishIssues(draft);
    if (issues.length > 0) {
      cmsPublishValidationFailed(
        "gear",
        "Publish validation failed.",
        issues,
      );
    }

    await copyGearScope(ctx, "draft", "published");

    const { id: metaId } = await ensureGearMeta(ctx);
    const now = Date.now();
    await ctx.db.patch(metaId, {
      hasDraftChanges: false,
      publishedAt: now,
      publishedBy: userId,
      updatedAt: now,
      updatedBy,
    });

    return {
      ok: true as const,
      kind: "published" as const,
      publishedAt: now,
      publishedBy: userId,
    };
  },
});

export const discardDraftGear = mutation({
  args: {},
  handler: async (ctx) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    await ensureGearMeta(ctx);
    await copyGearScope(ctx, "published", "draft");

    const { id: metaId } = await ensureGearMeta(ctx);
    const now = Date.now();
    await ctx.db.patch(metaId, {
      hasDraftChanges: false,
      updatedAt: now,
      updatedBy,
    });

    return { ok: true as const, discarded: true };
  },
});

/** Debug: raw row counts per scope (internal). */
export const debugGearCounts = internalQuery({
  args: {},
  handler: async (ctx) => {
    return {
      draftCategories: (
        await ctx.db
          .query("gearCategories")
          .withIndex("by_scope_and_sort", (q) => q.eq("scope", "draft"))
          .collect()
      ).length,
      draftItems: (
        await ctx.db
          .query("gearItems")
          .withIndex("by_scope", (q) => q.eq("scope", "draft"))
          .collect()
      ).length,
      publishedCategories: (
        await ctx.db
          .query("gearCategories")
          .withIndex("by_scope_and_sort", (q) => q.eq("scope", "published"))
          .collect()
      ).length,
      publishedItems: (
        await ctx.db
          .query("gearItems")
          .withIndex("by_scope", (q) => q.eq("scope", "published"))
          .collect()
      ).length,
    };
  },
});
