"use client";

import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  PENDING_SECTION_NAV,
  PENDING_SECTION_ORDER,
  type PendingDraftKey,
} from "@/lib/admin-nav";

export interface PendingDraftSection {
  readonly key: PendingDraftKey;
  readonly href: string;
  readonly label: string;
}

const PendingDraftSectionsContext =
  createContext<readonly PendingDraftSection[] | null>(null);

function usePendingDraftSectionsSource(): readonly PendingDraftSection[] {
  const data = useQuery(api.cms.listPendingDrafts);
  return useMemo<PendingDraftSection[]>(() => {
    if (!data) return [];
    const set = new Set<PendingDraftKey>(data.sections as PendingDraftKey[]);
    return PENDING_SECTION_ORDER.filter((k) => set.has(k)).map((key) => ({
      key,
      ...PENDING_SECTION_NAV[key],
    }));
  }, [data]);
}

export function PendingDraftSectionsProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const pending = usePendingDraftSectionsSource();

  return createElement(
    PendingDraftSectionsContext.Provider,
    { value: pending },
    children,
  );
}

/**
 * Live list of CMS surfaces that currently have a pending draft. Reads
 * `api.cms.listPendingDrafts` so the result stays in sync whenever any admin
 * editor saves / publishes / discards a draft elsewhere in the app.
 *
 * Ordering is stable across re-renders (see `PENDING_SECTION_ORDER`) so chips
 * and sidebar dots don't reshuffle while Convex subscriptions refresh.
 */
export function usePendingDraftSections(): readonly PendingDraftSection[] {
  const pending = useContext(PendingDraftSectionsContext);
  if (!pending) {
    throw new Error(
      "usePendingDraftSections must be used inside <PendingDraftSectionsProvider>",
    );
  }
  return pending;
}
