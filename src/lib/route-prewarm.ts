"use client";

import { convexToJson, type Value } from "convex/values";
import { getFunctionName } from "convex/server";
import type { ConvexReactClient } from "convex/react";
import type { FunctionArgs, FunctionReference } from "convex/server";
import { useCallback, useMemo, useRef } from "react";
import { api } from "@convex/_generated/api";

export const PREWARM_DEBOUNCE_MS = 120;
export const PREWARM_EXTEND_MS = 8_000;
export const PREWARM_DEDUPE_MS = 3_000;

export type RouteQuerySpec<Query extends FunctionReference<"query">> = {
  query: Query;
  args: FunctionArgs<Query>;
  key: string;
};

export function buildQueryKey(queryName: string, args: unknown): string {
  return `${queryName}:${JSON.stringify(convexToJson(args as Value))}`;
}

export function makeRouteQuerySpec<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>,
): RouteQuerySpec<Query> {
  return {
    query,
    args,
    key: buildQueryKey(getFunctionName(query), args),
  };
}

type PrewarmSpecsOptions = {
  dedupeMs?: number;
  extendSubscriptionFor?: number;
};

const lastPrewarmedAt = new Map<string, number>();

export function prewarmSpecs(
  convex: ConvexReactClient,
  specs: RouteQuerySpec<FunctionReference<"query">>[],
  options: PrewarmSpecsOptions = {},
) {
  const dedupeMs = options.dedupeMs ?? PREWARM_DEDUPE_MS;
  const extendSubscriptionFor =
    options.extendSubscriptionFor ?? PREWARM_EXTEND_MS;
  const now = Date.now();

  for (const spec of specs) {
    const previous = lastPrewarmedAt.get(spec.key);
    if (previous !== undefined && now - previous < dedupeMs) {
      continue;
    }

    lastPrewarmedAt.set(spec.key, now);

    try {
      convex.prewarmQuery({
        query: spec.query,
        args: spec.args,
        extendSubscriptionFor,
      });
    } catch (error) {
      console.warn("Convex prewarm failed", {
        key: spec.key,
        error,
      });
    }
  }
}

export function resetPrewarmDedupeForTests() {
  lastPrewarmedAt.clear();
}

/**
 * Prewarm Convex queries for admin sidebar destinations. Extend as new CMS routes add queries.
 */
export function prewarmAdminNavigation(
  convex: ConvexReactClient,
  href: string,
) {
  if (href === "/admin/settings") {
    prewarmSpecs(convex, [
      makeRouteQuerySpec(api.cms.getSection, { section: "settings" }),
    ]);
  }
  if (href === "/admin/pricing") {
    prewarmSpecs(convex, [
      makeRouteQuerySpec(api.cms.getSection, { section: "pricing" }),
      makeRouteQuerySpec(api.cms.listMarketingFlagsDraft, {}),
    ]);
  }
  if (href === "/admin/about") {
    prewarmSpecs(convex, [
      makeRouteQuerySpec(api.cms.getSection, { section: "about" }),
      makeRouteQuerySpec(api.cms.listMarketingFlagsDraft, {}),
    ]);
  }
  if (href === "/admin/audio") {
    prewarmSpecs(convex, [
      makeRouteQuerySpec(api.cms.listMarketingFlagsDraft, {}),
    ]);
  }
}

type PrewarmFn = () => void | Promise<void>;

type UseRoutePrewarmIntentOptions = {
  debounceMs?: number;
};

export type RoutePrewarmIntentHandlers = {
  onMouseEnter: () => void;
  onFocus: () => void;
  onTouchStart: () => void;
  onMouseLeave: () => void;
  onBlur: () => void;
};

export function createRoutePrewarmIntent(
  prewarmFn: PrewarmFn,
  options: UseRoutePrewarmIntentOptions = {},
) {
  const debounceMs = options.debounceMs ?? PREWARM_DEBOUNCE_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = undefined;
  };

  const schedule = () => {
    if (timer) return;

    timer = setTimeout(() => {
      timer = undefined;
      Promise.resolve(prewarmFn()).catch((error) => {
        console.warn("Route prewarm intent failed", error);
      });
    }, debounceMs);
  };

  const handlers: RoutePrewarmIntentHandlers = {
    onMouseEnter: schedule,
    onFocus: schedule,
    onTouchStart: schedule,
    onMouseLeave: cancel,
    onBlur: cancel,
  };

  return { handlers, cancel };
}

/**
 * @returns Handlers for hover/focus prewarm, plus a ref callback to attach to a
 * root that unmounts with this intent — cleanup runs on detach and cancels the
 * debounce timer (replaces an effect-based unmount cleanup).
 */
export function useRoutePrewarmIntent(
  prewarmFn: PrewarmFn,
  options: UseRoutePrewarmIntentOptions = {},
): {
  readonly handlers: RoutePrewarmIntentHandlers;
  /** Attach to a root element (e.g. wrapper around the link) so timer cancels on unmount. */
  readonly intentRootRef: (node: Element | null) => void;
} {
  const prewarmRef = useRef(prewarmFn);
  prewarmRef.current = prewarmFn;

  const debounceMs = options.debounceMs ?? PREWARM_DEBOUNCE_MS;

  const previousController = useRef<ReturnType<typeof createRoutePrewarmIntent> | null>(
    null,
  );
  const controller = useMemo(() => {
    previousController.current?.cancel();
    const next = createRoutePrewarmIntent(() => prewarmRef.current(), {
      debounceMs,
    });
    previousController.current = next;
    return next;
  }, [debounceMs]);

  const controllerRef = useRef(controller);
  controllerRef.current = controller;

  const intentRootRef = useCallback((node: Element | null) => {
    if (node) return;
    controllerRef.current.cancel();
  }, []);

  return { handlers: controller.handlers, intentRootRef };
}
