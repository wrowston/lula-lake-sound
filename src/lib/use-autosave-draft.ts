"use client";

import { useCallback, useRef, useState } from "react";
import { Effect } from "effect";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { type CmsAppError } from "@/lib/effect-errors";
import type { AutosaveStatus } from "@/components/admin/cms-publish-toolbar";

export type { AutosaveStatus };

export interface UseAutosaveDraftOptions {
  /**
   * When false, `kick()` and scheduled saves do not run (e.g. no local edits
   * or no server `source` yet). Updated every render via ref; read at
   * schedule and save time.
   */
  readonly isDirty: boolean;
  /**
   * Factory that returns the Effect to persist the current draft. Called
   * every time autosave fires so it closes over the latest editor state.
   */
  readonly saveEffect: () => Effect.Effect<unknown, CmsAppError>;
  /**
   * Called after a successful autosave. Use to clear local draft state so
   * the editor falls back to the server `draftSnapshot`.
   */
  readonly onSaved?: () => void;
  /** Debounce delay before persisting to the server. Defaults to 1000ms. */
  readonly delayMs?: number;
  /** How long the "saved" status lingers before returning to idle. */
  readonly savedLingerMs?: number;
  /**
   * When true, `kick()` does not schedule saves (e.g. while publish/discard is
   * in flight). Updated every render via ref; read at schedule and save time.
   */
  readonly pauseWhen?: boolean;
}

export interface UseAutosaveDraftResult {
  /** Current autosave status for UI indicators. */
  readonly status: AutosaveStatus;
  /**
   * Restart the idle debounce timer (call after every local edit). No-ops if
   * not dirty, or after `cancel()`/unmount.
   */
  readonly kick: () => void;
  /**
   * Clear any pending debounce/linger timers (e.g. when starting publish or
   * discard). Does not set unmounted; call `onUnmount` ref when leaving the
   * page to prevent post-`startTransition` setState.
   */
  readonly cancel: () => void;
  /**
   * Force-flush the pending autosave immediately (e.g. Publish). Resolves when
   * the save completes. Returns `false` if a save was required and did not
   * complete successfully.
   */
  readonly flush: () => Promise<boolean>;
  /**
   * Ref callback to attach to the editor root; cleanup runs on unmount and
   * stops timers + guards async completion.
   */
  readonly onUnmount: (node: HTMLDivElement | null) => void;
}

/**
 * Debounced autosave. Call `kick()` from change handlers; call `cancel()` when
 * pausing (e.g. before `setBusy` for publish). No effect hook — scheduling is
 * imperative only.
 */
export function useAutosaveDraft({
  isDirty,
  saveEffect,
  onSaved,
  delayMs = 1000,
  savedLingerMs = 1600,
  pauseWhen = false,
}: UseAutosaveDraftOptions): UseAutosaveDraftResult {
  const [status, setStatus] = useState<AutosaveStatus>("idle");

  const saveEffectRef = useRef(saveEffect);
  saveEffectRef.current = saveEffect;
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  const pauseWhenRef = useRef(pauseWhen);
  pauseWhenRef.current = pauseWhen;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const activeRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearLinger = useCallback(() => {
    if (lingerTimerRef.current !== null) {
      clearTimeout(lingerTimerRef.current);
      lingerTimerRef.current = null;
    }
  }, []);

  const runSave = useCallback(async (): Promise<boolean> => {
    if (inFlightRef.current) return true;
    if (!isDirtyRef.current) return true;
    if (pauseWhenRef.current) return false;
    inFlightRef.current = true;
    clearLinger();
    setStatus("saving");
    const outcome = await runAdminEffect(saveEffectRef.current());
    inFlightRef.current = false;
    if (!activeRef.current) return false;
    if (outcome === undefined) {
      setStatus("error");
      return false;
    }
    onSavedRef.current?.();
    setStatus("saved");
    lingerTimerRef.current = setTimeout(() => {
      if (activeRef.current) setStatus("idle");
    }, savedLingerMs);
    return true;
  }, [clearLinger, savedLingerMs]);

  const scheduleKick = useCallback(() => {
    if (!activeRef.current) {
      return;
    }
    if (pauseWhenRef.current) {
      return;
    }
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void runSave();
    }, delayMs);
  }, [clearTimer, delayMs, runSave]);

  const kick = useCallback(() => {
    scheduleKick();
  }, [scheduleKick]);

  const cancel = useCallback(() => {
    clearTimer();
    clearLinger();
  }, [clearLinger, clearTimer]);

  const dispose = useCallback(() => {
    activeRef.current = false;
    clearTimer();
    clearLinger();
  }, [clearLinger, clearTimer]);

  const onUnmount = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        activeRef.current = true;
        return;
      }
      dispose();
    },
    [dispose],
  );

  const flush = useCallback(async (): Promise<boolean> => {
    clearTimer();
    if (!isDirtyRef.current && !inFlightRef.current) {
      return true;
    }
    if (inFlightRef.current) {
      while (inFlightRef.current) {
        await new Promise((r) => setTimeout(r, 50));
      }
      if (!activeRef.current) {
        return false;
      }
      if (!isDirtyRef.current) {
        return true;
      }
    }
    return await runSave();
  }, [clearTimer, runSave]);

  return { status, kick, cancel, flush, onUnmount };
}
