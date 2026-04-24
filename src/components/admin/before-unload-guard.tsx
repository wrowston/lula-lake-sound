"use client";

import { useCallback } from "react";
import { useCmsNavStateRef } from "@/components/admin/cms-workspace";

/**
 * Warns the browser (and the user) when they try to reload, close the tab,
 * or navigate externally while an admin editor reports unsaved local edits.
 *
 * The listener is attached via a ref callback — matching the project's
 * ref-callback-instead-of-useEffect convention used in
 * `src/hooks/use-scroll-and-reveal.ts` — and reads the latest dirty flag
 * straight from the workspace nav-state ref so the handler always has
 * fresh data without being re-installed.
 *
 * Sidebar / in-app nav is handled separately via the nav guard; this
 * guard only exists for browser-level lifecycle events.
 */
export function BeforeUnloadGuard() {
  const navStateRef = useCmsNavStateRef();

  const refCallback = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      function onBeforeUnload(event: BeforeUnloadEvent) {
        if (!navStateRef.current.hasLocalEdits) return;
        event.preventDefault();
        event.returnValue = "";
      }
      window.addEventListener("beforeunload", onBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", onBeforeUnload);
      };
    },
    [navStateRef],
  );

  return <div ref={refCallback} hidden aria-hidden="true" />;
}
