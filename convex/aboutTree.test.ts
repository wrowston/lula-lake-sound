import { describe, expect, test } from "bun:test";
import type { Doc, Id } from "./_generated/dataModel";
import {
  ABOUT_CONTENT_DEFAULTS,
  aboutDraftMatchesPublished,
  collectAboutTeamStorageIdsFromTree,
  normalizeAboutTreeForCompare,
  type AboutTree,
} from "./aboutTree";

type ContentDoc = Doc<"aboutContent">;
type HighlightDoc = Doc<"aboutHighlights">;
type TeamMemberDoc = Doc<"aboutTeamMembers">;

const baseDoc = {
  _id: "row" as unknown as Id<"aboutContent">,
  _creationTime: 0,
};

function contentDoc(patch: Partial<ContentDoc> = {}): ContentDoc {
  return {
    ...baseDoc,
    scope: "draft",
    heroTitle: "Hello",
    ...patch,
  } as ContentDoc;
}

function highlight(patch: Partial<HighlightDoc> = {}): HighlightDoc {
  return {
    ...baseDoc,
    _id: `h-${patch.stableId ?? "x"}` as unknown as Id<"aboutHighlights">,
    scope: "draft",
    stableId: "h1",
    text: "one",
    sort: 0,
    ...patch,
  } as HighlightDoc;
}

function member(patch: Partial<TeamMemberDoc> = {}): TeamMemberDoc {
  return {
    ...baseDoc,
    _id: `m-${patch.stableId ?? "x"}` as unknown as Id<"aboutTeamMembers">,
    scope: "draft",
    stableId: "m1",
    name: "Alice",
    title: "Engineer",
    sort: 0,
    ...patch,
  } as TeamMemberDoc;
}

function emptyTree(patch: Partial<AboutTree> = {}): AboutTree {
  return {
    content: null,
    highlights: [],
    teamMembers: [],
    ...patch,
  };
}

describe("ABOUT_CONTENT_DEFAULTS", () => {
  test("ships a hero title and a paragraph body block", () => {
    expect(ABOUT_CONTENT_DEFAULTS.heroTitle.length).toBeGreaterThan(0);
    expect(ABOUT_CONTENT_DEFAULTS.bodyBlocks?.[0].type).toBe("paragraph");
  });
});

describe("normalizeAboutTreeForCompare", () => {
  test("returns null content when tree is empty", () => {
    const shape = normalizeAboutTreeForCompare(emptyTree());
    expect((shape as { content: unknown }).content).toBeNull();
  });

  test("coerces missing optional fields to null for stability", () => {
    const tree = emptyTree({ content: contentDoc() });
    const shape = normalizeAboutTreeForCompare(tree) as {
      content: Record<string, unknown>;
    };
    expect(shape.content.heroSubtitle).toBeNull();
    expect(shape.content.bodyHtml).toBeNull();
    expect(shape.content.bodyBlocks).toBeNull();
    expect(shape.content.pullQuote).toBeNull();
    expect(shape.content.heroImageStorageId).toBeNull();
  });

  test("sorts highlights by sort, ties broken by stableId", () => {
    const tree = emptyTree({
      highlights: [
        highlight({ stableId: "b", sort: 1 }),
        highlight({ stableId: "a", sort: 1 }),
        highlight({ stableId: "c", sort: 0 }),
      ],
    });
    const shape = normalizeAboutTreeForCompare(tree) as {
      highlights: { stableId: string }[];
    };
    expect(shape.highlights.map((h) => h.stableId)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  test("team members normalize storageId to null when absent", () => {
    const tree = emptyTree({ teamMembers: [member()] });
    const shape = normalizeAboutTreeForCompare(tree) as {
      teamMembers: { storageId: unknown }[];
    };
    expect(shape.teamMembers[0].storageId).toBeNull();
  });
});

describe("aboutDraftMatchesPublished", () => {
  test("matches empty draft + published trees", () => {
    expect(aboutDraftMatchesPublished(emptyTree(), emptyTree())).toBe(true);
  });

  test("matches identical populated trees", () => {
    const h = highlight({ stableId: "h", text: "cool", sort: 1 });
    const m = member({ stableId: "m", name: "A", title: "B" });
    const c = contentDoc();
    const tree: AboutTree = {
      content: c,
      highlights: [h],
      teamMembers: [m],
    };
    expect(aboutDraftMatchesPublished(tree, tree)).toBe(true);
  });

  test("mismatched heroTitle is not equal", () => {
    const a: AboutTree = { content: contentDoc({ heroTitle: "A" }), highlights: [], teamMembers: [] };
    const b: AboutTree = { content: contentDoc({ heroTitle: "B" }), highlights: [], teamMembers: [] };
    expect(aboutDraftMatchesPublished(a, b)).toBe(false);
  });

  test("highlight reorder does not affect equality when sort is the same", () => {
    const a: AboutTree = {
      content: null,
      highlights: [
        highlight({ stableId: "b", sort: 0 }),
        highlight({ stableId: "a", sort: 0 }),
      ],
      teamMembers: [],
    };
    const b: AboutTree = {
      content: null,
      highlights: [
        highlight({ stableId: "a", sort: 0 }),
        highlight({ stableId: "b", sort: 0 }),
      ],
      teamMembers: [],
    };
    // Normalization sorts by stableId when sort ties → equal trees.
    expect(aboutDraftMatchesPublished(a, b)).toBe(true);
  });
});

describe("collectAboutTeamStorageIdsFromTree", () => {
  const sid = (s: string) => s as unknown as Id<"_storage">;

  test("empty set for a tree without hero image or team members", () => {
    const ids = collectAboutTeamStorageIdsFromTree(emptyTree());
    expect(ids.size).toBe(0);
  });

  test("collects hero image storageId", () => {
    const tree: AboutTree = {
      content: contentDoc({ heroImageStorageId: sid("hero") }),
      highlights: [],
      teamMembers: [],
    };
    const ids = collectAboutTeamStorageIdsFromTree(tree);
    expect(ids.has(sid("hero"))).toBe(true);
    expect(ids.size).toBe(1);
  });

  test("collects team headshot storageIds (dedupes with hero)", () => {
    const tree: AboutTree = {
      content: contentDoc({ heroImageStorageId: sid("shared") }),
      highlights: [],
      teamMembers: [
        member({ stableId: "m1", storageId: sid("m1") }),
        member({ stableId: "m2", storageId: sid("shared") }),
        member({ stableId: "m3" }),
      ],
    };
    const ids = collectAboutTeamStorageIdsFromTree(tree);
    expect(ids.size).toBe(2);
    expect(ids.has(sid("m1"))).toBe(true);
    expect(ids.has(sid("shared"))).toBe(true);
  });
});
