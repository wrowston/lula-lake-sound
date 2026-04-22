"use client";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
} from "react";
import { Effect, pipe } from "effect";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Loader2,
  Music2,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CmsPublishToolbar } from "@/components/admin/cms-publish-toolbar";
import { convexMutationEffect, type CmsAppError } from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { cn } from "@/lib/utils";

const MAX_TITLE_LENGTH = 120;
const REORDER_MIME = "application/x-lls-audio-reorder";

type AudioTrackItem = {
  stableId: string;
  storageId: Id<"_storage">;
  url: string | null;
  title: string;
  sortOrder: number;
  contentType: string;
  sizeBytes: number;
  originalFileName: string | null;
};

type TitleEdits = Record<string, string>;

type RowAction = "saving" | "replacing" | "deleting";
type RowBusy = Record<string, RowAction | undefined>;

type UploadProgressEntry = {
  readonly id: string;
  readonly name: string;
  readonly progress: number;
  readonly status: "uploading" | "saving" | "done" | "error";
  readonly error?: string;
};

function defaultTitleFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length === 0) {
    return "Untitled track";
  }
  const titled = normalized[0].toUpperCase() + normalized.slice(1);
  return titled.length > MAX_TITLE_LENGTH
    ? titled.slice(0, MAX_TITLE_LENGTH)
    : titled;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return "Title is required.";
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return `Title must be at most ${MAX_TITLE_LENGTH} characters.`;
  }
  return null;
}

function sequentialEffects(
  effects: Array<Effect.Effect<unknown, CmsAppError>>,
): Effect.Effect<void, CmsAppError> {
  return effects.reduce(
    (acc, effect) => pipe(acc, Effect.flatMap(() => effect)),
    Effect.succeed(undefined) as Effect.Effect<void, CmsAppError>,
  );
}

async function uploadFileWithProgress(
  uploadUrl: string,
  file: File,
  onProgress: (fraction: number) => void,
): Promise<Id<"_storage">> {
  return await new Promise<Id<"_storage">>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(1, event.loaded / event.total));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as {
            storageId: Id<"_storage">;
          };
          onProgress(1);
          resolve(parsed.storageId);
        } catch {
          reject(new Error("Upload succeeded but response was malformed."));
        }
      } else {
        reject(
          new Error(
            `Upload failed (${xhr.status} ${xhr.statusText || "unknown"}).`,
          ),
        );
      }
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload.")),
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("Upload was aborted.")),
    );
    xhr.send(file);
  });
}

export function AudioEditor() {
  return (
    <>
      <AuthLoading>
        <p className="body-text text-foreground/80">Authenticating…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="body-text text-foreground/80">
          Sign in to manage audio samples.
        </p>
      </Unauthenticated>

      <Authenticated>
        <AudioEditorForm />
      </Authenticated>
    </>
  );
}

