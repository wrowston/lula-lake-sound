import { describe, expect, test } from "bun:test";
import {
  blocksToHtml,
  collectAboutIssues,
  escapeHtml,
  htmlToPlainText,
  toAboutContent,
  trimToUndefined,
  type AboutTeamMemberRow,
} from "./about-editor";

describe("trimToUndefined", () => {
  test("non-empty string passes through verbatim (original value, not trimmed)", () => {
    // Implementation returns `value`, not `trimmed`, so leading/trailing
    // spaces are retained — only fully-empty values collapse to undefined.
    expect(trimToUndefined("  Hello  ")).toBe("  Hello  ");
  });

  test("empty and whitespace-only → undefined", () => {
    expect(trimToUndefined("")).toBeUndefined();
    expect(trimToUndefined("   ")).toBeUndefined();
  });
});

describe("escapeHtml", () => {
  test("escapes the standard HTML entities", () => {
    expect(escapeHtml("<a href=\"x\">'&'</a>")).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    );
  });

  test("safe plain text is unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

describe("blocksToHtml", () => {
  test("empty array returns empty string", () => {
    expect(blocksToHtml([])).toBe("");
  });

  test("paragraphs render as <p>", () => {
    expect(blocksToHtml([{ type: "paragraph", text: "Hi" }])).toBe("<p>Hi</p>");
  });

  test("headings render as <h2>", () => {
    expect(blocksToHtml([{ type: "heading", text: "Hi" }])).toBe("<h2>Hi</h2>");
  });

  test("block text is html-escaped", () => {
    expect(blocksToHtml([{ type: "paragraph", text: "<b>x</b>" }])).toBe(
      "<p>&lt;b&gt;x&lt;/b&gt;</p>",
    );
  });
});

describe("htmlToPlainText", () => {
  test("strips tags (collapsing is left to the caller)", () => {
    // Each tag becomes a single space, which keeps word boundaries.
    expect(htmlToPlainText("<p>Hello <b>world</b></p>")).toBe("Hello  world");
  });

  test("decodes common named entities", () => {
    expect(htmlToPlainText("<p>a&amp;b</p>")).toBe("a&b");
    expect(htmlToPlainText("<p>&lt;x&gt;</p>")).toBe("<x>");
    expect(htmlToPlainText("<p>a&nbsp;b</p>")).toBe("a b");
  });

  test("empty string stays empty", () => {
    expect(htmlToPlainText("")).toBe("");
  });
});

describe("toAboutContent", () => {
  test("undefined input yields safe defaults", () => {
    const c = toAboutContent(undefined);
    expect(c.heroTitle).toBe("");
    expect(c.body).toEqual([]);
    expect(c.teamMembers).toEqual([]);
    expect(c.bodyHtml).toBeUndefined();
  });

  test("promotes legacy body blocks to bodyHtml", () => {
    const c = toAboutContent({
      heroTitle: "Hi",
      body: [{ type: "paragraph", text: "Hello" }],
    });
    expect(c.bodyHtml).toBe("<p>Hello</p>");
    expect(c.body).toEqual([{ type: "paragraph", text: "Hello" }]);
  });

  test("prefers stored bodyHtml over legacy blocks", () => {
    const c = toAboutContent({
      heroTitle: "Hi",
      bodyHtml: "<p>Stored</p>",
      body: [{ type: "paragraph", text: "Legacy" }],
    });
    expect(c.bodyHtml).toBe("<p>Stored</p>");
  });

  test("filters out malformed body blocks", () => {
    const c = toAboutContent({
      heroTitle: "Hi",
      body: [
        { type: "paragraph", text: "ok" },
        null,
        { type: "bogus", text: "skip" },
        { type: "paragraph" },
      ],
    });
    expect(c.body).toEqual([{ type: "paragraph", text: "ok" }]);
  });

  test("filters out malformed team members", () => {
    const c = toAboutContent({
      heroTitle: "Hi",
      teamMembers: [
        { id: "a", name: "Alice", title: "Engineer", bio: "Builds records." },
        { id: "b" },
        null,
        { id: "c", name: 1, title: "x" },
      ],
    });
    expect(c.teamMembers).toEqual([
      { id: "a", name: "Alice", title: "Engineer", bio: "Builds records." },
    ]);
  });

  test("defaults missing legacy team member bio to an empty string", () => {
    const c = toAboutContent({
      heroTitle: "Hi",
      teamMembers: [{ id: "a", name: "Alice", title: "Engineer" }],
    });
    expect(c.teamMembers).toEqual([
      { id: "a", name: "Alice", title: "Engineer", bio: "" },
    ]);
  });

  test("pullQuote empty string becomes undefined", () => {
    const c = toAboutContent({
      heroTitle: "Hi",
      pullQuote: "   ",
    });
    expect(c.pullQuote).toBeUndefined();
  });

  test("string highlights are retained", () => {
    const c = toAboutContent({
      heroTitle: "Hi",
      highlights: ["a", "b", 1],
    });
    expect(c.highlights).toEqual(["a", "b"]);
  });
});

describe("collectAboutIssues", () => {
  function content(
    patch: Partial<Parameters<typeof collectAboutIssues>[0]> = {},
  ) {
    return {
      heroTitle: "About",
      bodyHtml: "<p>Body content here</p>",
      body: [],
      highlights: [] as string[],
      teamMembers: [] as AboutTeamMemberRow[],
      ...patch,
    };
  }

  test("valid draft returns no issues", () => {
    expect(collectAboutIssues(content())).toEqual([]);
  });

  test("missing hero title reported", () => {
    const issues = collectAboutIssues(content({ heroTitle: "   " }));
    expect(issues.some((i) => i.path === "heroTitle")).toBe(true);
  });

  test("empty body html reported", () => {
    const issues = collectAboutIssues(content({ bodyHtml: "" }));
    expect(issues.some((i) => i.path === "bodyHtml")).toBe(true);
  });

  test("empty highlights reported (per-row)", () => {
    const issues = collectAboutIssues(content({ highlights: ["ok", "   "] }));
    expect(issues.some((i) => i.path === "highlights[1]")).toBe(true);
    expect(issues.some((i) => i.path === "highlights[0]")).toBe(false);
  });

  test("team member missing storageId / name / title / bio reported", () => {
    const team: AboutTeamMemberRow[] = [
      { id: "a", name: "", title: "", bio: "" },
    ];
    const issues = collectAboutIssues(content({ teamMembers: team }));
    const paths = issues.map((i) => i.path);
    expect(paths).toContain("teamMembers[0].name");
    expect(paths).toContain("teamMembers[0].title");
    expect(paths).toContain("teamMembers[0].bio");
    expect(paths).toContain("teamMembers[0].storageId");
  });

  test("over-cap team members reported", () => {
    const team: AboutTeamMemberRow[] = Array.from({ length: 21 }, (_, i) => ({
      id: `p-${i}`,
      name: `N${i}`,
      title: "T",
      bio: "Short bio",
      storageId: "st-x" as never,
    }));
    const issues = collectAboutIssues(content({ teamMembers: team }));
    expect(issues.some((i) => i.path === "teamMembers")).toBe(true);
  });
});
