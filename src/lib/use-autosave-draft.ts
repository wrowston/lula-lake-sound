"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Effect } from "effect";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { type CmsAppError } from "@/lib/effect-errors";
import type { AutosaveStatus } from "@/components/admin/cms-publish-toolbar";

export type { AutosaveStatus };

export interface UseAutosaveDraftOptions {
  /**
   * Whether there are pending local edits that should be flushed. When this
   * transitions to `true`, the debounce timer is (re)started.
   */
  readonly dirty: boolean;
  /** Debounce delay before persisting to the server. Defaults to 1000ms. */
  readonly delayMs?: number;
  /**
   * Factory that returns the Effect to persist the current draft. Called
   * every time autosave fires so it closes over the latest editor state.
   */
  readonly saveEffect: () => Effect.Effect<unknown, CmsAppError>;
  /**
   * While `true`, autosave is paused — pending timers are cancelled and new
   * ones are not scheduled (e.g. during publish/discard).
   */
  readonly pauseWhen?: boolean;
  /**
   * Called after a successful autosave. Use to clear local draft state so
   * the editor falls back to the server `draftSnapshot`.
   */
  readonly onSaved?: () => void;
  /** How long the "saved" status lingers before returning to idle. */
  readonly savedLingerMs?: number;
}

export interface UseAutosaveDraftResult {
  /** Current autosave status for UI indicators. */
  readonly status: AutosaveStatus;
  /**
   * Force-flush the pending autosave immediately (used e.g. by Publish so
   * any in-flight debounce doesn't get skipped). Resolves when the save
   * completes (or immediately if nothing to save).
   */
  readonly flush: () => Promise<void>;
}

/**
 * Debounced autosave hook. Whenever `dirty` becomes (or stays) `true`, a
 * timer is scheduled that runs `saveEffect` after `delayMs` of inactivity.
 * In-flight timers are cancelled on unmount or when `pauseWhen` is `true`.
 */
export function useAutosaveDraft({
  dirty,
  delayMs = 1000,
  saveEffect,
  pauseWhen = false,
  onSaved,
  savedLingerMs = 1600,
}: UseAutosaveDraftOptions): UseAutosaveDraftResult {
  const [status, setStatus] = useState<AutosaveStatus>("idle");

  const saveEffectRef = useRef(saveEffect);
  saveEffectRef.current = saveEffect;
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearLinger = () => {
    if (lingerTimerRef.current !== null) {
      clearTimeout(lingerTimerRef.current);
      lingerTimerRef.current = null;
    }
  };

  const runSave = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    clearLinger();
    setStatus("saving");
    const outcome = await runAdminEffect(saveEffectRef.current());
    inFlightRef.current = false;
    if (!mountedRef.current) return;
    if (outcome === undefined) {
      setStatus("error");
      return;
    }
    onSavedRef.current?.();
    setStatus("saved");
    lingerTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setStatus("idle");
    }, savedLingerMs);
  }, [savedLingerMs]);

  useEffect(() => {
    if (pauseWhen) {
      clearTimer();
      return;
    }
    if (!dirty) {
      clearTimer();
      return;
    }
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void runSave();
    }, delayMs);
    return clearTimer;
  }, [dirty, delayMs, pauseWhen, runSave]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
      clearLinger();
    };
  }, []);

  const flush = useCallback(async () => {
    clearTimer();
    if (!dirty && !inFlightRef.current) return;
    if (inFlightRef.current) {
      while (inFlightRef.current) {
        await new Promise((r) => setTimeout(r, 50));
      }
      return;
    }
    await runSave();
  }, [dirty, runSave]);

  return { status, flush };
}
