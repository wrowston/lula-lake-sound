import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { ConvexReactClient } from "convex/react";
import type { FunctionReference } from "convex/server";
import { api } from "@convex/_generated/api";
import {
  PREWARM_DEBOUNCE_MS,
  PREWARM_DEDUPE_MS,
  PREWARM_EXTEND_MS,
  buildQueryKey,
  createRoutePrewarmIntent,
  makeRouteQuerySpec,
  prewarmAdminNavigation,
  prewarmSpecs,
  resetPrewarmDedupeForTests,
} from "@/lib/route-prewarm";

type PrewarmArgs = {
  query: FunctionReference<"query">;
  args: unknown;
  extendSubscriptionFor: number;
};

function makeFakeClient() {
  const prewarmQuery = mock((_args: PrewarmArgs) => {
    void _args;
  });
  return {
    prewarmQuery,
    client: { prewarmQuery } as unknown as ConvexReactClient,
  };
}

describe("prewarm constants", () => {
  test("are reasonable positive numbers", () => {
    expect(PREWARM_DEBOUNCE_MS).toBeGreaterThan(0);
    expect(PREWARM_DEDUPE_MS).toBeGreaterThan(0);
    expect(PREWARM_EXTEND_MS).toBeGreaterThan(PREWARM_DEDUPE_MS);
  });
});

describe("buildQueryKey", () => {
  test("produces a stable string per (name, args) tuple", () => {
    const a = buildQueryKey("api.foo.bar", { x: 1 });
    const b = buildQueryKey("api.foo.bar", { x: 1 });
    expect(a).toBe(b);
  });

  test("differs when args differ", () => {
    const a = buildQueryKey("api.foo.bar", { x: 1 });
    const b = buildQueryKey("api.foo.bar", { x: 2 });
    expect(a).not.toBe(b);
  });
});

describe("makeRouteQuerySpec", () => {
  test("returns a spec with a consistent key", () => {
    const spec = makeRouteQuerySpec(api.cms.getSection, {
      section: "pricing",
    });
    expect(spec.query).toEqual(api.cms.getSection);
    expect(spec.args).toEqual({ section: "pricing" });
    expect(spec.key).toContain("pricing");
  });
});

describe("prewarmSpecs", () => {
  beforeEach(() => {
    resetPrewarmDedupeForTests();
  });

  test("calls convex.prewarmQuery for each spec", () => {
    const { client, prewarmQuery } = makeFakeClient();
    const specs = [
      makeRouteQuerySpec(api.cms.getSection, { section: "about" }),
      makeRouteQuerySpec(api.cms.listMarketingFlagsDraft, {}),
    ];
    prewarmSpecs(client, specs);
    expect(prewarmQuery.mock.calls.length).toBe(2);
  });

  test("dedupes calls that reuse the same key within the window", () => {
    const { client, prewarmQuery } = makeFakeClient();
    const spec = makeRouteQuerySpec(api.cms.getSection, { section: "about" });
    prewarmSpecs(client, [spec]);
    prewarmSpecs(client, [spec]);
    expect(prewarmQuery.mock.calls.length).toBe(1);
  });

  test("dedupe can be overridden to 0 so repeat calls still fire", () => {
    const { client, prewarmQuery } = makeFakeClient();
    const spec = makeRouteQuerySpec(api.cms.getSection, { section: "about" });
    prewarmSpecs(client, [spec], { dedupeMs: 0 });
    prewarmSpecs(client, [spec], { dedupeMs: 0 });
    expect(prewarmQuery.mock.calls.length).toBe(2);
  });

  test("swallows errors thrown by convex.prewarmQuery (non-fatal)", () => {
    const prewarmQuery = mock((_args: PrewarmArgs): void => {
      void _args;
      throw new Error("network down");
    });
    const client = { prewarmQuery } as unknown as ConvexReactClient;
    const spec = makeRouteQuerySpec(api.cms.getSection, { section: "about" });
    expect(() => prewarmSpecs(client, [spec])).not.toThrow();
  });

  test("passes extendSubscriptionFor through", () => {
    const { client, prewarmQuery } = makeFakeClient();
    const spec = makeRouteQuerySpec(api.cms.getSection, { section: "about" });
    prewarmSpecs(client, [spec], { extendSubscriptionFor: 1234 });
    expect(prewarmQuery.mock.calls[0][0].extendSubscriptionFor).toBe(1234);
  });
});

