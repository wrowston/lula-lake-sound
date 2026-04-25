import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { Infer } from "convex/values";
import type { faqCategoryValidator, faqContentValidator } from "./schema.shared";

export type CmsScope = "draft" | "published";

export type FaqCategoryInput = Infer<typeof faqCategoryValidator>;
export type FaqContentSnapshot = Infer<typeof faqContentValidator>;

type FaqCategoryDoc = Doc<"faqCategories">;
type FaqQuestionDoc = Doc<"faqQuestions">;

export type FaqTree = {
  categories: FaqCategoryDoc[];
  questions: FaqQuestionDoc[];
};

function compareBySortThenStableId(
  a: { sort: number; stableId: string },
  b: { sort: number; stableId: string },
): number {
  return a.sort - b.sort || a.stableId.localeCompare(b.stableId);
}

export async function loadFaqCategories(
  ctx: QueryCtx | MutationCtx,
  scope: CmsScope,
): Promise<FaqCategoryDoc[]> {
  const rows = await ctx.db
    .query("faqCategories")
    .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
    .collect();
  rows.sort(compareBySortThenStableId);
  return rows;
}

export async function loadFaqQuestions(
  ctx: QueryCtx | MutationCtx,
  scope: CmsScope,
): Promise<FaqQuestionDoc[]> {
  const rows = await ctx.db
    .query("faqQuestions")
    .withIndex("by_scope_and_stableId", (q) => q.eq("scope", scope))
    .collect();
  rows.sort((a, b) => {
    const cat = a.categoryStableId.localeCompare(b.categoryStableId);
    if (cat !== 0) return cat;
    return compareBySortThenStableId(a, b);
  });
  return rows;
}

export async function loadFaqTree(
  ctx: QueryCtx | MutationCtx,
  scope: CmsScope,
): Promise<FaqTree> {
  const [categories, questions] = await Promise.all([
    loadFaqCategories(ctx, scope),
    loadFaqQuestions(ctx, scope),
  ]);
  return { categories, questions };
}

export function normalizeFaqTreeForCompare(tree: FaqTree): unknown {
  const categories = [...tree.categories]
    .sort(compareBySortThenStableId)
    .map((c) => ({
      stableId: c.stableId,
      title: c.title,
      sort: c.sort,
    }));
  const questions = [...tree.questions]
    .sort((a, b) => {
      const cat = a.categoryStableId.localeCompare(b.categoryStableId);
      if (cat !== 0) return cat;
      return compareBySortThenStableId(a, b);
    })
    .map((q) => ({
      stableId: q.stableId,
      categoryStableId: q.categoryStableId,
      question: q.question,
      answer: q.answer,
      sort: q.sort,
    }));
  return { categories, questions };
}

export function faqDraftMatchesPublished(
  draft: FaqTree,
  published: FaqTree,
): boolean {
  return (
    JSON.stringify(normalizeFaqTreeForCompare(draft)) ===
    JSON.stringify(normalizeFaqTreeForCompare(published))
  );
}

export async function deleteAllFaqForScope(
  ctx: MutationCtx,
  scope: CmsScope,
): Promise<void> {
  for (;;) {
    const batch = await ctx.db
      .query("faqQuestions")
      .withIndex("by_scope_and_stableId", (q) => q.eq("scope", scope))
      .take(100);
    if (batch.length === 0) break;
    for (const row of batch) {
      await ctx.db.delete(row._id);
    }
  }
  for (;;) {
    const batch = await ctx.db
      .query("faqCategories")
      .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
      .take(100);
    if (batch.length === 0) break;
    for (const row of batch) {
      await ctx.db.delete(row._id);
    }
  }
}

export async function copyFaqScope(
  ctx: MutationCtx,
  from: CmsScope,
  to: CmsScope,
): Promise<void> {
  await deleteAllFaqForScope(ctx, to);
  const source = await loadFaqTree(ctx, from);

  for (const c of source.categories) {
    await ctx.db.insert("faqCategories", {
      scope: to,
      stableId: c.stableId,
      title: c.title,
      sort: c.sort,
    });
  }
  for (const q of source.questions) {
    await ctx.db.insert("faqQuestions", {
      scope: to,
      stableId: q.stableId,
      categoryStableId: q.categoryStableId,
      sort: q.sort,
      question: q.question,
      answer: q.answer,
    });
  }
}

export async function replaceFaqScopeFromCategories(
  ctx: MutationCtx,
  scope: CmsScope,
  categories: FaqCategoryInput[],
): Promise<void> {
  await deleteAllFaqForScope(ctx, scope);

  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    await ctx.db.insert("faqCategories", {
      scope,
      stableId: cat.stableId,
      title: cat.title,
      sort: ci,
    });
    for (let qi = 0; qi < cat.questions.length; qi++) {
      const q = cat.questions[qi];
      await ctx.db.insert("faqQuestions", {
        scope,
        stableId: q.stableId,
        categoryStableId: cat.stableId,
        sort: qi,
        question: q.question,
        answer: q.answer,
      });
    }
  }
}

export async function replaceFaqDraftFromCategories(
  ctx: MutationCtx,
  categories: FaqCategoryInput[],
): Promise<void> {
  await replaceFaqScopeFromCategories(ctx, "draft", categories);
}

export type PublicFaqQuestion = {
  stableId: string;
  question: string;
  answer: string;
};

export type PublicFaqCategory = {
  stableId: string;
  title: string;
  questions: PublicFaqQuestion[];
};

/**
 * Fold scoped rows into nested categories for public / preview loaders.
 */
export function materializeFaqCategories(tree: FaqTree): PublicFaqCategory[] {
  const orderedCats = [...tree.categories].sort(compareBySortThenStableId);
  const out: PublicFaqCategory[] = [];

  for (const cat of orderedCats) {
    const qs = tree.questions
      .filter((q) => q.categoryStableId === cat.stableId)
      .sort(compareBySortThenStableId)
      .map((q) => ({
        stableId: q.stableId,
        question: q.question,
        answer: q.answer,
      }));
    out.push({
      stableId: cat.stableId,
      title: cat.title,
      questions: qs,
    });
  }

  return out;
}
