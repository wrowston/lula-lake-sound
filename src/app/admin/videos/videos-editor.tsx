"use client";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { useUser } from "@clerk/nextjs";
import { Effect, pipe } from "effect";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Film,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { runAdminEffect } from "@/lib/admin-run-effect";
import { convexMutationEffect, type CmsAppError } from "@/lib/effect-errors";
import { cn } from "@/lib/utils";
import {
  defaultTitleFromFileName,
  formatDuration,
  getProviderLabel,
  isPlayableForPublish,
  resolveVideoPreview,
  type VideoProvider,
} from "@/lib/video-embed";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

const PROVIDER_OPTIONS: ReadonlyArray<{
  readonly id: VideoProvider;
  readonly label: string;
  readonly hint: string;
}> = [
  {
    id: "youtube",
    label: "YouTube",
    hint: "Paste a watch URL or 11-character video id.",
  },
  {
    id: "vimeo",
    label: "Vimeo",
    hint: "Paste a vimeo.com/video/… link or numeric id.",
  },
  {
    id: "mux",
    label: "Mux",
    hint: "Paste a Mux playback id or stream URL.",
  },
  {
    id: "upload",
    label: "Upload",
    hint: "Upload an MP4, WebM, or QuickTime file (≤100MB).",
  },
];

type VideoItem = {
  readonly stableId: string;
  readonly title: string;
  readonly description: string | null;
  readonly sortOrder: number;
  readonly provider: VideoProvider;
  readonly externalId: string | null;
  readonly playbackUrl: string | null;
  readonly videoStorageId: Id<"_storage"> | null;
  readonly videoUrl: string | null;
  readonly thumbnailStorageId: Id<"_storage"> | null;
  readonly thumbnailUrl: string | null;
  readonly resolvedThumbnailUrl: string | null;
  readonly durationSec: number | null;
};

type VideoEdits = Record<
  string,
  {
    readonly title: string;
    readonly description: string;
    readonly externalId: string;
    readonly playbackUrl: string;
    readonly thumbnailUrl: string;
  }
>;

type RowAction = "saving" | "deleting";
type RowBusy = Record<string, RowAction | undefined>;

interface UploadProgressEntry {
  readonly id: string;
  readonly name: string;
  readonly progress: number;
  readonly status: "uploading" | "saving" | "done" | "error";
  readonly error?: string;
}

interface NewVideoDraft {
  readonly provider: VideoProvider;
  readonly title: string;
  readonly description: string;
  readonly externalId: string;
  readonly playbackUrl: string;
  readonly thumbnailUrl: string;
}

const EMPTY_NEW_VIDEO: NewVideoDraft = {
  provider: "youtube",
  title: "",
  description: "",
  externalId: "",
  playbackUrl: "",
  thumbnailUrl: "",
};

export function validateVideoFields(
  title: string,
  description: string,
): string | null {
  const t = title.trim();
  if (t.length === 0) return "Title is required.";
  if (t.length > MAX_TITLE_LENGTH) {
    return `Title must be at most ${MAX_TITLE_LENGTH} characters.`;
  }
  if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
    return `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`;
  }
  return null;
}