describe("prewarmAdminNavigation", () => {
  beforeEach(() => {
    resetPrewarmDedupeForTests();
  });

  test("no-op for unknown href", () => {
    const { client, prewarmQuery } = makeFakeClient();
    prewarmAdminNavigation(client, "/admin/settings/legacy");
    expect(prewarmQuery.mock.calls.length).toBe(0);
  });

  test("prewarms pricing (draft rows + marketing flags)", () => {
    const { client, prewarmQuery } = makeFakeClient();
    prewarmAdminNavigation(client, "/admin/pricing");
    expect(prewarmQuery.mock.calls.length).toBe(2);
  });

  test("prewarms settings once", () => {
    const { client, prewarmQuery } = makeFakeClient();
    prewarmAdminNavigation(client, "/admin/settings");
    expect(prewarmQuery.mock.calls.length).toBe(1);
  });

  test("prewarms contact submissions list", () => {
    const { client, prewarmQuery } = makeFakeClient();
    prewarmAdminNavigation(client, "/admin/inquiries");
    expect(prewarmQuery.mock.calls.length).toBe(1);
    expect(prewarmQuery.mock.calls[0][0].query).toEqual(
      api.admin.inquiries.listForAdmin,
    );
  });

  test("prewarms about (section + marketing flags only)", () => {
    const { client, prewarmQuery } = makeFakeClient();
    prewarmAdminNavigation(client, "/admin/about");
    expect(prewarmQuery.mock.calls.length).toBe(2);
  });

  test("prewarms audio (tracks + marketing flags)", () => {
    const { client, prewarmQuery } = makeFakeClient();
    prewarmAdminNavigation(client, "/admin/audio");
    expect(prewarmQuery.mock.calls.length).toBe(2);
  });

  test("prewarms media routes with their draft lists", () => {
    const { client, prewarmQuery } = makeFakeClient();
    prewarmAdminNavigation(client, "/admin/photos");
    prewarmAdminNavigation(client, "/admin/videos");
    expect(prewarmQuery.mock.calls.length).toBe(2);
  });

  test("prewarms amenities data and validation", () => {
    const { client, prewarmQuery } = makeFakeClient();
    prewarmAdminNavigation(client, "/admin/amenities-nearby");
    expect(prewarmQuery.mock.calls.length).toBe(2);
  });
});

describe("createRoutePrewarmIntent", () => {
  const realTimeout = globalThis.setTimeout;
  const realClearTimeout = globalThis.clearTimeout;
  let scheduled: Array<{
    id: number;
    fn: () => void;
    ms: number;
  }> = [];
  let nextId = 1;

  beforeEach(() => {
    scheduled = [];
    nextId = 1;
    (globalThis as unknown as {
      setTimeout: typeof setTimeout;
    }).setTimeout = ((fn: () => void, ms: number) => {
      const id = nextId++;
      scheduled.push({ id, fn, ms });
      return id as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;
    (globalThis as unknown as {
      clearTimeout: typeof clearTimeout;
    }).clearTimeout = ((id: number | undefined) => {
      if (typeof id !== "number") return;
      scheduled = scheduled.filter((s) => s.id !== id);
    }) as typeof clearTimeout;
  });

  afterEach(() => {
    (globalThis as unknown as { setTimeout: typeof setTimeout }).setTimeout =
      realTimeout;
    (
      globalThis as unknown as { clearTimeout: typeof clearTimeout }
    ).clearTimeout = realClearTimeout;
  });

  test("hovering schedules the prewarm after the debounce", () => {
    const prewarm = mock(() => {});
    const { handlers } = createRoutePrewarmIntent(prewarm, { debounceMs: 25 });
    handlers.onMouseEnter();
    expect(prewarm.mock.calls.length).toBe(0);
    expect(scheduled.length).toBe(1);
    scheduled[0].fn();
    expect(prewarm.mock.calls.length).toBe(1);
  });

  test("mouseleave before the timeout cancels the scheduled prewarm", () => {
    const prewarm = mock(() => {});
    const { handlers } = createRoutePrewarmIntent(prewarm, { debounceMs: 25 });
    handlers.onMouseEnter();
    handlers.onMouseLeave();
    expect(scheduled.length).toBe(0);
    expect(prewarm.mock.calls.length).toBe(0);
  });

  test("blur cancels a pending intent", () => {
    const prewarm = mock(() => {});
    const { handlers } = createRoutePrewarmIntent(prewarm, { debounceMs: 25 });
    handlers.onFocus();
    handlers.onBlur();
    expect(scheduled.length).toBe(0);
  });

  test("re-schedule while one is pending is a no-op (idempotent)", () => {
    const prewarm = mock(() => {});
    const { handlers } = createRoutePrewarmIntent(prewarm, { debounceMs: 25 });
    handlers.onMouseEnter();
    handlers.onMouseEnter();
    expect(scheduled.length).toBe(1);
  });
});
