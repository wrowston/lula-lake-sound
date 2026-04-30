"use client";

import { useMemo, useRef } from "react";
import * as Sentry from "@sentry/nextjs";
import { useQueries, type Preloaded, type RequestForQueries } from "convex/react";
import { convexToJson, jsonToConvex, type Value } from "convex/values";
import {
  makeFunctionReference,
  type FunctionArgs,
  type FunctionReference,
  type FunctionReturnType,
} from "convex/server";
import { usePathname } from "next/navigation";

import { computePreviewTag } from "@/lib/sentry";

const QUERY_KEY = "q" as const;

/** Subscription or transport failure; distinct from a Convex handler returning `null`. */
export const PUBLIC_CONVEX_QUERY_FAILED = Symbol("PublicConvexQueryFailed");

export type PublicConvexQueryResult<T> =
  | T
  | undefined
  | typeof PUBLIC_CONVEX_QUERY_FAILED;

/**
 * Subscribes to a public Convex query without throwing on transport or query
 * errors (unlike {@link useQuery}, which throws when the subscription yields an
 * `Error`). Returns `undefined` while loading, {@link PUBLIC_CONVEX_QUERY_FAILED}
 * on failure, and the query result otherwise (including `null` if the handler
 * returns `null`). Reports the first occurrence of each distinct error to Sentry with
 * a coarse `section` tag for triage (INF-108 / INF-81).
 */
export function usePublicConvexQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>,
  options: { readonly section: string; readonly skip?: boolean },
): PublicConvexQueryResult<FunctionReturnType<Query>> {
  const pathname = usePathname();
  const argsValue = args as Value;
  const argsForQuery = args as Record<string, Value>;
  const skip = options.skip === true;
  const queries = useMemo((): RequestForQueries => {
    if (skip) {
      return {} as RequestForQueries;
    }
    return {
      [QUERY_KEY]: {
        query,
        args: argsForQuery,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Convex pattern: args JSON identity
  }, [JSON.stringify(convexToJson(argsValue)), query, skip]);

  const results = useQueries(queries);
  const raw = results[QUERY_KEY];
  const lastLogged = useRef<string | null>(null);

  if (raw instanceof Error) {
    const fingerprint = `${options.section}:${raw.message}`;
    if (lastLogged.current !== fingerprint) {
      lastLogged.current = fingerprint;
      const err = raw;
      const previewTag = computePreviewTag(pathname);
      queueMicrotask(() => {
        Sentry.captureException(err, {
          tags: {
            section: options.section,
            preview: previewTag,
          },
        });
      });
    }
    return PUBLIC_CONVEX_QUERY_FAILED;
  }

  if (raw !== undefined) {
    lastLogged.current = null;
  }

  return raw as FunctionReturnType<Query> | undefined;
}

/**
 * Like {@link usePreloadedQuery}, but when the live subscription fails the hook
 * returns {@link PUBLIC_CONVEX_QUERY_FAILED} instead of throwing. While the live result is still `undefined`,
 * the preloaded snapshot is returned (same hydration behavior as Convex).
 */
export function useSafePreloadedQuery<Query extends FunctionReference<"query">>(
  preloaded: Preloaded<Query>,
  options: { readonly section: string },
): PublicConvexQueryResult<FunctionReturnType<Query>> {
  const args = useMemo(
    () => jsonToConvex(preloaded._argsJSON) as FunctionArgs<Query>,
    [preloaded._argsJSON],
  );
  const preloadedResult = useMemo(
    () => jsonToConvex(preloaded._valueJSON) as FunctionReturnType<Query>,
    [preloaded._valueJSON],
  );
  const queryRef = useMemo(
    () => makeFunctionReference<"query", FunctionArgs<Query>, FunctionReturnType<Query>>(preloaded._name),
    [preloaded._name],
  );

  const live = usePublicConvexQuery(queryRef, args, options);

  if (live === undefined) {
    return preloadedResult;
  }
  return live;
}