function buildUpdateDraftVideoArgs(
  video: Pick<VideoItem, "stableId" | "provider">,
  fields: VideoEdits[string],
) {
  const trimmedExternal = fields.externalId.trim();
  const trimmedPlayback = fields.playbackUrl.trim();
  const trimmedThumb = fields.thumbnailUrl.trim();
  return {
    stableId: video.stableId,
    title: fields.title.trim(),
    description:
      fields.description.trim().length > 0
        ? fields.description.trim()
        : null,
    ...(video.provider !== "upload" && trimmedExternal.length > 0
      ? { externalId: trimmedExternal }
      : {}),
    ...(video.provider === "mux"
      ? {
          playbackUrl:
            trimmedPlayback.length > 0 ? trimmedPlayback : null,
        }
      : {}),
    thumbnailUrl: trimmedThumb.length > 0 ? trimmedThumb : null,
  };
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
    xhr.setRequestHeader("Content-Type", file.type);
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

export function VideosEditor() {
  return (
    <>
      <AuthLoading>
        <VideosEditorSkeleton />
      </AuthLoading>

      <Unauthenticated>
        <p className="body-text text-foreground/80">
          Sign in to manage the video portfolio.
        </p>
      </Unauthenticated>

      <Authenticated>
        <VideosEditorForm />
      </Authenticated>
    </>
  );
}

function VideosEditorSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

function VideosEditorForm() {
  const { user } = useUser();
  const data = useQuery(api.admin.videos.listDraftVideos);

  const generateUploadUrl = useMutation(api.admin.videos.generateUploadUrl);
  const createDraftVideo = useMutation(api.admin.videos.createDraftVideo);
  const updateDraftVideo = useMutation(api.admin.videos.updateDraftVideo);
  const removeDraftVideo = useMutation(api.admin.videos.removeDraftVideo);
  const reorderDraftVideos = useMutation(api.admin.videos.reorderDraftVideos);
  const publishVideos = useMutation(api.admin.videos.publishVideos);
  const discardDraftVideos = useMutation(
    api.admin.videos.discardDraftVideos,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<RowBusy>({});
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [edits, setEdits] = useState<VideoEdits>({});
  const [deleteStableId, setDeleteStableId] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newVideo, setNewVideo] = useState<NewVideoDraft>(EMPTY_NEW_VIDEO);
  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});
  const [uploadQueue, setUploadQueue] = useState<UploadProgressEntry[]>([]);

  const videos = useMemo(
    () => (data?.videos ?? []) as VideoItem[],
    [data?.videos],
  );

  const limits = data?.limits ?? null;
  const legacyMaxVideos = data?.maxVideos;
  const maxVideos = limits?.maxVideos ?? legacyMaxVideos ?? 24;
  const acceptedMimeTypes = useMemo(
    () => limits?.acceptedMimeTypes ?? [],
    [limits?.acceptedMimeTypes],
  );
  const maxUploadBytes = limits?.maxUploadBytes ?? 100 * 1024 * 1024;

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

  const getEditableFields = useCallback(
    (video: VideoItem) => ({
      title: edits[video.stableId]?.title ?? video.title,
      description: edits[video.stableId]?.description ?? video.description ?? "",
      externalId: edits[video.stableId]?.externalId ?? video.externalId ?? "",
      playbackUrl: edits[video.stableId]?.playbackUrl ?? video.playbackUrl ?? "",
      thumbnailUrl:
        edits[video.stableId]?.thumbnailUrl ?? video.thumbnailUrl ?? "",
    }),
    [edits],
  );

  const updateVideoEdit = useCallback(
    (
      video: VideoItem,
      patch: Partial<{
        title: string;
        description: string;
        externalId: string;
        playbackUrl: string;
        thumbnailUrl: string;
      }>,
    ) => {
      setEdits((current) => {
        const base = {
          title: current[video.stableId]?.title ?? video.title,
          description:
            current[video.stableId]?.description ?? video.description ?? "",
          externalId:
            current[video.stableId]?.externalId ?? video.externalId ?? "",
          playbackUrl:
            current[video.stableId]?.playbackUrl ?? video.playbackUrl ?? "",
          thumbnailUrl:
            current[video.stableId]?.thumbnailUrl ?? video.thumbnailUrl ?? "",
        };
        const next = {
          title: patch.title ?? base.title,
          description: patch.description ?? base.description,
          externalId: patch.externalId ?? base.externalId,
          playbackUrl: patch.playbackUrl ?? base.playbackUrl,
          thumbnailUrl: patch.thumbnailUrl ?? base.thumbnailUrl,
        };
        const matchesSaved =
          next.title === video.title &&
          next.description === (video.description ?? "") &&
          next.externalId === (video.externalId ?? "") &&
          next.playbackUrl === (video.playbackUrl ?? "") &&
          next.thumbnailUrl === (video.thumbnailUrl ?? "");
        if (matchesSaved) {
          const rest = { ...current };
          delete rest[video.stableId];
          return rest;
        }
        return { ...current, [video.stableId]: next };
      });
    },
    [],
  );

  const clearVideoEdit = useCallback((stableId: string) => {
    setEdits((current) => {
      const rest = { ...current };
      delete rest[stableId];
      return rest;
    });
  }, []);

  const togglePreview = useCallback((stableId: string) => {
    setPreviewOpen((prev) => ({ ...prev, [stableId]: !prev[stableId] }));
  }, []);

  const saveVideoDetails = useCallback(
    async (video: VideoItem): Promise<boolean> => {
      const fields = getEditableFields(video);
      const validationError = validateVideoFields(fields.title, fields.description);
      if (validationError) {
        setInlineError(validationError);
        toast.error(validationError);
        return false;
      }

      setInlineError(null);
      setRowAction(video.stableId, "saving");
      const outcome = await runAdminEffect(
        convexMutationEffect(() =>
          updateDraftVideo(buildUpdateDraftVideoArgs(video, fields)),
        ),
        { onErrorMessage: setInlineError },
      );
      setRowAction(video.stableId, undefined);

      if (outcome === undefined) {
        return false;
      }
      clearVideoEdit(video.stableId);
      toast.success("Video saved.");
      return true;
    },
    [clearVideoEdit, getEditableFields, setRowAction, updateDraftVideo],
  );

  const savePendingEdits = useCallback(async (): Promise<boolean> => {
    const dirty = videos.filter((v) => edits[v.stableId] !== undefined);
    if (dirty.length === 0) return true;

    for (const video of dirty) {
      const fields = getEditableFields(video);
      const validationError = validateVideoFields(
        fields.title,
        fields.description,
      );
      if (validationError) {
        setInlineError(validationError);
        toast.error(`${video.title || "Video"}: ${validationError}`);
        return false;
      }
    }

    const effects = dirty.map((video) => {
      const fields = getEditableFields(video);
      return convexMutationEffect(() =>
        updateDraftVideo(buildUpdateDraftVideoArgs(video, fields)),
      );
    });

    const outcome = await runAction("Saving…", sequentialEffects(effects));
    if (outcome === undefined) return false;
    setEdits({});
    return true;
  }, [edits, getEditableFields, runAction, updateDraftVideo, videos]);

  const persistOrder = useCallback(
    async (orderedStableIds: string[]): Promise<boolean> => {
      const outcome = await runAction(
        "Reordering…",
        convexMutationEffect(() =>
          reorderDraftVideos({ orderedStableIds }),
        ),
      );
      return outcome !== undefined;
    },
    [reorderDraftVideos, runAction],
  );

  const moveVideo = useCallback(
    async (stableId: string, direction: -1 | 1) => {
      const index = videos.findIndex((v) => v.stableId === stableId);
      if (index === -1) return;
      const target = index + direction;
      if (target < 0 || target >= videos.length) return;
      const reordered = [...videos];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(target, 0, moved);
      const ok = await persistOrder(reordered.map((v) => v.stableId));
      if (ok) {
        toast.success("Video order updated.");
      }
    },
    [persistOrder, videos],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteStableId) return;
    setInlineError(null);
    setRowAction(deleteStableId, "deleting");
    const outcome = await runAdminEffect(
      convexMutationEffect(() =>
        removeDraftVideo({ stableId: deleteStableId }),
      ),
      { onErrorMessage: setInlineError },
    );
    setRowAction(deleteStableId, undefined);
    setDeleteStableId(null);
    if (outcome !== undefined) {
      clearVideoEdit(deleteStableId);
      toast.success("Video removed.");
    }
  }, [clearVideoEdit, deleteStableId, removeDraftVideo, setRowAction]);

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
    setInlineError(null);
    if (data?.meta?.hasDraftChanges) {
      const outcome = await runAdminEffect(
        convexMutationEffect(() => discardDraftVideos({})),
        { onErrorMessage: setInlineError },
      );
      if (outcome === undefined) return false;
    }
    setEdits({});
    toast.success(
      data?.meta?.hasDraftChanges
        ? "Draft discarded. The editor matches the published list."
        : "Unsaved changes discarded.",
    );
    return true;
  }, [data?.meta?.hasDraftChanges, discardDraftVideos]);

  const handlePublish = useCallback(async () => {
    const saved = await savePendingEdits();
    if (!saved) return;

    const outcome = await runAction(
      "Publishing…",
      convexMutationEffect(() => publishVideos({})),
    );
    if (outcome !== undefined) {
      toast.success("Videos published.");
    }
  }, [publishVideos, runAction, savePendingEdits]);

  const handleToolbarPublish = useCallback(() => {
    void handlePublish();
  }, [handlePublish]);

  // -------------------- Add new video flow --------------------

  const resetAddPanel = useCallback(() => {
    setNewVideo(EMPTY_NEW_VIDEO);
    setShowAddPanel(false);
  }, []);

  const submitNewEmbed = useCallback(async () => {
    const titleError = validateVideoFields(newVideo.title, newVideo.description);
    if (titleError) {
      toast.error(titleError);
      return;
    }
    if (newVideo.provider !== "upload" && newVideo.externalId.trim().length === 0) {
      toast.error("Video URL or id is required.");
      return;
    }

    const trimmedExternal = newVideo.externalId.trim();
    const trimmedPlayback = newVideo.playbackUrl.trim();
    const trimmedThumb = newVideo.thumbnailUrl.trim();

    const outcome = await runAction(
      "Adding…",
      convexMutationEffect(() =>
        createDraftVideo({
          provider: newVideo.provider,
          title: newVideo.title.trim(),
          ...(newVideo.description.trim().length > 0
            ? { description: newVideo.description.trim() }
            : {}),
          ...(newVideo.provider !== "upload"
            ? { externalId: trimmedExternal }
            : {}),
          ...(newVideo.provider === "mux" && trimmedPlayback.length > 0
            ? { playbackUrl: trimmedPlayback }
            : {}),
          ...(trimmedThumb.length > 0 ? { thumbnailUrl: trimmedThumb } : {}),
        }),
      ),
    );

    if (outcome) {
      toast.success(`${getProviderLabel(newVideo.provider)} video added.`);
      resetAddPanel();
    }
  }, [createDraftVideo, newVideo, resetAddPanel, runAction]);

  // -------------------- Upload flow --------------------

  const updateUploadEntry = useCallback(
    (id: string, patch: Partial<UploadProgressEntry>) => {
      setUploadQueue((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
      );
    },
    [],
  );

  const processUploadFiles = useCallback(
    async (incoming: File[]) => {
      if (incoming.length === 0 || !data) return;
      setInlineError(null);

      const remainingSlots = Math.max(0, maxVideos - videos.length);
      if (remainingSlots === 0) {
        toast.error(
          `Video list is full (${maxVideos}). Remove a video first.`,
        );
        return;
      }
      const filesToUpload =
        incoming.length > remainingSlots
          ? (toast.error(
              `Only ${remainingSlots} slot${
                remainingSlots === 1 ? "" : "s"
              } left; skipping the rest.`,
            ),
            incoming.slice(0, remainingSlots))
          : incoming;

      setBusy("Uploading…");
      let successCount = 0;
      const acceptedSet = new Set<string>(acceptedMimeTypes);

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

        if (!acceptedSet.has(file.type)) {
          const msg = `${file.name}: only MP4, WebM, or QuickTime files are allowed.`;
          toast.error(msg);
          updateUploadEntry(entryId, { status: "error", error: msg });
          continue;
        }
        if (file.size > maxUploadBytes) {
          const msg = `${file.name}: file must be ${Math.floor(
            maxUploadBytes / (1024 * 1024),
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
        } catch (error) {
          const msg =
            error instanceof Error
              ? `${file.name}: ${error.message}`
              : `${file.name}: upload failed.`;
          toast.error(msg);
          updateUploadEntry(entryId, { status: "error", error: msg });
          continue;
        }

        updateUploadEntry(entryId, { status: "saving", progress: 1 });
        const saved = await runAdminEffect(
          convexMutationEffect(() =>
            createDraftVideo({
              provider: "upload",
              title: defaultTitleFromFileName(file.name),
              videoStorageId: storageId,
            }),
          ),
          { onErrorMessage: setInlineError },
        );

        if (saved !== undefined) {
          successCount += 1;
          updateUploadEntry(entryId, { status: "done" });
        } else {
          updateUploadEntry(entryId, {
            status: "error",
            error: `${file.name}: could not save video.`,
          });
        }
      }

      setBusy(null);
      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? "Video uploaded."
            : `${successCount} videos uploaded.`,
        );
      }

      window.setTimeout(() => {
        setUploadQueue((prev) =>
          prev.filter((entry) => entry.status === "error"),
        );
      }, 2500);
    },
    [
      acceptedMimeTypes,
      createDraftVideo,
      data,
      generateUploadUrl,
      maxUploadBytes,
      maxVideos,
      updateUploadEntry,
      videos.length,
    ],
  );

  const handleFileSelection = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      await processUploadFiles(files);
    },
    [processUploadFiles],
  );

  // -------------------- Toolbar registration --------------------

  const hasDraftOnServer = data?.meta?.hasDraftChanges ?? false;
  const hasLocalEdits = Object.keys(edits).length > 0;
  const publishedAt = data?.meta?.publishedAt ?? null;
  const publishedByLabel =
    data?.meta?.publishedBy && user?.id === data.meta.publishedBy
      ? "You"
      : undefined;

  const { toolbarPortal, editorRef } = useRegisterCmsEditor({
    section: "videos",
    sectionLabel: "Video portfolio",
    hasDraftOnServer,
    hasLocalEdits,
    publishedAt,
    publishedByLabel,
    busy,
    autosaveStatus: "idle",
    inlineError,
    previewHref: "/preview",
    onPublish: handleToolbarPublish,
    onDiscardConfirm: handleDiscardConfirm,
  });

  if (data === undefined) {
    return <VideosEditorSkeleton />;
  }

  const slotsRemaining = Math.max(0, maxVideos - videos.length);
  const allowAdd = slotsRemaining > 0 && busy === null;
  const anyUploading = uploadQueue.some(
    (entry) => entry.status === "uploading" || entry.status === "saving",
  );

  return (
    <div ref={editorRef} className="space-y-8 pb-24">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedMimeTypes.join(",")}
        multiple
        className="hidden"
        onChange={(event) => void handleFileSelection(event)}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Video portfolio
          </h2>
          <p className="body-text-small max-w-2xl text-foreground/85">
            Embed videos from YouTube, Vimeo, or Mux, or upload short clips
            directly to Convex storage. Order, edits, and additions live on
            the draft until you publish — preview each panel inline before
            it goes live.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={!allowAdd}
          >
            {anyUploading ? (
              <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="mr-1 size-4" aria-hidden />
            )}
            Upload file
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => setShowAddPanel((v) => !v)}
            disabled={!allowAdd}
          >
            <Plus className="mr-1 size-4" aria-hidden />
            Add embed
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {slotsRemaining === 0
          ? `Video list is full (${maxVideos}/${maxVideos}). Remove a video to add another.`
          : `${videos.length}/${maxVideos} videos in the draft list.`}
      </p>

      {showAddPanel ? (
        <AddVideoPanel
          value={newVideo}
          onChange={setNewVideo}
          onCancel={resetAddPanel}
          onSubmit={() => void submitNewEmbed()}
          busy={busy === "Adding…"}
          disabled={!allowAdd}
        />
      ) : null}

      {uploadQueue.length > 0 ? (
        <UploadTray queue={uploadQueue} anyUploading={anyUploading} />
      ) : null}

      {videos.length === 0 ? (
        <EmptyState
          onAdd={() => setShowAddPanel(true)}
          onUpload={() => fileInputRef.current?.click()}
          disabled={busy !== null}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {videos.map((video, index) => {
            const fields = getEditableFields(video);
            const isDirty = edits[video.stableId] !== undefined;
            const rowAction = rowBusy[video.stableId];
            const isRowBusy = rowAction !== undefined;
            const titleInvalid = fields.title.trim().length === 0;
            const willPublish = isPlayableForPublish({
              title: fields.title,
              provider: video.provider,
              externalId: fields.externalId,
              videoStorageId: video.videoStorageId,
              videoUrl: video.videoUrl,
            });
            const previewIsOpen = previewOpen[video.stableId] ?? true;

            return (
              <li key={video.stableId}>
                <VideoCard
                  video={video}
                  index={index}
                  totalCount={videos.length}
                  fields={fields}
                  isDirty={isDirty}
                  isRowBusy={isRowBusy}
                  rowAction={rowAction}
                  titleInvalid={titleInvalid}
                  willPublish={willPublish}
                  previewIsOpen={previewIsOpen}
                  busy={busy}
                  onUpdate={(patch) => updateVideoEdit(video, patch)}
                  onSave={() => void saveVideoDetails(video)}
                  onDiscardEdit={() => clearVideoEdit(video.stableId)}
                  onTogglePreview={() => togglePreview(video.stableId)}
                  onMoveUp={() => void moveVideo(video.stableId, -1)}
                  onMoveDown={() => void moveVideo(video.stableId, 1)}
                  onDelete={() => setDeleteStableId(video.stableId)}
                />
              </li>
            );
          })}
        </ul>
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
            <AlertDialogTitle>Remove video?</AlertDialogTitle>
            <AlertDialogDescription>
              The draft row is deleted immediately. Uploaded video and
              thumbnail blobs are removed from storage when nothing else
              references them. Publish to apply on the public site.
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
                  Removing…
                </>
              ) : (
                "Remove video"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// -------------------------------------------------------------------------
// Add panel
// -------------------------------------------------------------------------

interface AddVideoPanelProps {
  readonly value: NewVideoDraft;
  readonly onChange: (value: NewVideoDraft) => void;
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
  readonly busy: boolean;
  readonly disabled: boolean;
}

function AddVideoPanel({
  value,
  onChange,
  onCancel,
  onSubmit,
  busy,
  disabled,
}: AddVideoPanelProps) {
  const formId = useId();

  const setProvider = useCallback(
    (next: VideoProvider) => {
      if (next === "upload") {
        // Upload uses the dedicated drag-drop path, not this form.
        return;
      }
      onChange({ ...value, provider: next });
    },
    [onChange, value],
  );

  const providerHint =
    PROVIDER_OPTIONS.find((opt) => opt.id === value.provider)?.hint ?? "";

  return (
    <Card className="space-y-5 border-primary/30 bg-card/95 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Add embedded video
          </h3>
          <p className="text-xs text-muted-foreground">
            Pick a provider, paste the URL or id, and the public site will
            render a privacy-enhanced player after publish.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close add panel"
          onClick={onCancel}
          disabled={busy}
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>

      <div role="radiogroup" aria-label="Provider" className="flex flex-wrap gap-2">
        {PROVIDER_OPTIONS.filter((opt) => opt.id !== "upload").map((opt) => {
          const active = value.provider === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setProvider(opt.id)}
              disabled={disabled || busy}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">{providerHint}</p>

      <div className="grid gap-3">
        <label className="space-y-1" htmlFor={`${formId}-title`}>
          <span className="text-sm font-medium text-foreground/90">
            Title <span className="text-destructive">*</span>
          </span>
          <Input
            id={`${formId}-title`}
            value={value.title}
            maxLength={MAX_TITLE_LENGTH}
            placeholder="e.g. Live session at the lake house"
            disabled={busy}
            onChange={(event) =>
              onChange({ ...value, title: event.target.value })
            }
          />
        </label>

        <label className="space-y-1" htmlFor={`${formId}-external`}>
          <span className="text-sm font-medium text-foreground/90">
            {value.provider === "mux"
              ? "Mux playback id or URL"
              : `${getProviderLabel(value.provider)} URL or id`}{" "}
            <span className="text-destructive">*</span>
          </span>
          <Input
            id={`${formId}-external`}
            value={value.externalId}
            placeholder={
              value.provider === "youtube"
                ? "https://www.youtube.com/watch?v=…"
                : value.provider === "vimeo"
                  ? "https://vimeo.com/123456789"
                  : "abc123XYZ (playback id)"
            }
            disabled={busy}
            onChange={(event) =>
              onChange({ ...value, externalId: event.target.value })
            }
          />
        </label>

        {value.provider === "mux" ? (
          <label className="space-y-1" htmlFor={`${formId}-playback`}>
            <span className="text-sm font-medium text-foreground/90">
              Mux HLS playback URL (optional)
            </span>
            <Input
              id={`${formId}-playback`}
              value={value.playbackUrl}
              placeholder="https://stream.mux.com/…m3u8"
              disabled={busy}
              onChange={(event) =>
                onChange({ ...value, playbackUrl: event.target.value })
              }
            />
          </label>
        ) : null}

        <label className="space-y-1" htmlFor={`${formId}-thumb`}>
          <span className="text-sm font-medium text-foreground/90">
            Thumbnail URL (optional)
          </span>
          <Input
            id={`${formId}-thumb`}
            value={value.thumbnailUrl}
            placeholder="https://i.ytimg.com/… or https://i.vimeocdn.com/…"
            disabled={busy}
            onChange={(event) =>
              onChange({ ...value, thumbnailUrl: event.target.value })
            }
          />
          <span className="text-xs text-muted-foreground">
            Provider thumbnails on YouTube, Vimeo, Mux, or Unsplash CDN are
            accepted. Other hosts will be rejected on save.
          </span>
        </label>

        <label className="space-y-1" htmlFor={`${formId}-description`}>
          <span className="text-sm font-medium text-foreground/90">
            Description (optional)
          </span>
          <Textarea
            id={`${formId}-description`}
            value={value.description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={3}
            placeholder="Short context shown alongside the embed."
            disabled={busy}
            onChange={(event) =>
              onChange({ ...value, description: event.target.value })
            }
          />
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="default"
          onClick={onSubmit}
          disabled={busy || disabled}
        >
          {busy ? (
            <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="mr-1 size-4" aria-hidden />
          )}
          Add to draft
        </Button>
      </div>
    </Card>
  );
}

// -------------------------------------------------------------------------
// Empty state
// -------------------------------------------------------------------------

function EmptyState({
  onAdd,
  onUpload,
  disabled,
}: {
  readonly onAdd: () => void;
  readonly onUpload: () => void;
  readonly disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Film className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">
          No videos in the draft yet
        </p>
        <p className="body-text-small max-w-md text-foreground/80">
          Embed videos from YouTube, Vimeo, or Mux for marketing pages, or
          upload a short MP4 / WebM directly. Owners can preview each one
          before publish.
        </p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="outline" onClick={onUpload} disabled={disabled}>
          <Upload className="mr-1 size-4" aria-hidden />
          Upload file
        </Button>
        <Button type="button" onClick={onAdd} disabled={disabled}>
          <Plus className="mr-1 size-4" aria-hidden />
          Add embed
        </Button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// Upload tray
// -------------------------------------------------------------------------

function UploadTray({
  queue,
  anyUploading,
}: {
  readonly queue: ReadonlyArray<UploadProgressEntry>;
  readonly anyUploading: boolean;
}) {
  return (
    <div
      className="space-y-2 rounded-xl border border-border bg-muted/30 p-4"
      aria-live="polite"
      aria-busy={anyUploading}
    >
      <p className="body-text-small font-medium text-foreground/85">
        {anyUploading ? "Uploading videos…" : "Upload results"}
      </p>
      <ul className="space-y-2">
        {queue.map((entry) => (
          <li key={entry.id} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span
                className="truncate text-foreground/85"
                title={entry.name}
              >
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
            {entry.error ? (
              <p className="text-xs text-destructive">{entry.error}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------------------------------------------------------------------------
// Video card
// -------------------------------------------------------------------------

interface VideoCardProps {
  readonly video: VideoItem;
  readonly index: number;
  readonly totalCount: number;
  readonly fields: {
    readonly title: string;
    readonly description: string;
    readonly externalId: string;
    readonly playbackUrl: string;
    readonly thumbnailUrl: string;
  };
  readonly isDirty: boolean;
  readonly isRowBusy: boolean;
  readonly rowAction: RowAction | undefined;
  readonly titleInvalid: boolean;
  readonly willPublish: boolean;
  readonly previewIsOpen: boolean;
  readonly busy: string | null;
  readonly onUpdate: (
    patch: Partial<{
      title: string;
      description: string;
      externalId: string;
      playbackUrl: string;
      thumbnailUrl: string;
    }>,
  ) => void;
  readonly onSave: () => void;
  readonly onDiscardEdit: () => void;
  readonly onTogglePreview: () => void;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
  readonly onDelete: () => void;
}

function VideoCard({
  video,
  index,
  totalCount,
  fields,
  isDirty,
  isRowBusy,
  rowAction,
  titleInvalid,
  willPublish,
  previewIsOpen,
  busy,
  onUpdate,
  onSave,
  onDiscardEdit,
  onTogglePreview,
  onMoveUp,
  onMoveDown,
  onDelete,
}: VideoCardProps) {
  const headingId = useId();
  const titleFieldId = useId();
  const descFieldId = useId();
  const externalFieldId = useId();
  const playbackFieldId = useId();
  const thumbFieldId = useId();
  const headingTitle =
    fields.title.trim().length > 0 ? fields.title : "Untitled video";
  const providerLabel = getProviderLabel(video.provider);
  const duration = formatDuration(video.durationSec);

  const preview = useMemo(
    () =>
      resolveVideoPreview(
        {
          provider: video.provider,
          externalId: fields.externalId.trim(),
          videoUrl: video.videoUrl,
          playbackUrl: fields.playbackUrl.trim(),
          thumbnailUrl: fields.thumbnailUrl.trim() || video.resolvedThumbnailUrl,
        },
        { title: headingTitle },
      ),
    [
      fields.externalId,
      fields.playbackUrl,
      fields.thumbnailUrl,
      headingTitle,
      video.provider,
      video.resolvedThumbnailUrl,
      video.videoUrl,
    ],
  );

  return (
    <Card
      aria-labelledby={headingId}
      className={cn(
        "flex h-full flex-col gap-4 p-4 transition",
        isRowBusy && "pointer-events-none opacity-90",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
            Video #{index + 1} · {providerLabel}
            {duration ? ` · ${duration}` : ""}
          </p>
          <h3
            id={headingId}
            className="truncate text-base font-semibold leading-tight text-foreground"
          >
            {headingTitle}
          </h3>
          {video.provider === "upload" && video.videoUrl ? (
            <p className="truncate text-[11px] text-muted-foreground">
              Convex storage · {video.videoStorageId}
            </p>
          ) : video.externalId ? (
            <p className="truncate text-[11px] text-muted-foreground">
              {providerLabel} id · {video.externalId}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Move video up"
            disabled={index === 0 || busy !== null || isRowBusy}
            onClick={onMoveUp}
          >
            <ArrowUp className="size-4 stroke-[2.25]" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Move video down"
            disabled={index === totalCount - 1 || busy !== null || isRowBusy}
            onClick={onMoveDown}
          >
            <ArrowDown className="size-4 stroke-[2.25]" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove video"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={busy !== null || isRowBusy}
            onClick={onDelete}
          >
            {rowAction === "deleting" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-4 stroke-[2.25]" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      <PreviewPanel
        preview={preview}
        title={headingTitle}
        previewIsOpen={previewIsOpen}
        onTogglePreview={onTogglePreview}
      />

      <div className="grid gap-2.5">
        <label className="space-y-1" htmlFor={titleFieldId}>
          <span className="text-[11px] font-medium text-foreground/90">
            Title <span className="text-destructive">*</span>
          </span>
          <Input
            id={titleFieldId}
            value={fields.title}
            maxLength={MAX_TITLE_LENGTH}
            aria-invalid={titleInvalid || undefined}
            aria-describedby={titleInvalid ? `${titleFieldId}-hint` : undefined}
            onChange={(event) => onUpdate({ title: event.target.value })}
            className="h-8 py-1 text-sm"
          />
          {titleInvalid ? (
            <span
              id={`${titleFieldId}-hint`}
              className="block text-xs text-amber-600 dark:text-amber-400"
            >
              Title is required before publish.
            </span>
          ) : null}
        </label>

        {video.provider !== "upload" ? (
          <label className="space-y-1" htmlFor={externalFieldId}>
            <span className="text-[11px] font-medium text-foreground/90">
              {video.provider === "mux"
                ? "Mux playback id"
                : `${providerLabel} URL or id`}{" "}
              <span className="text-destructive">*</span>
            </span>
            <Input
              id={externalFieldId}
              value={fields.externalId}
              onChange={(event) =>
                onUpdate({ externalId: event.target.value })
              }
              className="h-8 py-1 text-sm font-mono"
            />
          </label>
        ) : null}

        {video.provider === "mux" ? (
          <label className="space-y-1" htmlFor={playbackFieldId}>
            <span className="text-[11px] font-medium text-foreground/90">
              Mux HLS URL (optional)
            </span>
            <Input
              id={playbackFieldId}
              value={fields.playbackUrl}
              onChange={(event) =>
                onUpdate({ playbackUrl: event.target.value })
              }
              className="h-8 py-1 text-sm font-mono"
            />
          </label>
        ) : null}

        <label className="space-y-1" htmlFor={thumbFieldId}>
          <span className="text-[11px] font-medium text-foreground/90">
            Thumbnail URL (optional)
          </span>
          <Input
            id={thumbFieldId}
            value={fields.thumbnailUrl}
            placeholder="https://i.ytimg.com/…"
            onChange={(event) =>
              onUpdate({ thumbnailUrl: event.target.value })
            }
            className="h-8 py-1 text-sm font-mono"
          />
        </label>

        <label className="space-y-1" htmlFor={descFieldId}>
          <span className="text-[11px] font-medium text-foreground/90">
            Description
          </span>
          <Textarea
            id={descFieldId}
            value={fields.description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={2}
            onChange={(event) =>
              onUpdate({ description: event.target.value })
            }
            className="min-h-[2.5rem] max-h-32 resize-y py-1.5 text-sm [field-sizing:fixed]"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium",
            willPublish
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-amber-700 dark:text-amber-300",
          )}
        >
          {willPublish ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Film className="size-3.5" aria-hidden />
          )}
          {willPublish
            ? "Ready to publish"
            : "Needs title + playable reference"}
        </span>
        <div className="flex items-center gap-2">
          {isDirty ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDiscardEdit}
              disabled={busy !== null || isRowBusy}
            >
              Reset
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!isDirty || busy !== null || isRowBusy}
            onClick={onSave}
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
}

// -------------------------------------------------------------------------
// Preview panel
// -------------------------------------------------------------------------

interface PreviewPanelProps {
  readonly preview: ReturnType<typeof resolveVideoPreview>;
  readonly title: string;
  readonly previewIsOpen: boolean;
  readonly onTogglePreview: () => void;
}

function PreviewPanel({
  preview,
  title,
  previewIsOpen,
  onTogglePreview,
}: PreviewPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
          Preview · {preview.providerLabel}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={previewIsOpen}
          onClick={onTogglePreview}
          className="h-7 gap-1 px-2 text-[11px]"
        >
          {previewIsOpen ? (
            <EyeOff className="size-3.5" aria-hidden />
          ) : (
            <Eye className="size-3.5" aria-hidden />
          )}
          {previewIsOpen ? "Hide" : "Show"}
        </Button>
      </div>

      {previewIsOpen ? (
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-lg border border-border bg-black",
            // Aspect-ratio wrapper — survives narrow mobile widths and keeps
            // YouTube/Vimeo iframes legible without media queries.
            "aspect-video",
          )}
        >
          {preview.kind === "iframe" ? (
            <iframe
              src={preview.src}
              title={`Preview: ${title}`}
              loading="lazy"
              allow={preview.allow}
              allowFullScreen={preview.allowFullScreen}
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 size-full"
            />
          ) : preview.kind === "video" ? (
            <video
              key={preview.src}
              controls
              preload="metadata"
              {...(preview.poster ? { poster: preview.poster } : {})}
              className="absolute inset-0 size-full bg-black object-contain"
              aria-label={`Preview: ${title}`}
            >
              <source src={preview.src} />
              Your browser does not support embedded video.
            </video>
          ) : (
            <PreviewFallback reason={preview.reason} />
          )}
        </div>
      ) : null}
    </div>
  );
}

function PreviewFallback({ reason }: { readonly reason: string }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80">
        <ImagePlus className="size-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-white">No preview yet</p>
      <p className="max-w-xs text-xs text-white/70">{reason}</p>
    </div>
  );
}