function AudioEditorForm() {
  const { user } = useUser();
  const data = useQuery(api.admin.audio.listDraftAudioTracks);
  const generateUploadUrl = useMutation(api.admin.audio.generateUploadUrl);
  const saveUploadedAudioTrack = useMutation(api.admin.audio.saveUploadedAudioTrack);
  const updateDraftAudioTrackTitle = useMutation(
    api.admin.audio.updateDraftAudioTrackTitle,
  );
  const replaceDraftAudioTrackFile = useMutation(
    api.admin.audio.replaceDraftAudioTrackFile,
  );
  const reorderDraftAudioTracks = useMutation(
    api.admin.audio.reorderDraftAudioTracks,
  );
  const removeDraftAudioTrack = useMutation(api.admin.audio.removeDraftAudioTrack);
  const publishAudioTracks = useMutation(api.admin.audio.publishAudioTracks);
  const discardDraftAudioTracks = useMutation(
    api.admin.audio.discardDraftAudioTracks,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const uploadDismissTimerRef = useRef<number | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<RowBusy>({});
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [edits, setEdits] = useState<TitleEdits>({});
  const [deleteStableId, setDeleteStableId] = useState<string | null>(null);
  const replaceTargetStableIdRef = useRef<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgressEntry[]>([]);

  const [draggingStableId, setDraggingStableId] = useState<string | null>(null);
  const [reorderTarget, setReorderTarget] = useState<{
    stableId: string;
    position: "before" | "after";
  } | null>(null);

  const tracks = useMemo(
    () => (data?.tracks ?? []) as AudioTrackItem[],
    [data],
  );

  const setRowAction = useCallback(
    (stableId: string, action: RowAction | undefined) => {
      setRowBusy((prev) => {
        const next = { ...prev };
        if (action === undefined) {
          delete next[stableId];
        } else {
          next[stableId] = action;
        }
        return next;
      });
    },
    [],
  );

  const runAction = useCallback(
    async <A,>(label: string, program: Effect.Effect<A, CmsAppError>) => {
      setInlineError(null);
      setBusy(label);
      const outcome = await runAdminEffect(program, {
        onErrorMessage: setInlineError,
      });
      setBusy(null);
      return outcome;
    },
    [],
  );

  const hasDraftOnServer = data?.hasDraftChanges ?? false;
  const hasLocalEdits = Object.keys(edits).length > 0;

  const publishedByLabel =
    data?.publishedBy && user?.id === data.publishedBy ? "You" : undefined;

  const getEditableTitle = useCallback(
    (track: AudioTrackItem) => edits[track.stableId] ?? track.title,
    [edits],
  );

  const updateTitleEdit = useCallback((track: AudioTrackItem, title: string) => {
    setEdits((current) => {
      if (title === track.title) {
        const rest = { ...current };
        delete rest[track.stableId];
        return rest;
      }
      return { ...current, [track.stableId]: title };
    });
  }, []);

  const clearTitleEdit = useCallback((stableId: string) => {
    setEdits((current) => {
      const rest = { ...current };
      delete rest[stableId];
      return rest;
    });
  }, []);

  const saveTrackTitle = useCallback(
    async (track: AudioTrackItem): Promise<boolean> => {
      const title = getEditableTitle(track);
      const validationError = validateTitle(title);
      if (validationError) {
        setInlineError(validationError);
        toast.error(validationError);
        return false;
      }

      setInlineError(null);
      setRowAction(track.stableId, "saving");
      const outcome = await runAdminEffect(
        convexMutationEffect(() =>
          updateDraftAudioTrackTitle({
            stableId: track.stableId,
            title: title.trim(),
          }),
        ),
        { onErrorMessage: setInlineError },
      );
      setRowAction(track.stableId, undefined);

      if (outcome === undefined) {
        return false;
      }

      clearTitleEdit(track.stableId);
      toast.success("Title saved.");
      return true;
    },
    [clearTitleEdit, getEditableTitle, setRowAction, updateDraftAudioTrackTitle],
  );

  const savePendingEdits = useCallback(async (): Promise<boolean> => {
    const dirty = tracks.filter((t) => edits[t.stableId] !== undefined);
    if (dirty.length === 0) {
      return true;
    }

    for (const track of dirty) {
      const title = getEditableTitle(track);
      const validationError = validateTitle(title);
      if (validationError) {
        setInlineError(validationError);
        toast.error(
          `${track.originalFileName ?? "Track"}: ${validationError}`,
        );
        return false;
      }
    }

    const effects = dirty.map((track) =>
      convexMutationEffect(() =>
        updateDraftAudioTrackTitle({
          stableId: track.stableId,
          title: getEditableTitle(track).trim(),
        }),
      ),
    );

    const outcome = await runAction("Saving…", sequentialEffects(effects));
    if (outcome === undefined) {
      return false;
    }

    setEdits({});
    return true;
  }, [edits, getEditableTitle, runAction, tracks, updateDraftAudioTrackTitle]);

  const persistOrder = useCallback(
    async (orderedStableIds: string[]): Promise<boolean> => {
      const outcome = await runAction(
        "Reordering…",
        convexMutationEffect(() =>
          reorderDraftAudioTracks({ orderedStableIds }),
        ),
      );
      return outcome !== undefined;
    },
    [reorderDraftAudioTracks, runAction],
  );

  const moveTrack = useCallback(
    async (stableId: string, direction: -1 | 1) => {
      const index = tracks.findIndex((t) => t.stableId === stableId);
      if (index === -1) return;
      const target = index + direction;
      if (target < 0 || target >= tracks.length) return;

      const reordered = [...tracks];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(target, 0, moved);

      const ok = await persistOrder(reordered.map((t) => t.stableId));
      if (ok) {
        toast.success("Track order updated.");
      }
    },
    [persistOrder, tracks],
  );

  const handleRowDragStart = useCallback(
    (event: ReactDragEvent<HTMLDivElement>, stableId: string) => {
      if (busy !== null) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(REORDER_MIME, stableId);
      event.dataTransfer.setData("text/plain", stableId);
      setDraggingStableId(stableId);
    },
    [busy],
  );

  const handleRowDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>, overStableId: string) => {
      if (!event.dataTransfer.types.includes(REORDER_MIME)) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "move";

      const rect = event.currentTarget.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const position = event.clientY < midpoint ? "before" : "after";
      setReorderTarget((prev) =>
        prev?.stableId === overStableId && prev.position === position
          ? prev
          : { stableId: overStableId, position },
      );
    },
    [],
  );

  const handleRowDrop = useCallback(
    async (event: ReactDragEvent<HTMLDivElement>, overStableId: string) => {
      if (!event.dataTransfer.types.includes(REORDER_MIME)) return;
      event.preventDefault();
      event.stopPropagation();

      const sourceId = event.dataTransfer.getData(REORDER_MIME);
      const position =
        reorderTarget?.stableId === overStableId
          ? reorderTarget.position
          : "after";
      setDraggingStableId(null);
      setReorderTarget(null);

      if (!sourceId || sourceId === overStableId) return;

      const sourceIndex = tracks.findIndex((t) => t.stableId === sourceId);
      const targetIndex = tracks.findIndex((t) => t.stableId === overStableId);
      if (sourceIndex === -1 || targetIndex === -1) return;

      const reordered = [...tracks];
      const [moved] = reordered.splice(sourceIndex, 1);
      const targetIndexInReordered = reordered.findIndex(
        (t) => t.stableId === overStableId,
      );
      if (targetIndexInReordered === -1) return;
      const insertAt =
        position === "before"
          ? targetIndexInReordered
          : targetIndexInReordered + 1;
      reordered.splice(insertAt, 0, moved);

      const orderedIds = reordered.map((t) => t.stableId);
      const unchanged = orderedIds.every(
        (id, idx) => tracks[idx]?.stableId === id,
      );
      if (unchanged) return;

      const ok = await persistOrder(orderedIds);
      if (ok) {
        toast.success("Track order updated.");
      }
    },
    [persistOrder, tracks, reorderTarget],
  );

  const handleRowDragEnd = useCallback(() => {
    setDraggingStableId(null);
    setReorderTarget(null);
  }, []);

  const updateUploadEntry = useCallback(
    (id: string, patch: Partial<UploadProgressEntry>) => {
      setUploadQueue((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
      );
    },
    [],
  );

  const processNewTrackFiles = useCallback(
    async (incomingFiles: File[]) => {
      if (incomingFiles.length === 0 || !data) {
        return;
      }

      setInlineError(null);

      const remainingSlots = Math.max(
        0,
        data.limits.maxTracks - tracks.length,
      );
      if (remainingSlots === 0) {
        toast.error(
          `Portfolio is full (${data.limits.maxTracks}). Remove a track first.`,
        );
        return;
      }

      let filesToUpload = incomingFiles;
      if (incomingFiles.length > remainingSlots) {
        toast.error(
          `Only ${remainingSlots} slot${remainingSlots === 1 ? "" : "s"} left; skipping the rest.`,
        );
        filesToUpload = incomingFiles.slice(0, remainingSlots);
      }

      setBusy("Uploading…");

      if (uploadDismissTimerRef.current !== null) {
        window.clearTimeout(uploadDismissTimerRef.current);
        uploadDismissTimerRef.current = null;
      }

      let successCount = 0;
      for (const file of filesToUpload) {
        const entryId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        setUploadQueue((prev) => [
          ...prev,
          {
            id: entryId,
            name: file.name,
            progress: 0,
            status: "uploading",
          },
        ]);

        const accepted = data.limits.acceptedMimeTypes as readonly string[];
        if (file.type && !accepted.includes(file.type)) {
          const msg = `${file.name}: use MP3, WAV, FLAC, M4A/AAC, or OGG.`;
          toast.error(msg);
          updateUploadEntry(entryId, { status: "error", error: msg });
          continue;
        }
        if (file.size > data.limits.maxFileBytes) {
          const msg = `${file.name}: file must be ${Math.floor(
            data.limits.maxFileBytes / (1024 * 1024),
          )}MB or smaller.`;
          toast.error(msg);
          updateUploadEntry(entryId, { status: "error", error: msg });
          continue;
        }

        const upload = await runAdminEffect(
          convexMutationEffect(() => generateUploadUrl({})),
          { onErrorMessage: setInlineError },
        );
        if (!upload) {
          updateUploadEntry(entryId, {
            status: "error",
            error: "Could not get upload URL.",
          });
          break;
        }

        let storageId: Id<"_storage"> | undefined;
        try {
          storageId = await uploadFileWithProgress(
            upload.uploadUrl,
            file,
            (fraction) => updateUploadEntry(entryId, { progress: fraction }),
          );
        } catch (e) {
          const msg =
            e instanceof Error ? e.message : "Upload failed unexpectedly.";
          toast.error(msg);
          updateUploadEntry(entryId, { status: "error", error: msg });
          continue;
        }

        updateUploadEntry(entryId, { status: "saving", progress: 1 });
        const saved = await runAdminEffect(
          convexMutationEffect(() =>
            saveUploadedAudioTrack({
              storageId,
              title: defaultTitleFromFileName(file.name),
              originalFileName: file.name,
            }),
          ),
          { onErrorMessage: setInlineError },
        );

        if (saved === undefined) {
          updateUploadEntry(entryId, {
            status: "error",
            error: "Could not save track to draft.",
          });
          break;
        }

        successCount += 1;
        updateUploadEntry(entryId, { status: "done" });
      }

      setBusy(null);
      if (successCount > 0) {
        toast.success(
          successCount === 1 ? "Track uploaded." : `${successCount} tracks uploaded.`,
        );
      }
    },
    [
      data,
      generateUploadUrl,
      saveUploadedAudioTrack,
      tracks.length,
      updateUploadEntry,
    ],
  );

  const handleReplaceFileSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const stableId = replaceTargetStableIdRef.current;
      const file = event.target.files?.[0];
      event.target.value = "";
      replaceTargetStableIdRef.current = null;

      if (!stableId || !file || !data) {
        return;
      }

      const accepted = data.limits.acceptedMimeTypes as readonly string[];
      if (file.type && !accepted.includes(file.type)) {
        toast.error(`${file.name}: use MP3, WAV, FLAC, M4A/AAC, or OGG.`);
        return;
      }
      if (file.size > data.limits.maxFileBytes) {
        toast.error(
          `${file.name}: file must be ${Math.floor(
            data.limits.maxFileBytes / (1024 * 1024),
          )}MB or smaller.`,
        );
        return;
      }

      setRowAction(stableId, "replacing");
      setInlineError(null);

      const upload = await runAdminEffect(
        convexMutationEffect(() => generateUploadUrl({})),
        { onErrorMessage: setInlineError },
      );
      if (!upload) {
        setRowAction(stableId, undefined);
        return;
      }

      let storageId: Id<"_storage"> | undefined;
      try {
        storageId = await uploadFileWithProgress(upload.uploadUrl, file, () => {
          /* no tray for replace */
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed.";
        toast.error(msg);
        setRowAction(stableId, undefined);
        return;
      }

      const outcome = await runAdminEffect(
        convexMutationEffect(() =>
          replaceDraftAudioTrackFile({
            stableId,
            newStorageId: storageId,
            originalFileName: file.name,
          }),
        ),
        { onErrorMessage: setInlineError },
      );
      setRowAction(stableId, undefined);

      if (outcome !== undefined) {
        toast.success("Audio file replaced.");
      }
    },
    [data, generateUploadUrl, replaceDraftAudioTrackFile, setRowAction],
  );

  const handleFileSelection = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const list = event.target.files;
      event.target.value = "";
      if (!list || list.length === 0) return;
      void processNewTrackFiles(Array.from(list));
    },
    [processNewTrackFiles],
  );

  const handleDragEnter = useCallback((event: ReactDragEvent) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    dragDepthRef.current += 1;
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((event: ReactDragEvent) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((event: ReactDragEvent) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (event: ReactDragEvent) => {
      dragDepthRef.current = 0;
      setIsDraggingOver(false);
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files ?? []);
      void processNewTrackFiles(files);
    },
    [processNewTrackFiles],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteStableId) return;
    setInlineError(null);
    setRowAction(deleteStableId, "deleting");
    const outcome = await runAdminEffect(
      convexMutationEffect(() =>
        removeDraftAudioTrack({ stableId: deleteStableId }),
      ),
      { onErrorMessage: setInlineError },
    );
    setRowAction(deleteStableId, undefined);
    setDeleteStableId(null);

    if (outcome !== undefined) {
      clearTitleEdit(deleteStableId);
      toast.success("Track removed.");
    }
  }, [clearTitleEdit, deleteStableId, removeDraftAudioTrack, setRowAction]);

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
    setInlineError(null);
    if (hasDraftOnServer) {
      setBusy("Discarding…");
      const outcome = await runAdminEffect(
        convexMutationEffect(() => discardDraftAudioTracks({})),
        { onErrorMessage: setInlineError },
      );
      setBusy(null);
      if (outcome === undefined) {
        return false;
      }
    }

    setEdits({});
    toast.success(
      hasDraftOnServer
        ? "Draft discarded. The editor now matches the published site."
        : "Unsaved changes discarded.",
    );
    return true;
  }, [discardDraftAudioTracks, hasDraftOnServer]);

  const handlePublish = useCallback(async () => {
    const saved = await savePendingEdits();
    if (!saved) {
      return;
    }

    const outcome = await runAction(
      "Publishing…",
      convexMutationEffect(() => publishAudioTracks({})),
    );
    if (outcome !== undefined) {
      toast.success("Audio portfolio published.");
    }
  }, [publishAudioTracks, runAction, savePendingEdits]);

  if (data === undefined) {
    return <p className="body-text text-foreground/80">Loading audio tracks…</p>;
  }

  const anyUploading = uploadQueue.some(
    (entry) => entry.status === "uploading" || entry.status === "saving",
  );

  const acceptAttr = [
    ...data.limits.acceptedMimeTypes,
    ".mp3",
    ".wav",
    ".flac",
    ".m4a",
    ".aac",
    ".ogg",
  ].join(",");

  return (
    <div
      className={cn(
        "relative space-y-8 pb-24 transition",
        isDraggingOver &&
          "rounded-xl ring-2 ring-primary ring-offset-4 ring-offset-background",
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={replaceInputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={handleReplaceFileSelected}
      />

      {isDraggingOver && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center rounded-xl bg-primary/5 pt-16 sm:pt-24"
          aria-hidden
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-card/95 px-10 py-8 shadow-xl">
            <Music2 className="size-10 text-primary" aria-hidden />
            <p className="text-lg font-semibold text-foreground">
              Drop audio to upload
            </p>
            <p className="body-text-small text-muted-foreground">
              MP3, WAV, FLAC, M4A/AAC, OGG · up to{" "}
              {Math.floor(data.limits.maxFileBytes / (1024 * 1024))}MB each
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Audio portfolio
            </h2>
            <p className="body-text-small max-w-2xl text-foreground/85">
              Upload samples for the studio portfolio. Reorder tracks in draft,
              replace files when you have a new master (the previous file is
              removed when safe), then publish when you are ready.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptAttr}
              multiple
              className="hidden"
              onChange={handleFileSelection}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy !== null || tracks.length >= data.limits.maxTracks}
            >
              {busy === "Uploading…" ? (
                <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="mr-1 size-4" aria-hidden />
              )}
              Upload tracks
            </Button>
            <p className="body-text-small text-right text-foreground/70">
              Up to {Math.floor(data.limits.maxFileBytes / (1024 * 1024))}MB each.
              {tracks.length >= data.limits.maxTracks
                ? ` Limit reached (${data.limits.maxTracks}).`
                : ` ${tracks.length}/${data.limits.maxTracks} used.`}
            </p>
          </div>
        </div>
      </div>

      {uploadQueue.length > 0 && (
        <div
          className="space-y-2 rounded-xl border border-border bg-muted/30 p-4"
          aria-live="polite"
          aria-busy={anyUploading}
        >
          <p className="body-text-small font-medium text-foreground/85">
            {anyUploading ? "Uploading…" : "Upload results"}
          </p>
          <ul className="space-y-2">
            {uploadQueue.map((entry) => (
              <li key={entry.id} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-foreground/85" title={entry.name}>
                    {entry.name}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs",
                      entry.status === "error"
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {entry.status === "uploading" &&
                      `${Math.round(entry.progress * 100)}%`}
                    {entry.status === "saving" && "Saving…"}
                    {entry.status === "done" && "Done"}
                    {entry.status === "error" && "Failed"}
                  </span>
                </div>
                <div
                  className={cn(
                    "h-1.5 overflow-hidden rounded-full bg-border/70",
                    entry.status === "error" && "bg-destructive/20",
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      entry.status === "error"
                        ? "bg-destructive"
                        : entry.status === "done"
                          ? "bg-emerald-500"
                          : "bg-primary",
                    )}
                    style={{
                      width:
                        entry.status === "error"
                          ? "100%"
                          : `${Math.round(entry.progress * 100)}%`,
                    }}
                  />
                </div>
                {entry.error && (
                  <p className="text-xs text-destructive">{entry.error}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tracks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          <p className="body-text text-foreground/80">
            No tracks yet. Drop audio files here or use Upload tracks to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {tracks.map((track, index) => {
            const titleValue = getEditableTitle(track);
            const isDirty = edits[track.stableId] !== undefined;
            const rowAction = rowBusy[track.stableId];
            const isRowBusy = rowAction !== undefined;
            const isDraggingThis = draggingStableId === track.stableId;
            const dropHint =
              reorderTarget?.stableId === track.stableId &&
              draggingStableId !== null &&
              draggingStableId !== track.stableId
                ? reorderTarget.position
                : null;
            const titleInvalid = titleValue.trim().length === 0;

            return (
              <Card
                key={track.stableId}
                data-stable-id={track.stableId}
                className={cn(
                  "relative flex min-w-0 flex-col gap-2 p-2.5 transition",
                  isDraggingThis && "opacity-60",
                  dropHint === "before" &&
                    "shadow-[0_-2px_0_0_var(--color-primary)]",
                  dropHint === "after" &&
                    "shadow-[0_2px_0_0_var(--color-primary)]",
                  isRowBusy && "pointer-events-none",
                )}
                draggable={busy === null}
                onDragStart={(event) => handleRowDragStart(event, track.stableId)}
                onDragOver={(event) => handleRowDragOver(event, track.stableId)}
                onDrop={(event) => void handleRowDrop(event, track.stableId)}
                onDragEnd={handleRowDragEnd}
              >
                <div className="flex items-start justify-between gap-2 rounded-lg border border-border bg-muted/20 p-2">
                  <div
                    className="text-muted-foreground/70"
                    aria-hidden
                  >
                    <GripVertical className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
                      Track #{index + 1}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {track.originalFileName ?? "Audio file"} ·{" "}
                      {track.contentType} · {formatBytes(track.sizeBytes)}
                    </p>
                    {track.url ? (
                      <audio
                        controls
                        preload="metadata"
                        src={track.url}
                        className="mt-1 h-9 w-full max-w-full"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Preview unavailable (storage missing).
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-0.5 rounded-md border border-border/60 bg-background/85 p-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="bg-transparent text-foreground hover:bg-muted/70"
                      aria-label="Move track up"
                      disabled={index === 0 || busy !== null || isRowBusy}
                      onClick={() => void moveTrack(track.stableId, -1)}
                    >
                      <ArrowUp className="size-4 stroke-[2.25]" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="bg-transparent text-foreground hover:bg-muted/70"
                      disabled={
                        index === tracks.length - 1 ||
                        busy !== null ||
                        isRowBusy
                      }
                      aria-label="Move track down"
                      onClick={() => void moveTrack(track.stableId, 1)}
                    >
                      <ArrowDown className="size-4 stroke-[2.25]" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="bg-transparent text-foreground hover:bg-muted/70"
                      aria-label="Replace audio file"
                      disabled={busy !== null || isRowBusy}
                      onClick={() => {
                        replaceTargetStableIdRef.current = track.stableId;
                        replaceInputRef.current?.click();
                      }}
                    >
                      {rowAction === "replacing" ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <RefreshCw className="size-4 stroke-[2.25]" aria-hidden />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="bg-transparent text-destructive hover:bg-destructive/10"
                      aria-label="Delete track"
                      disabled={busy !== null || isRowBusy}
                      onClick={() => setDeleteStableId(track.stableId)}
                    >
                      <Trash2 className="size-4 stroke-[2.25]" aria-hidden />
                    </Button>
                  </div>
                </div>

                <div className="min-w-0 space-y-1.5 px-0.5">
                  <label className="min-w-0 space-y-0.5">
                    <span className="text-[11px] font-medium text-foreground/90">
                      Title
                      <span className="ml-1 text-destructive" aria-hidden>
                        *
                      </span>
                    </span>
                    <Input
                      value={titleValue}
                      aria-invalid={titleInvalid || undefined}
                      onChange={(event) =>
                        updateTitleEdit(track, event.target.value)
                      }
                      maxLength={MAX_TITLE_LENGTH}
                      className="h-7 py-1 text-sm"
                    />
                    {titleInvalid && (
                      <span className="block text-xs text-amber-600 dark:text-amber-400">
                        Title is required before publish.
                      </span>
                    )}
                  </label>

                  {rowAction === "saving" && (
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" aria-hidden />
                      Saving…
                    </p>
                  )}
                  {rowAction === "deleting" && (
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" aria-hidden />
                      Deleting…
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5">
                    <p className="text-[11px] text-muted-foreground">
                      {isDirty
                        ? "Unsaved title changes."
                        : "Title saved to draft."}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!isDirty || busy !== null || isRowBusy}
                      onClick={() => void saveTrackTitle(track)}
                    >
                      {rowAction === "saving" ? (
                        <Loader2 className="mr-1 size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Save className="mr-1 size-3.5" aria-hidden />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CmsPublishToolbar
        section="audio"
        sectionLabel="Audio portfolio"
        hasDraftOnServer={hasDraftOnServer}
        hasLocalEdits={hasLocalEdits}
        publishedAt={data.publishedAt}
        publishedByLabel={publishedByLabel}
        busy={busy}
        onPublish={() => void handlePublish()}
        onDiscardConfirm={handleDiscardConfirm}
        previewHref="/preview"
        inlineError={inlineError}
        autosaveStatus="idle"
      />

      <AlertDialog
        open={deleteStableId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteStableId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete track?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the track from the draft and deletes its storage file
              when nothing else references it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={
                deleteStableId
                  ? rowBusy[deleteStableId] === "deleting"
                  : busy !== null
              }
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={
                deleteStableId
                  ? rowBusy[deleteStableId] === "deleting"
                  : busy !== null
              }
              onClick={() => void handleDeleteConfirm()}
            >
              {deleteStableId && rowBusy[deleteStableId] === "deleting" ? (
                <>
                  <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Delete track"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
