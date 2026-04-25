"use client";

import Image from "next/image";
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
  Headphones,
  Loader2,
  Music,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRegisterCmsEditor } from "@/components/admin/cms-workspace";
import { convexMutationEffect, type CmsAppError } from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import {
  mergeAutosaveStatus,
  useMarketingFeatureFlagsAdmin,
} from "@/lib/use-marketing-feature-flags-admin";
import { cn } from "@/lib/utils";

const MAX_TITLE_LENGTH = 200;
const MAX_ARTIST_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

type TrackItem = {
  stableId: string;
  storageId: Id<"_storage">;
  url: string | null;
  title: string;
  artist: string | null;
  description: string;
  mimeType: string;
  durationSec: number | null;
  sortOrder: number;
  sizeBytes: number;
  originalFileName: string | null;
  albumThumbnailUrl: string | null;
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
};

type TrackEdits = Record<
  string,
  {
    title: string;
    artist: string;
    description: string;
    albumThumbnailUrl: string;
    spotifyUrl: string;
    appleMusicUrl: string;
  }
>;

type RowAction = "saving" | "deleting";
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
  return normalized[0].toUpperCase() + normalized.slice(1);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(sec: number | null): string {
  if (sec === null || !Number.isFinite(sec) || sec < 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function validateTrackFields(
  title: string,
  artist: string,
  description: string,
): string | null {
  const t = title.trim();
  if (t.length === 0) return "Title is required.";
  if (t.length > MAX_TITLE_LENGTH) {
    return `Title must be at most ${MAX_TITLE_LENGTH} characters.`;
  }
  if (artist.trim().length > MAX_ARTIST_LENGTH) {
    return `Artist must be at most ${MAX_ARTIST_LENGTH} characters.`;
  }
  const d = description.trim();
  if (d.length === 0) return "Description is required.";
  if (d.length > MAX_DESCRIPTION_LENGTH) {
    return `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`;
  }
  return null;
}

function validateOptionalHttpsUrl(raw: string, label: string): string | null {
  const s = raw.trim();
  if (s.length === 0) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") {
      return `${label} must use https://.`;
    }
    return null;
  } catch {
    return `${label} must be a valid URL.`;
  }
}

function isSpotifyHostname(host: string): boolean {
  return host === "spotify.com" || host.endsWith(".spotify.com");
}

function validateStreamingUrls(
  albumThumbnailUrl: string,
  spotifyUrl: string,
  appleMusicUrl: string,
): string | null {
  const thumbErr = validateOptionalHttpsUrl(albumThumbnailUrl, "Album art URL");
  if (thumbErr) return thumbErr;

  const spotify = spotifyUrl.trim();
  if (spotify.length > 0) {
    const e = validateOptionalHttpsUrl(spotify, "Spotify URL");
    if (e) return e;
    try {
      const h = new URL(spotify).hostname.toLowerCase();
      if (!isSpotifyHostname(h)) {
        return "Spotify URL must be on spotify.com.";
      }
    } catch {
      return "Spotify URL must be a valid URL.";
    }
  }

  const apple = appleMusicUrl.trim();
  if (apple.length > 0) {
    const e = validateOptionalHttpsUrl(apple, "Apple Music URL");
    if (e) return e;
    try {
      const h = new URL(apple).hostname.toLowerCase();
      const ok =
        h === "music.apple.com" ||
        h.endsWith(".music.apple.com") ||
        h === "itunes.apple.com" ||
        h.endsWith(".itunes.apple.com");
      if (!ok) {
        return "Apple Music URL must be on music.apple.com or itunes.apple.com.";
      }
    } catch {
      return "Apple Music URL must be a valid URL.";
    }
  }

  return null;
}

function httpsImagePreviewUrl(raw: string): string | null {
  const u = raw.trim();
  if (u.length === 0) return null;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

function sequentialEffects(
  effects: Array<Effect.Effect<unknown, CmsAppError>>,
): Effect.Effect<void, CmsAppError> {
  return effects.reduce(
    (acc, effect) => pipe(acc, Effect.flatMap(() => effect)),
    Effect.succeed(undefined) as Effect.Effect<void, CmsAppError>,
  );
}

async function readAudioDurationSec(file: File): Promise<number | null> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const sec = await new Promise<number | null>((resolve) => {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        const d = audio.duration;
        resolve(Number.isFinite(d) && d > 0 ? d : null);
      };
      audio.onerror = () => resolve(null);
      audio.src = objectUrl;
    });
    return sec;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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

