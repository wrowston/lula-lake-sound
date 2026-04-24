import { describe, expect, test } from "bun:test";
import type { Doc, Id } from "./_generated/dataModel";
import {
  buildSortedGearTreeGroups,
  gearDraftMatchesPublished,
  mapSortedGearTree,
  normalizeGearTreeForCompare,
} from "./gearTree";

type CategoryDoc = Doc<"gearCategories">;
type ItemDoc = Doc<"gearItems">;

function category(patch: Partial<CategoryDoc> = {}): CategoryDoc {
  return {
    _id: `cat-${patch.stableId ?? "x"}` as unknown as Id<"gearCategories">,
    _creationTime: 0,
    scope: "draft",
    stableId: "cat_1",
    name: "Microphones",
    sort: 0,
    ...patch,
  } as CategoryDoc;
}

function item(patch: Partial<ItemDoc> = {}): ItemDoc {
  return {
    _id: `it-${patch.stableId ?? "x"}` as unknown as Id<"gearItems">,
    _creationTime: 0,
    scope: "draft",
    stableId: "it_1",
    categoryStableId: "cat_1",
    name: "Neumann U87",
    sort: 0,
    specs: { kind: "markdown", text: "Legendary." } as ItemDoc["specs"],
    ...patch,
  } as ItemDoc;
}

describe("buildSortedGearTreeGroups", () => {
  test("groups items by category and sorts groups", () => {
    const cats = [
      category({ stableId: "b", sort: 1 }),
      category({ stableId: "a", sort: 0 }),
    ];
    const items = [
      item({ stableId: "a1", categoryStableId: "a", sort: 0 }),
      item({ stableId: "b2", categoryStableId: "b", sort: 1 }),
      item({ stableId: "b1", categoryStableId: "b", sort: 0 }),
    ];
    const groups = buildSortedGearTreeGroups(cats, items);
    expect(groups.map((g) => g.category.stableId)).toEqual(["a", "b"]);
    expect(groups[1].items.map((i) => i.stableId)).toEqual(["b1", "b2"]);
  });

  test("category with no items gets an empty group list", () => {
    const groups = buildSortedGearTreeGroups([category()], []);
    expect(groups.length).toBe(1);
    expect(groups[0].items).toEqual([]);
  });
});

describe("mapSortedGearTree", () => {
  test("maps each item through the supplied mapper", () => {
    const cats = [category({ stableId: "a" })];
    const items = [item({ stableId: "a1", categoryStableId: "a" })];
    const rows = mapSortedGearTree(cats, items, (i) => i.stableId);
    expect(rows).toEqual([
      { stableId: "a", name: "Microphones", sort: 0, items: ["a1"] },
    ]);
  });
});

describe("normalizeGearTreeForCompare", () => {
  test("sorts items by (category, sort, stableId) and fills missing url with null", () => {
    const cats = [category({ stableId: "a" })];
    const items = [
      item({ stableId: "z", categoryStableId: "a", sort: 1 }),
      item({ stableId: "y", categoryStableId: "a", sort: 0 }),
    ];
    const shape = normalizeGearTreeForCompare(cats, items) as {
      items: { stableId: string; url: unknown }[];
    };
    expect(shape.items.map((i) => i.stableId)).toEqual(["y", "z"]);
    expect(shape.items[0].url).toBeNull();
  });

  test("normalizes kv specs by key for deterministic compare", () => {
    const cats = [category({ stableId: "a" })];
    const items = [
      item({
        stableId: "i",
        categoryStableId: "a",
        specs: {
          kind: "kv",
          pairs: [
            { key: "b", value: "2" },
            { key: "a", value: "1" },
          ],
        },
      }),
    ];
    const shape = normalizeGearTreeForCompare(cats, items) as {
      items: Array<{ specs: { kind: string; pairs: Array<{ key: string }> } }>;
    };
    expect(shape.items[0].specs.pairs.map((p) => p.key)).toEqual(["a", "b"]);
  });
});

describe("gearDraftMatchesPublished", () => {
  test("two empty trees match", () => {
    expect(
      gearDraftMatchesPublished(
        { categories: [], items: [] },
        { categories: [], items: [] },
      ),
    ).toBe(true);
  });

  test("identical populated trees match", () => {
    const cats = [category()];
    const items = [item()];
    expect(
      gearDraftMatchesPublished(
        { categories: cats, items },
        { categories: cats, items },
      ),
    ).toBe(true);
  });

  test("different item name is not a match", () => {
    const cats = [category()];
    expect(
      gearDraftMatchesPublished(
        { categories: cats, items: [item({ name: "A" })] },
        { categories: cats, items: [item({ name: "B" })] },
      ),
    ).toBe(false);
  });
});
