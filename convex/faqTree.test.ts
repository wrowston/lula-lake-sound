import { describe, expect, test } from "bun:test";
import type { Doc } from "./_generated/dataModel";
import {
  faqDraftMatchesPublished,
  materializeFaqCategories,
  type FaqTree,
} from "./faqTree";

function mockCategory(
  overrides: Partial<Doc<"faqCategories">> &
    Pick<Doc<"faqCategories">, "stableId" | "title" | "sort" | "scope">,
): Doc<"faqCategories"> {
  return {
    _id: "c" as Doc<"faqCategories">["_id"],
    _creationTime: 0,
    ...overrides,
  } as Doc<"faqCategories">;
}

function mockQuestion(
  overrides: Partial<Doc<"faqQuestions">> &
    Pick<
      Doc<"faqQuestions">,
      "stableId" | "categoryStableId" | "sort" | "scope" | "question" | "answer"
    >,
): Doc<"faqQuestions"> {
  return {
    _id: "q" as Doc<"faqQuestions">["_id"],
    _creationTime: 0,
    ...overrides,
  } as Doc<"faqQuestions">;
}

describe("faqDraftMatchesPublished", () => {
  test("identical trees match", () => {
    const tree: FaqTree = {
      categories: [
        mockCategory({
          scope: "draft",
          stableId: "a",
          title: "A",
          sort: 0,
        }),
      ],
      questions: [
        mockQuestion({
          scope: "draft",
          stableId: "q1",
          categoryStableId: "a",
          sort: 0,
          question: "Q?",
          answer: "A.",
        }),
      ],
    };
    expect(faqDraftMatchesPublished(tree, tree)).toBe(true);
  });

  test("different answer text does not match", () => {
    const a: FaqTree = {
      categories: [
        mockCategory({ scope: "draft", stableId: "a", title: "A", sort: 0 }),
      ],
      questions: [
        mockQuestion({
          scope: "draft",
          stableId: "q1",
          categoryStableId: "a",
          sort: 0,
          question: "Q?",
          answer: "One",
        }),
      ],
    };
    const b: FaqTree = {
      categories: [
        mockCategory({ scope: "published", stableId: "a", title: "A", sort: 0 }),
      ],
      questions: [
        mockQuestion({
          scope: "published",
          stableId: "q1",
          categoryStableId: "a",
          sort: 0,
          question: "Q?",
          answer: "Two",
        }),
      ],
    };
    expect(faqDraftMatchesPublished(a, b)).toBe(false);
  });
});

describe("materializeFaqCategories", () => {
  test("orders categories and questions by sort", () => {
    const tree: FaqTree = {
      categories: [
        mockCategory({
          scope: "published",
          stableId: "second",
          title: "Second",
          sort: 1,
        }),
        mockCategory({
          scope: "published",
          stableId: "first",
          title: "First",
          sort: 0,
        }),
      ],
      questions: [
        mockQuestion({
          scope: "published",
          stableId: "q_b",
          categoryStableId: "first",
          sort: 1,
          question: "B",
          answer: "b",
        }),
        mockQuestion({
          scope: "published",
          stableId: "q_a",
          categoryStableId: "first",
          sort: 0,
          question: "A",
          answer: "a",
        }),
      ],
    };
    const out = materializeFaqCategories(tree);
    expect(out.map((c) => c.stableId)).toEqual(["first", "second"]);
    expect(out[0].questions.map((q) => q.stableId)).toEqual(["q_a", "q_b"]);
  });
});
