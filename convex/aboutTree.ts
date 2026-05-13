import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

export type CmsScope = "draft" | "published";

type AboutContentDoc = Doc<"aboutContent">;
type AboutHighlightDoc = Doc<"aboutHighlights">;
type AboutTeamMemberDoc = Doc<"aboutTeamMembers">;

export type AboutContentScalars = {
  heroImageStorageId?: Id<"_storage">;
  heroTitle: string;
  heroSubtitle?: string;
  bodyHtml?: string;
  bodyBlocks?: Array<{ type: "paragraph" | "heading"; text: string }>;
  pullQuote?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type AboutHighlightInput = {
  stableId: string;
  text: string;
  sort: number;
};

export type AboutTeamMemberInput = {
  stableId: string;
  name: string;
  title: string;
  bio: string;
  storageId?: Id<"_storage">;
  sort: number;
};

export type AboutTree = {
  content: AboutContentDoc | null;
  highlights: AboutHighlightDoc[];
  teamMembers: AboutTeamMemberDoc[];
};

/**
 * Default content for a brand new deployment. Written at scope=`"published"`
 * by the seed so the public About route renders before the first publish.
 */
export const ABOUT_CONTENT_DEFAULTS: AboutContentScalars = {
  heroTitle: "About Lula Lake Sound",
  heroSubtitle: "A creative space for music production and recording.",
  bodyBlocks: [
    {
      type: "paragraph",
      text: "Lula Lake Sound is a studio focused on helping artists capture the sound they hear in their heads.",
    },
  ],
  pullQuote: "The mountain doesn't rush. Neither should the music.",
  seoTitle: "",
  seoDescription: "",
};

function compareBySortThenStableId(
  a: { sort: number; stableId: string },
  b: { sort: number; stableId: string },
): number {
  return a.sort - b.sort || a.stableId.localeCompare(b.stableId);
}

export async function loadAboutContent(
  ctx: QueryCtx | MutationCtx,
  scope: CmsScope,
): Promise<AboutContentDoc | null> {
  return await ctx.db
    .query("aboutContent")
    .withIndex("by_scope", (q) => q.eq("scope", scope))
    .unique();
}

export async function loadAboutHighlights(
  ctx: QueryCtx | MutationCtx,
  scope: CmsScope,
): Promise<AboutHighlightDoc[]> {
  const rows = await ctx.db
    .query("aboutHighlights")
    .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
    .collect();
  rows.sort(compareBySortThenStableId);
  return rows;
}

export async function loadAboutTeamMembers(
  ctx: QueryCtx | MutationCtx,
  scope: CmsScope,
): Promise<AboutTeamMemberDoc[]> {
  const rows = await ctx.db
    .query("aboutTeamMembers")
    .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
    .collect();
  rows.sort(compareBySortThenStableId);
  return rows;
}

export async function loadAboutTree(
  ctx: QueryCtx | MutationCtx,
  scope: CmsScope,
): Promise<AboutTree> {
  const [content, highlights, teamMembers] = await Promise.all([
    loadAboutContent(ctx, scope),
    loadAboutHighlights(ctx, scope),
    loadAboutTeamMembers(ctx, scope),
  ]);
  return { content, highlights, teamMembers };
}

/**
 * Deterministic shape for deep equality between draft and published About
 * trees (matches `normalizeGearTreeForCompare`).
 */
export function normalizeAboutTreeForCompare(tree: AboutTree): unknown {
  const content = tree.content
    ? {
        heroImageStorageId: tree.content.heroImageStorageId ?? null,
        heroTitle: tree.content.heroTitle,
        heroSubtitle: tree.content.heroSubtitle ?? null,
        bodyHtml: tree.content.bodyHtml ?? null,
        bodyBlocks: tree.content.bodyBlocks ?? null,
        pullQuote: tree.content.pullQuote ?? null,
        seoTitle: tree.content.seoTitle ?? null,
        seoDescription: tree.content.seoDescription ?? null,
      }
    : null;

  const highlights = [...tree.highlights]
    .sort(compareBySortThenStableId)
    .map((h) => ({ stableId: h.stableId, text: h.text, sort: h.sort }));

  const teamMembers = [...tree.teamMembers]
    .sort(compareBySortThenStableId)
    .map((m) => ({
      stableId: m.stableId,
      name: m.name,
      title: m.title,
      bio: m.bio ?? "",
      storageId: m.storageId ?? null,
      sort: m.sort,
    }));

  return { content, highlights, teamMembers };
}

export function aboutDraftMatchesPublished(
  draft: AboutTree,
  published: AboutTree,
): boolean {
  return (
    JSON.stringify(normalizeAboutTreeForCompare(draft)) ===
    JSON.stringify(normalizeAboutTreeForCompare(published))
  );
}

/** Delete all About content rows for a scope. */
export async function deleteAllAboutForScope(
  ctx: MutationCtx,
  scope: CmsScope,
): Promise<void> {
  for (;;) {
    const batch = await ctx.db
      .query("aboutHighlights")
      .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
      .take(100);
    if (batch.length === 0) break;
    for (const row of batch) {
      await ctx.db.delete(row._id);
    }
  }
  for (;;) {
    const batch = await ctx.db
      .query("aboutTeamMembers")
      .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
      .take(100);
    if (batch.length === 0) break;
    for (const row of batch) {
      await ctx.db.delete(row._id);
    }
  }
  for (;;) {
    const batch = await ctx.db
      .query("aboutContent")
      .withIndex("by_scope", (q) => q.eq("scope", scope))
      .take(100);
    if (batch.length === 0) break;
    for (const row of batch) {
      await ctx.db.delete(row._id);
    }
  }
}

/**
 * Copy the entire About tree from one scope to another; clears destination
 * first so the result is a pure replacement (mirrors `copyGearScope`).
 */
export async function copyAboutScope(
  ctx: MutationCtx,
  from: CmsScope,
  to: CmsScope,
): Promise<void> {
  await deleteAllAboutForScope(ctx, to);
  const source = await loadAboutTree(ctx, from);

  if (source.content !== null) {
    await ctx.db.insert("aboutContent", {
      scope: to,
      ...(source.content.heroImageStorageId !== undefined
        ? { heroImageStorageId: source.content.heroImageStorageId }
        : {}),
      heroTitle: source.content.heroTitle,
      ...(source.content.heroSubtitle !== undefined
        ? { heroSubtitle: source.content.heroSubtitle }
        : {}),
      ...(source.content.bodyHtml !== undefined
        ? { bodyHtml: source.content.bodyHtml }
        : {}),
      ...(source.content.bodyBlocks !== undefined
        ? { bodyBlocks: source.content.bodyBlocks }
        : {}),
      ...(source.content.pullQuote !== undefined
        ? { pullQuote: source.content.pullQuote }
        : {}),
      ...(source.content.seoTitle !== undefined
        ? { seoTitle: source.content.seoTitle }
        : {}),
      ...(source.content.seoDescription !== undefined
        ? { seoDescription: source.content.seoDescription }
        : {}),
    });
  }

  for (const h of source.highlights) {
    await ctx.db.insert("aboutHighlights", {
      scope: to,
      stableId: h.stableId,
      text: h.text,
      sort: h.sort,
    });
  }

  for (const m of source.teamMembers) {
    await ctx.db.insert("aboutTeamMembers", {
      scope: to,
      stableId: m.stableId,
      name: m.name,
      title: m.title,
      bio: m.bio ?? "",
      ...(m.storageId !== undefined ? { storageId: m.storageId } : {}),
      sort: m.sort,
    });
  }
}

/**
 * Replace the draft-scope About tree with a fresh snapshot-shaped payload.
 * Used by the compatibility `saveDraft` mutation so admin editors can keep
 * calling a single whole-snapshot endpoint while the data is stored per-row.
 */
export async function replaceAboutDraftTree(
  ctx: MutationCtx,
  payload: {
    content: AboutContentScalars;
    highlights: AboutHighlightInput[];
    teamMembers: AboutTeamMemberInput[];
  },
): Promise<void> {
  await deleteAllAboutForScope(ctx, "draft");

  await ctx.db.insert("aboutContent", {
    scope: "draft",
    ...(payload.content.heroImageStorageId !== undefined
      ? { heroImageStorageId: payload.content.heroImageStorageId }
      : {}),
    heroTitle: payload.content.heroTitle,
    ...(payload.content.heroSubtitle !== undefined
      ? { heroSubtitle: payload.content.heroSubtitle }
      : {}),
    ...(payload.content.bodyHtml !== undefined
      ? { bodyHtml: payload.content.bodyHtml }
      : {}),
    ...(payload.content.bodyBlocks !== undefined
      ? { bodyBlocks: payload.content.bodyBlocks }
      : {}),
    ...(payload.content.pullQuote !== undefined
      ? { pullQuote: payload.content.pullQuote }
      : {}),
    ...(payload.content.seoTitle !== undefined
      ? { seoTitle: payload.content.seoTitle }
      : {}),
    ...(payload.content.seoDescription !== undefined
      ? { seoDescription: payload.content.seoDescription }
      : {}),
  });

  for (const h of payload.highlights) {
    await ctx.db.insert("aboutHighlights", {
      scope: "draft",
      stableId: h.stableId,
      text: h.text,
      sort: h.sort,
    });
  }

  for (const m of payload.teamMembers) {
    await ctx.db.insert("aboutTeamMembers", {
      scope: "draft",
      stableId: m.stableId,
      name: m.name,
      title: m.title,
      bio: m.bio,
      ...(m.storageId !== undefined ? { storageId: m.storageId } : {}),
      sort: m.sort,
    });
  }
}

/** Storage ids referenced by any About team headshot within the given scope. */
export function collectAboutTeamStorageIdsFromTree(
  tree: AboutTree,
): Set<Id<"_storage">> {
  const out = new Set<Id<"_storage">>();
  if (tree.content?.heroImageStorageId !== undefined) {
    out.add(tree.content.heroImageStorageId);
  }
  for (const m of tree.teamMembers) {
    if (m.storageId !== undefined) out.add(m.storageId);
  }
  return out;
}