function hasFilesBeingDragged(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes("Files");
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
  const saveUploadedTrack = useMutation(api.admin.audio.saveUploadedTrack);
  const updateDraftTrack = useMutation(api.admin.audio.updateDraftTrack);
  const reorderDraftTracks = useMutation(api.admin.audio.reorderDraftTracks);
  const removeDraftTrack = useMutation(api.admin.audio.removeDraftTrack);
  const publishAudioTracks = useMutation(api.admin.audio.publishAudioTracks);
  const discardDraftAudioTracks = useMutation(
    api.admin.audio.discardDraftAudioTracks,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const uploadDismissTimerRef = useRef<number | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<RowBusy>({});
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [edits, setEdits] = useState<TrackEdits>({});
  const [deleteStableId, setDeleteStableId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgressEntry[]>([]);

  const {
    data: featureFlagsCms,
    source: featureFlagsSource,
    isLoading: featureFlagsLoading,
    hasFFLocalEdits,
    hasFFDraftOnServer,
    ffAutosaveStatus,
    flushFFAutosave,
    cancelFFAutosave,
    ffOnUnmount,
    setRecordingsPage,
    runPublishFF,
    runDiscardFF,
    clearFFLocal,
  } = useMarketingFeatureFlagsAdmin(busy !== null);

  const tracks = useMemo(() => (data?.tracks ?? []) as TrackItem[], [data]);

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

  const hasAudioDraftOnServer = data?.hasDraftChanges ?? false;
  const hasAudioLocalEdits = Object.keys(edits).length > 0;
  const hasDraftOnServer = hasAudioDraftOnServer || hasFFDraftOnServer;
  const hasLocalEdits = hasAudioLocalEdits || hasFFLocalEdits;

  const mergedPublishedAt = useMemo((): number | null => {
    const a = data?.publishedAt ?? null;
    const b = featureFlagsCms?.publishedAt ?? null;
    if (a == null && b == null) return null;
    if (a == null) return b;
    if (b == null) return a;
    return Math.max(a, b);
  }, [data?.publishedAt, featureFlagsCms?.publishedAt]);

  const combinedAutosaveStatus = mergeAutosaveStatus("idle", ffAutosaveStatus);

  const publishedByLabel = (() => {
    const audioPubAt = data?.publishedAt ?? null;
    const ffPubAt = featureFlagsCms?.publishedAt ?? null;
    const latestBy =
      audioPubAt != null && (ffPubAt == null || audioPubAt >= ffPubAt)
        ? data?.publishedBy
        : featureFlagsCms?.publishedBy;
    return latestBy && user?.id === latestBy ? "You" : undefined;
  })();

  const getEditableFields = useCallback(
    (track: TrackItem) => ({
      title: edits[track.stableId]?.title ?? track.title,
      artist: edits[track.stableId]?.artist ?? (track.artist ?? ""),
      description: edits[track.stableId]?.description ?? track.description,
      albumThumbnailUrl:
        edits[track.stableId]?.albumThumbnailUrl ??
        (track.albumThumbnailUrl ?? ""),
      spotifyUrl: edits[track.stableId]?.spotifyUrl ?? (track.spotifyUrl ?? ""),
      appleMusicUrl:
        edits[track.stableId]?.appleMusicUrl ?? (track.appleMusicUrl ?? ""),
    }),
    [edits],
  );

  const updateTrackEdit = useCallback(
    (
      track: TrackItem,
      patch: Partial<{
        title: string;
        artist: string;
        description: string;
        albumThumbnailUrl: string;
        spotifyUrl: string;
        appleMusicUrl: string;
      }>,
    ) => {
      setEdits((current) => {
        const base = {
          title: current[track.stableId]?.title ?? track.title,
          artist: current[track.stableId]?.artist ?? (track.artist ?? ""),
          description: current[track.stableId]?.description ?? track.description,
          albumThumbnailUrl:
            current[track.stableId]?.albumThumbnailUrl ??
            (track.albumThumbnailUrl ?? ""),
          spotifyUrl:
            current[track.stableId]?.spotifyUrl ?? (track.spotifyUrl ?? ""),
          appleMusicUrl:
            current[track.stableId]?.appleMusicUrl ?? (track.appleMusicUrl ?? ""),
        };
        const next = {
          title: patch.title ?? base.title,
          artist: patch.artist ?? base.artist,
          description: patch.description ?? base.description,
          albumThumbnailUrl: patch.albumThumbnailUrl ?? base.albumThumbnailUrl,
          spotifyUrl: patch.spotifyUrl ?? base.spotifyUrl,
          appleMusicUrl: patch.appleMusicUrl ?? base.appleMusicUrl,
        };
        if (
          next.title === track.title &&
          next.artist === (track.artist ?? "") &&
          next.description === track.description &&
          next.albumThumbnailUrl === (track.albumThumbnailUrl ?? "") &&
          next.spotifyUrl === (track.spotifyUrl ?? "") &&
          next.appleMusicUrl === (track.appleMusicUrl ?? "")
        ) {
          const rest = { ...current };
          delete rest[track.stableId];
          return rest;
        }
        return { ...current, [track.stableId]: next };
      });
    },
    [],
  );

  const clearTrackEdit = useCallback((stableId: string) => {
    setEdits((current) => {
      const rest = { ...current };
      delete rest[stableId];
      return rest;
    });
  }, []);

  const saveTrackDetails = useCallback(
    async (track: TrackItem): Promise<boolean> => {
      const fields = getEditableFields(track);
      const validationError = validateTrackFields(
        fields.title,
        fields.artist,
        fields.description,
      );
      if (validationError) {
        setInlineError(validationError);
        toast.error(validationError);
        return false;
      }
      const urlErr = validateStreamingUrls(
        fields.albumThumbnailUrl,
        fields.spotifyUrl,
        fields.appleMusicUrl,
      );
      if (urlErr) {
        setInlineError(urlErr);
        toast.error(urlErr);
        return false;
      }

      setInlineError(null);
      setRowAction(track.stableId, "saving");
      const outcome = await runAdminEffect(
        convexMutationEffect(() =>
          updateDraftTrack({
            stableId: track.stableId,
            title: fields.title.trim(),
            artist:
              fields.artist.trim().length > 0 ? fields.artist.trim() : null,
            description: fields.description.trim(),
            albumThumbnailUrl:
              fields.albumThumbnailUrl.trim().length > 0
                ? fields.albumThumbnailUrl.trim()
                : null,
            spotifyUrl:
              fields.spotifyUrl.trim().length > 0
                ? fields.spotifyUrl.trim()
                : null,
            appleMusicUrl:
              fields.appleMusicUrl.trim().length > 0
                ? fields.appleMusicUrl.trim()
                : null,
          }),
        ),
        { onErrorMessage: setInlineError },
      );
      setRowAction(track.stableId, undefined);

      if (outcome === undefined) {
        return false;
      }

      clearTrackEdit(track.stableId);
      toast.success("Track saved.");
      return true;
    },
    [clearTrackEdit, getEditableFields, setRowAction, updateDraftTrack],
  );

  const savePendingEdits = useCallback(async (): Promise<boolean> => {
    const dirty = tracks.filter((t) => edits[t.stableId] !== undefined);
    if (dirty.length === 0) {
      return true;
    }

    for (const track of dirty) {
      const fields = getEditableFields(track);
      const err = validateTrackFields(
        fields.title,
        fields.artist,
        fields.description,
      );
      if (err) {
        setInlineError(err);
        toast.error(`${track.title}: ${err}`);
        return false;
      }
      const urlErr = validateStreamingUrls(
        fields.albumThumbnailUrl,
        fields.spotifyUrl,
        fields.appleMusicUrl,
      );
      if (urlErr) {
        setInlineError(urlErr);
        toast.error(`${track.title}: ${urlErr}`);
        return false;
      }
    }

    const effects = dirty.map((track) => {
      const fields = getEditableFields(track);
      return convexMutationEffect(() =>
        updateDraftTrack({
          stableId: track.stableId,
          title: fields.title.trim(),
          artist:
            fields.artist.trim().length > 0 ? fields.artist.trim() : null,
          description: fields.description.trim(),
          albumThumbnailUrl:
            fields.albumThumbnailUrl.trim().length > 0
              ? fields.albumThumbnailUrl.trim()
              : null,
          spotifyUrl:
            fields.spotifyUrl.trim().length > 0
              ? fields.spotifyUrl.trim()
              : null,
          appleMusicUrl:
            fields.appleMusicUrl.trim().length > 0
              ? fields.appleMusicUrl.trim()
              : null,
        }),
      );
    });

    const outcome = await runAction("Saving…", sequentialEffects(effects));
    if (outcome === undefined) {
      return false;
    }

    setEdits({});
    return true;
  }, [edits, getEditableFields, runAction, tracks, updateDraftTrack]);

  const persistOrder = useCallback(
    async (orderedStableIds: string[]): Promise<boolean> => {
      const outcome = await runAction(
        "Reordering…",
        convexMutationEffect(() =>
          reorderDraftTracks({ orderedStableIds }),
        ),
      );
      return outcome !== undefined;
    },
    [reorderDraftTracks, runAction],
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
        toast.success("Order updated.");
      }
    },
    [persistOrder, tracks],
  );

  const processFiles = useCallback(
    async (files: File[]) => {
      if (!data) return;
      const allowedMime = new Set<string>(data.limits.acceptedMimeTypes);
      const audioFiles = files.filter((f) => {
        if (f.type.length > 0 && allowedMime.has(f.type)) {
          return true;
        }
        return /\.(mp3|wav)$/i.test(f.name);
      });
      if (audioFiles.length === 0) {
        toast.error("Drop MP3 or WAV files only.");
        return;
      }

      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        if (tracks.length + i >= data.limits.maxTracks) {
          toast.error(
            `Portfolio is full (${data.limits.maxTracks} tracks). Remove a track first.`,
          );
          break;
        }

        const entryId = `${Date.now()}-${i}-${file.name}`;
        setUploadQueue((q) => [
          ...q,
          {
            id: entryId,
            name: file.name,
            progress: 0,
            status: "uploading" as const,
          },
        ]);

        try {
          const { uploadUrl } = await generateUploadUrl({});
          const storageId = await uploadFileWithProgress(
            uploadUrl,
            file,
            (fraction) => {
              setUploadQueue((q) =>
                q.map((e) =>
                  e.id === entryId ? { ...e, progress: fraction } : e,
                ),
              );
            },
          );

          setUploadQueue((q) =>
            q.map((e) =>
              e.id === entryId ? { ...e, status: "saving", progress: 1 } : e,
            ),
          );

          const durationSec = await readAudioDurationSec(file);

          await saveUploadedTrack({
            storageId,
            title: defaultTitleFromFileName(file.name),
            artist: null,
            description:
              "Studio recording sample — edit this description before publishing.",
            durationSec: durationSec ?? null,
            originalFileName: file.name,
            albumThumbnailUrl: null,
            spotifyUrl: null,
            appleMusicUrl: null,
          });

          setUploadQueue((q) =>
            q.map((e) =>
              e.id === entryId ? { ...e, status: "done" } : e,
            ),
          );
          toast.success(`Added ${file.name}`);
        } catch (e) {
          const message =
            e instanceof Error ? e.message : "Upload failed.";
          setUploadQueue((q) =>
            q.map((entry) =>
              entry.id === entryId
                ? { ...entry, status: "error", error: message }
                : entry,
            ),
          );
          toast.error(message);
        }
      }

      if (uploadDismissTimerRef.current !== null) {
        window.clearTimeout(uploadDismissTimerRef.current);
      }
      uploadDismissTimerRef.current = window.setTimeout(() => {
        setUploadQueue((q) => q.filter((e) => e.status !== "done"));
        uploadDismissTimerRef.current = null;
      }, 4000);
    },
    [data, generateUploadUrl, saveUploadedTrack, tracks.length],
  );

  const handleFileSelection = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const list = event.target.files;
      event.target.value = "";
      if (!list || list.length === 0) return;
      await processFiles(Array.from(list));
    },
    [processFiles],
  );

  const canAcceptDrop =
    data !== undefined &&
    busy === null &&
    tracks.length < data.limits.maxTracks;

  const handleDragEnter = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      if (!hasFilesBeingDragged(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current += 1;
      setIsDraggingOver(true);
    },
    [],
  );

  const handleDragLeave = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      if (!hasFilesBeingDragged(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsDraggingOver(false);
      }
    },
    [],
  );

  const handleDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      if (!hasFilesBeingDragged(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = canAcceptDrop ? "copy" : "none";
    },
    [canAcceptDrop],
  );

  const handleDrop = useCallback(
    async (event: ReactDragEvent<HTMLDivElement>) => {
      if (!hasFilesBeingDragged(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current = 0;
      setIsDraggingOver(false);
      if (!canAcceptDrop) return;
      const files = Array.from(event.dataTransfer.files);
      await processFiles(files);
    },
    [canAcceptDrop, processFiles],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteStableId) return;
    setInlineError(null);
    setRowAction(deleteStableId, "deleting");
    const outcome = await runAdminEffect(
      convexMutationEffect(() =>
        removeDraftTrack({ stableId: deleteStableId }),
      ),
      { onErrorMessage: setInlineError },
    );
    setRowAction(deleteStableId, undefined);
    setDeleteStableId(null);
    if (outcome !== undefined) {
      clearTrackEdit(deleteStableId);
      toast.success("Track removed.");
    }
  }, [clearTrackEdit, deleteStableId, removeDraftTrack, setRowAction]);

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
    cancelFFAutosave();
    setInlineError(null);
    if (hasAudioDraftOnServer) {
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
    if (hasFFDraftOnServer) {
      setBusy("Discarding…");
      const outcome = await runAdminEffect(runDiscardFF(), {
        onErrorMessage: setInlineError,
      });
      setBusy(null);
      if (outcome === undefined) {
        return false;
      }
    }

    setEdits({});
    clearFFLocal();
    toast.success(
      hasAudioDraftOnServer || hasFFDraftOnServer
        ? "Draft discarded. The editor now matches the published site."
        : "Unsaved changes discarded.",
    );
    return true;
  }, [
    cancelFFAutosave,
    clearFFLocal,
    discardDraftAudioTracks,
    hasAudioDraftOnServer,
    hasFFDraftOnServer,
    runDiscardFF,
    setEdits,
  ]);

  const handlePublish = useCallback(async () => {
    cancelFFAutosave();
    const hadAudioLocalEdits = Object.keys(edits).length > 0;
    const publishAudio = (data?.hasDraftChanges ?? false) || hadAudioLocalEdits;
    const publishFf = hasFFDraftOnServer || hasFFLocalEdits;

    const saved = await savePendingEdits();
    if (!saved) {
      return;
    }
    if (hasFFLocalEdits) {
      const flushed = await flushFFAutosave();
      if (!flushed) return;
    }

    if (!publishAudio && !publishFf) {
      return;
    }

    setInlineError(null);
    setBusy("Publishing…");

    if (publishAudio) {
      const audioOutcome = await runAdminEffect(
        convexMutationEffect(() => publishAudioTracks({})),
        { onErrorMessage: setInlineError },
      );
      if (audioOutcome === undefined) {
        setBusy(null);
        return;
      }
    }

    if (publishFf) {
      const ffOutcome = await runAdminEffect(runPublishFF(), {
        onErrorMessage: setInlineError,
      });
      setBusy(null);
      if (ffOutcome !== undefined) {
        clearFFLocal();
        toast.success("Changes published.");
      }
      return;
    }

    setBusy(null);
    if (publishAudio) {
      toast.success("Changes published.");
    }
  }, [
    cancelFFAutosave,
    clearFFLocal,
    data?.hasDraftChanges,
    edits,
    flushFFAutosave,
    hasFFDraftOnServer,
    hasFFLocalEdits,
    publishAudioTracks,
    runPublishFF,
    savePendingEdits,
  ]);

  /**
   * Nav guard: persist in-debounce marketing toggles and unsaved track fields
   * before leaving the page (mirrors `about-editor` composite flush).
   */
  const flushAllAutosaves = useCallback(async (): Promise<boolean> => {
    if (hasAudioLocalEdits) {
      const ok = await savePendingEdits();
      if (!ok) return false;
    }
    if (hasFFLocalEdits) {
      const ok = await flushFFAutosave();
      if (!ok) return false;
    }
    return true;
  }, [
    flushFFAutosave,
    hasAudioLocalEdits,
    hasFFLocalEdits,
    savePendingEdits,
  ]);

  const { toolbarPortal, editorRef } = useRegisterCmsEditor({
    section: "audio",
    sectionLabel: "Audio portfolio",
    hasDraftOnServer,
    hasLocalEdits,
    publishedAt: mergedPublishedAt,
    publishedByLabel,
    busy,
    autosaveStatus: combinedAutosaveStatus,
    inlineError,
    previewHref: "/preview#audio-portfolio",
    onPublish: () => void handlePublish(),
    onDiscardConfirm: handleDiscardConfirm,
    flush: flushAllAutosaves,
  });

  // Stable ref — see the matching comment in `about-editor.tsx`. An inline
  // arrow would detach/reattach each render, clearing the autosave debounce
  // timer before a one-shot toggle can fire.
  const handleEditorRef = useCallback(
    (el: HTMLDivElement | null) => {
      ffOnUnmount(el);
      editorRef(el);
    },
    [ffOnUnmount, editorRef],
  );

  if (data === undefined || featureFlagsLoading) {
    return <p className="body-text text-foreground/80">Loading audio…</p>;
  }

  const anyUploading = uploadQueue.some(
    (entry) => entry.status === "uploading" || entry.status === "saving",
  );

  return (
    <div
      ref={handleEditorRef}
      className={cn(
        "relative space-y-8 pb-24 transition",
        isDraggingOver &&
          "rounded-xl ring-2 ring-primary ring-offset-4 ring-offset-background",
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={(event) => void handleDrop(event)}
    >
      <fieldset className="space-y-4">
        <legend className="label-text text-muted-foreground">
          Site visibility
        </legend>
        <div className="flex items-start gap-3">
          <Switch
            id="ff-recordings-embedded"
            checked={featureFlagsSource?.recordingsPage ?? false}
            onCheckedChange={setRecordingsPage}
          />
          <div className="space-y-1">
            <label
              htmlFor="ff-recordings-embedded"
              className="body-text-small cursor-pointer text-foreground"
            >
              Recordings page (<code className="text-xs">/recordings</code>)
            </label>
            <p className="body-text-small text-muted-foreground">
              When off, the route returns 404 and the header link is hidden.
            </p>
          </div>
        </div>
      </fieldset>

      {isDraggingOver && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center rounded-xl bg-primary/5 pt-16 sm:pt-24"
          aria-hidden
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-card/95 px-10 py-8 shadow-xl">
            <Music className="size-10 text-primary" aria-hidden />
            <p className="text-lg font-semibold text-foreground">
              Drop audio to upload
            </p>
            <p className="body-text-small text-muted-foreground">
              MP3 or WAV · up to{" "}
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
              Upload MP3 or WAV samples for the homepage “Studio portfolio”
              section. Add optional album art (HTTPS image URL), Spotify, and Apple
              Music links per track. Playback uses Convex signed URLs (
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                &lt;audio src&gt;
              </code>
              ). Draft changes stay private until you publish. Abandoned draft-only
              uploads are removed after 7 days (weekly job).
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,.mp3,.wav"
              multiple
              className="hidden"
              onChange={(event) => void handleFileSelection(event)}
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
              Upload audio
            </Button>
            <p className="body-text-small text-right text-foreground/70">
              MP3 or WAV. Up to {Math.floor(data.limits.maxFileBytes / (1024 * 1024))}MB each.
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
          <Headphones className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="body-text text-foreground/80">
            No tracks yet. Drop MP3 or WAV files here or use Upload audio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {tracks.map((track, index) => {
            const fields = getEditableFields(track);
            const isDirty = edits[track.stableId] !== undefined;
            const rowAction = rowBusy[track.stableId];
            const isRowBusy = rowAction !== undefined;

            return (
              <Card key={track.stableId} className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="body-text-small text-muted-foreground">
                      {formatBytes(track.sizeBytes)} · {track.mimeType}
                      {" · "}
                      {formatDuration(track.durationSec)}
                    </p>
                    {track.url ? (
                      <audio
                        controls
                        className="h-9 w-full max-w-md"
                        src={track.url}
                        crossOrigin="anonymous"
                        preload="metadata"
                      />
                    ) : (
                      <p className="text-sm text-destructive">
                        Playback URL unavailable — re-upload if this persists.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Move up"
                      disabled={index === 0 || busy !== null || isRowBusy}
                      onClick={() => void moveTrack(track.stableId, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Move down"
                      disabled={
                        index === tracks.length - 1 ||
                        busy !== null ||
                        isRowBusy
                      }
                      onClick={() => void moveTrack(track.stableId, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      aria-label="Remove track"
                      disabled={busy !== null || isRowBusy}
                      onClick={() => setDeleteStableId(track.stableId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="body-text-small font-medium text-foreground">
                      Title
                    </label>
                    <Input
                      value={fields.title}
                      onChange={(e) =>
                        updateTrackEdit(track, { title: e.target.value })
                      }
                      maxLength={MAX_TITLE_LENGTH + 20}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="body-text-small font-medium text-foreground">
                      Artist (optional)
                    </label>
                    <Input
                      value={fields.artist}
                      onChange={(e) =>
                        updateTrackEdit(track, { artist: e.target.value })
                      }
                      maxLength={MAX_ARTIST_LENGTH + 20}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="body-text-small font-medium text-foreground">
                      Description
                    </label>
                    <Textarea
                      value={fields.description}
                      onChange={(e) =>
                        updateTrackEdit(track, { description: e.target.value })
                      }
                      rows={3}
                      maxLength={MAX_DESCRIPTION_LENGTH + 50}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="body-text-small font-medium text-foreground">
                      Album art URL (optional, https)
                    </label>
                    <Input
                      value={fields.albumThumbnailUrl}
                      onChange={(e) =>
                        updateTrackEdit(track, {
                          albumThumbnailUrl: e.target.value,
                        })
                      }
                      placeholder="https://…"
                      inputMode="url"
                      autoComplete="off"
                    />
                    {(() => {
                      const preview = httpsImagePreviewUrl(
                        fields.albumThumbnailUrl,
                      );
                      return preview ? (
                        <div className="relative mt-2 aspect-square w-full max-w-[140px] overflow-hidden rounded-sm border border-border bg-muted">
                          <Image
                            src={preview}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div className="space-y-1">
                    <label className="body-text-small font-medium text-foreground">
                      Spotify (optional)
                    </label>
                    <Input
                      value={fields.spotifyUrl}
                      onChange={(e) =>
                        updateTrackEdit(track, { spotifyUrl: e.target.value })
                      }
                      placeholder="https://open.spotify.com/…"
                      inputMode="url"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="body-text-small font-medium text-foreground">
                      Apple Music (optional)
                    </label>
                    <Input
                      value={fields.appleMusicUrl}
                      onChange={(e) =>
                        updateTrackEdit(track, {
                          appleMusicUrl: e.target.value,
                        })
                      }
                      placeholder="https://music.apple.com/…"
                      inputMode="url"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!isDirty || busy !== null || isRowBusy}
                    onClick={() => void saveTrackDetails(track)}
                  >
                    {rowAction === "saving" ? (
                      <Loader2 className="mr-1 size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Save className="mr-1 size-3.5" aria-hidden />
                    )}
                    Save
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {toolbarPortal}

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
              This removes the draft row and deletes the file from storage when
              nothing else references it.
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
