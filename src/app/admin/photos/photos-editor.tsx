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
  GALLERY_CATEGORY_ADMIN_OPTIONS,
  type GalleryCategorySlug,
} from "../../../../convex/galleryPhotos";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
} from "react";
import { Effect } from "effect";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { SiteVisibilityRow } from "@/components/admin/site-visibility-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { useRegisterCmsEditor } from "@/components/admin/cms-workspace";
import {
  convexMutationEffect,
  sequentialEffects,
  type CmsAppError,
} from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { cn } from "@/lib/utils";
import { PhotosEditorSkeleton } from "./photos-editor-skeleton";

const MAX_ALT_LENGTH = 240;
const MAX_CAPTION_LENGTH = 600;
/**
 * Custom drag MIME used for photo reordering. Using a namespaced string lets us
 * distinguish a reorder drag from a browser file drag (which surfaces "Files"
 * in dataTransfer.types) so the upload dropzone and the row reorder target
 * don't fight each other.
 */
const REORDER_MIME = "application/x-lls-photo-reorder";

/** Re-export for tests; canonical definitions live in `convex/galleryPhotos.ts`. */
export const GALLERY_CATEGORY_OPTIONS = GALLERY_CATEGORY_ADMIN_OPTIONS;

type PhotoItem = {
  stableId: string;
  storageId: Id<"_storage">;
  url: string | null;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  contentType: string;
  sizeBytes: number;
  originalFileName: string | null;
  categories: readonly string[];
  showInCarousel: boolean;
  showInGallery: boolean;
};

type PhotoEdits = Record<
  string,
  {
    alt: string;
    caption: string;
    categories: readonly GalleryCategorySlug[];
    showInCarousel: boolean;
    showInGallery: boolean;
  }
>;

/** Per-row action state — lets us show a spinner on just the affected row. */
type RowAction = "saving" | "deleting";
type RowBusy = Record<string, RowAction | undefined>;

/** Per-file upload progress entry shown in the upload tray. */
type UploadProgressEntry = {
  readonly id: string;
  readonly name: string;
  /** Fraction 0..1 of bytes uploaded to Convex storage. */
  readonly progress: number;
  readonly status: "uploading" | "saving" | "done" | "error";
  readonly error?: string;
};

export function defaultAltFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length === 0) {
    return "Studio photo";
  }
  return normalized[0].toUpperCase() + normalized.slice(1);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validatePhotoFields(alt: string, caption: string): string | null {
  const trimmedAlt = alt.trim();
  if (trimmedAlt.length === 0) {
    return "Alt text is required.";
  }
  if (trimmedAlt.length > MAX_ALT_LENGTH) {
    return `Alt text must be at most ${MAX_ALT_LENGTH} characters.`;
  }
  if (caption.trim().length > MAX_CAPTION_LENGTH) {
    return `Caption must be at most ${MAX_CAPTION_LENGTH} characters.`;
  }
  return null;
}

/**
 * Equality on category arrays. Order matters for storage (we always write
 * canonical order from the convex helper) so the published rows and draft
 * rows compare cleanly with `JSON.stringify`. The admin UI also writes
 * canonical order via `selectedSlugs`, so a string-equal compare is enough
 * to detect "no change".
 */
export function sameCategories(
  a: readonly string[],
  b: readonly string[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Canonical order matching `GALLERY_CATEGORY_OPTIONS` for predictable diffs. */
function canonicaliseCategories(
  selected: ReadonlySet<GalleryCategorySlug>,
): GalleryCategorySlug[] {
  return GALLERY_CATEGORY_OPTIONS.filter((option) => selected.has(option.slug)).map(
    (option) => option.slug,
  );
}

async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const dims = await new Promise<{ width: number; height: number } | null>(
      (resolve) => {
        const image = new window.Image();
        image.onload = () => {
          resolve({
            width: image.naturalWidth,
            height: image.naturalHeight,
          });
        };
        image.onerror = () => resolve(null);
        image.src = objectUrl;
      },
    );
    return dims;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Upload a single file to a Convex upload URL with progress reporting.
 * Returns the resulting storageId on success; throws a readable Error otherwise.
 */
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

export function PhotosEditor() {
  return (
    <>
      <AuthLoading>
        <p className="body-text text-foreground/80">Authenticating…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="body-text text-foreground/80">
          Sign in to manage gallery photos.
        </p>
      </Unauthenticated>

      <Authenticated>
        <PhotosEditorForm />
      </Authenticated>
    </>
  );
}

function PhotosEditorForm() {
  const { user } = useUser();
  const data = useQuery(api.admin.photos.listDraftPhotos);
  const generateUploadUrl = useMutation(api.admin.photos.generateUploadUrl);
  const saveUploadedPhoto = useMutation(api.admin.photos.saveUploadedPhoto);
  const updateDraftPhotoMetadata = useMutation(
    api.admin.photos.updateDraftPhotoMetadata,
  );
  const reorderDraftPhotos = useMutation(api.admin.photos.reorderDraftPhotos);
  const removeDraftPhoto = useMutation(api.admin.photos.removeDraftPhoto);
  const publishPhotos = useMutation(api.admin.photos.publishPhotos);
  const discardDraftPhotos = useMutation(api.admin.photos.discardDraftPhotos);
  const saveSectionIsEnabledDraft = useMutation(
    api.cms.saveSectionIsEnabledDraft,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  /** Browser `setTimeout` ids are numeric; avoid `NodeJS.Timeout` from `ReturnType<typeof setTimeout>`. */
  const uploadDismissTimerRef = useRef<number | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<RowBusy>({});
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [edits, setEdits] = useState<PhotoEdits>({});
  const [deleteStableId, setDeleteStableId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgressEntry[]>([]);

  // Drag-reorder state
  const [draggingStableId, setDraggingStableId] = useState<string | null>(null);
  const [reorderTarget, setReorderTarget] = useState<{
    stableId: string;
    position: "before" | "after";
  } | null>(null);

  const [surfaceTab, setSurfaceTab] = useState<"all" | "carousel" | "gallery">(
    "all",
  );

  const photos = useMemo(
    () => (data?.photos ?? []) as PhotoItem[],
    [data?.photos],
  );

  /**
   * Filter uses *edited* values so toggling a surface off immediately removes
   * the card from that surface's tab — matching the mental model that the
   * tab is a live filter on per-photo flags. The "All photos" tab is the
   * recovery surface: it always shows everything, including orphans (both
   * flags off) and pending changes.
   */
  const visiblePhotos = useMemo(
    () =>
      photos.filter((photo) => {
        if (surfaceTab === "all") return true;
        const e = edits[photo.stableId];
        const carousel = e?.showInCarousel ?? photo.showInCarousel;
        const gallery = e?.showInGallery ?? photo.showInGallery;
        return surfaceTab === "carousel" ? carousel !== false : gallery !== false;
      }),
    [edits, photos, surfaceTab],
  );

  const canReorder = visiblePhotos.length === photos.length && photos.length > 0;

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

  const hasGalleryPageFlagPending = useMemo(() => {
    if (!data?.galleryPage) return false;
    const published = data.galleryPage.isEnabledPublished !== false;
    const d = data.galleryPage.isEnabledDraft;
    return typeof d === "boolean" && d !== published;
  }, [data?.galleryPage]);

  /**
   * Per-surface counts use *edited* values so the tab labels reflect the
   * pending shape of each surface as the user toggles. This is the most
   * informative number to put on the filter chips — it answers "how many
   * photos will be on Carousel after I publish?".
   */
  const surfaceCounts = useMemo(() => {
    let carousel = 0;
    let gallery = 0;
    for (const photo of photos) {
      const e = edits[photo.stableId];
      if ((e?.showInCarousel ?? photo.showInCarousel) !== false) carousel += 1;
      if ((e?.showInGallery ?? photo.showInGallery) !== false) gallery += 1;
    }
    return { all: photos.length, carousel, gallery };
  }, [edits, photos]);

  const hasDraftOnServer =
    (data?.hasDraftChanges ?? false) || hasGalleryPageFlagPending;
  const hasLocalEdits = Object.keys(edits).length > 0;

  const publishedByLabel =
    data?.publishedBy && user?.id === data.publishedBy ? "You" : undefined;

  const getEditableFields = useCallback(
    (photo: PhotoItem) => {
      const photoCategories = (photo.categories ?? []).filter((slug) =>
        GALLERY_CATEGORY_OPTIONS.some((option) => option.slug === slug),
      ) as readonly GalleryCategorySlug[];
      return {
        alt: edits[photo.stableId]?.alt ?? photo.alt,
        caption: edits[photo.stableId]?.caption ?? (photo.caption ?? ""),
        categories:
          edits[photo.stableId]?.categories ?? photoCategories,
        showInCarousel:
          edits[photo.stableId]?.showInCarousel ?? photo.showInCarousel,
        showInGallery:
          edits[photo.stableId]?.showInGallery ?? photo.showInGallery,
      };
    },
    [edits],
  );

  const updatePhotoEdit = useCallback(
    (
      photo: PhotoItem,
      patch: Partial<{
        alt: string;
        caption: string;
        categories: readonly GalleryCategorySlug[];
        showInCarousel: boolean;
        showInGallery: boolean;
      }>,
    ) => {
      setEdits((current) => {
        const photoCategories = (photo.categories ?? []).filter((slug) =>
          GALLERY_CATEGORY_OPTIONS.some((option) => option.slug === slug),
        ) as readonly GalleryCategorySlug[];
        const base = {
          alt: current[photo.stableId]?.alt ?? photo.alt,
          caption:
            current[photo.stableId]?.caption ?? (photo.caption ?? ""),
          categories:
            current[photo.stableId]?.categories ?? photoCategories,
          showInCarousel:
            current[photo.stableId]?.showInCarousel ?? photo.showInCarousel,
          showInGallery:
            current[photo.stableId]?.showInGallery ?? photo.showInGallery,
        };
        const next = {
          alt: patch.alt ?? base.alt,
          caption: patch.caption ?? base.caption,
          categories: patch.categories ?? base.categories,
          showInCarousel: patch.showInCarousel ?? base.showInCarousel,
          showInGallery: patch.showInGallery ?? base.showInGallery,
        };
        if (
          next.alt === photo.alt &&
          next.caption === (photo.caption ?? "") &&
          sameCategories(next.categories, photoCategories) &&
          next.showInCarousel === photo.showInCarousel &&
          next.showInGallery === photo.showInGallery
        ) {
          const rest = { ...current };
          delete rest[photo.stableId];
          return rest;
        }
        return {
          ...current,
          [photo.stableId]: next,
        };
      });
    },
    [],
  );

  const togglePhotoCategory = useCallback(
    (photo: PhotoItem, slug: GalleryCategorySlug) => {
      const fields = getEditableFields(photo);
      const selected = new Set<GalleryCategorySlug>(fields.categories);
      if (selected.has(slug)) {
        selected.delete(slug);
      } else {
        selected.add(slug);
      }
      updatePhotoEdit(photo, { categories: canonicaliseCategories(selected) });
    },
    [getEditableFields, updatePhotoEdit],
  );

  const clearPhotoEdit = useCallback((stableId: string) => {
    setEdits((current) => {
      const rest = { ...current };
      delete rest[stableId];
      return rest;
    });
  }, []);

  const savePhotoDetails = useCallback(
    async (photo: PhotoItem): Promise<boolean> => {
      const fields = getEditableFields(photo);
      const validationError = validatePhotoFields(fields.alt, fields.caption);
      if (validationError) {
        setInlineError(validationError);
        toast.error(validationError);
        return false;
      }

      setInlineError(null);
      setRowAction(photo.stableId, "saving");
      const outcome = await runAdminEffect(
        convexMutationEffect(() =>
          updateDraftPhotoMetadata({
            stableId: photo.stableId,
            alt: fields.alt.trim(),
            caption:
              fields.caption.trim().length > 0 ? fields.caption.trim() : null,
            categories:
              fields.categories.length > 0 ? [...fields.categories] : [],
            showInCarousel: fields.showInCarousel,
            showInGallery: fields.showInGallery,
          }),
        ),
        { onErrorMessage: setInlineError },
      );
      setRowAction(photo.stableId, undefined);

      if (outcome === undefined) {
        return false;
      }

      clearPhotoEdit(photo.stableId);
      toast.success("Photo details saved.");
      return true;
    },
    [
      clearPhotoEdit,
      getEditableFields,
      setRowAction,
      updateDraftPhotoMetadata,
    ],
  );

  const savePendingEdits = useCallback(async (): Promise<boolean> => {
    const dirtyPhotos = photos.filter((photo) => edits[photo.stableId] !== undefined);
    if (dirtyPhotos.length === 0) {
      return true;
    }

    for (const photo of dirtyPhotos) {
      const fields = getEditableFields(photo);
      const validationError = validatePhotoFields(fields.alt, fields.caption);
      if (validationError) {
        setInlineError(validationError);
        toast.error(
          `${photo.originalFileName ?? "Photo"}: ${validationError}`,
        );
        return false;
      }
    }

    const effects = dirtyPhotos.map((photo) => {
      const fields = getEditableFields(photo);
      return convexMutationEffect(() =>
        updateDraftPhotoMetadata({
          stableId: photo.stableId,
          alt: fields.alt.trim(),
          caption: fields.caption.trim().length > 0 ? fields.caption.trim() : null,
          categories:
            fields.categories.length > 0 ? [...fields.categories] : [],
          showInCarousel: fields.showInCarousel,
          showInGallery: fields.showInGallery,
        }),
      );
    });

    const outcome = await runAction("Saving…", sequentialEffects(effects));
    if (outcome === undefined) {
      return false;
    }

    setEdits({});
    return true;
  }, [edits, getEditableFields, photos, runAction, updateDraftPhotoMetadata]);

  /** Persist the given order to the draft; used by both arrow buttons and DnD. */
  const persistOrder = useCallback(
    async (orderedStableIds: string[]): Promise<boolean> => {
      const outcome = await runAction(
        "Reordering…",
        convexMutationEffect(() =>
          reorderDraftPhotos({ orderedStableIds }),
        ),
      );
      return outcome !== undefined;
    },
    [reorderDraftPhotos, runAction],
  );

  const movePhoto = useCallback(
    async (stableId: string, direction: -1 | 1) => {
      if (!canReorder) {
        return;
      }
      const index = photos.findIndex((photo) => photo.stableId === stableId);
      if (index === -1) return;
      const target = index + direction;
      if (target < 0 || target >= photos.length) return;

      const reordered = [...photos];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(target, 0, moved);

      const ok = await persistOrder(reordered.map((photo) => photo.stableId));
      if (ok) {
        toast.success("Photo order updated.");
      }
    },
    [canReorder, persistOrder, photos],
  );

  // --- Drag-reorder handlers (native HTML5) -------------------------------

  const handleRowDragStart = useCallback(
    (event: ReactDragEvent<HTMLDivElement>, stableId: string) => {
      // Don't allow reorder while another action is in flight.
      if (busy !== null || !canReorder) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(REORDER_MIME, stableId);
      // Set a benign text payload too — some platforms require one.
      event.dataTransfer.setData("text/plain", stableId);
      setDraggingStableId(stableId);
    },
    [busy, canReorder],
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
    async (
      event: ReactDragEvent<HTMLDivElement>,
      overStableId: string,
    ) => {
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

      if (!canReorder) {
        return;
      }

      if (!sourceId || sourceId === overStableId) return;

      const sourceIndex = photos.findIndex((p) => p.stableId === sourceId);
      const targetIndex = photos.findIndex((p) => p.stableId === overStableId);
      if (sourceIndex === -1 || targetIndex === -1) return;

      const reordered = [...photos];
      const [moved] = reordered.splice(sourceIndex, 1);
      const targetIndexInReordered = reordered.findIndex(
        (p) => p.stableId === overStableId,
      );
      if (targetIndexInReordered === -1) return;
      const insertAt =
        position === "before"
          ? targetIndexInReordered
          : targetIndexInReordered + 1;
      reordered.splice(insertAt, 0, moved);

      const orderedIds = reordered.map((p) => p.stableId);
      // No-op if order didn't actually change.
      const unchanged = orderedIds.every(
        (id, idx) => photos[idx]?.stableId === id,
      );
      if (unchanged) return;

      const ok = await persistOrder(orderedIds);
      if (ok) {
        toast.success("Photo order updated.");
      }
    },
    [canReorder, persistOrder, photos, reorderTarget],
  );

  const handleRowDragEnd = useCallback(() => {
    setDraggingStableId(null);
    setReorderTarget(null);
  }, []);

  // --- Upload handling (with progress) ------------------------------------

  const updateUploadEntry = useCallback(
    (id: string, patch: Partial<UploadProgressEntry>) => {
      setUploadQueue((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
      );
    },
    [],
  );

  const processFiles = useCallback(
    async (incomingFiles: File[]) => {
      if (incomingFiles.length === 0 || !data) {
        return;
      }

      setInlineError(null);

      const remainingSlots = Math.max(
        0,
        data.limits.maxPhotos - photos.length,
      );
      if (remainingSlots === 0) {
        toast.error(
          `Gallery is full (${data.limits.maxPhotos}). Remove a photo first.`,
        );
        return;
      }

      let filesToUpload = incomingFiles;
      if (incomingFiles.length > remainingSlots) {
        toast.error(
          `Only ${remainingSlots} photo slot${
            remainingSlots === 1 ? "" : "s"
          } left; skipping the rest.`,
        );
        filesToUpload = incomingFiles.slice(0, remainingSlots);
      }

      setBusy("Uploading…");

      if (uploadDismissTimerRef.current !== null) {
        window.clearTimeout(uploadDismissTimerRef.current);
        uploadDismissTimerRef.current = null;
      }

      const batchEntryIds: string[] = [];
      let successCount = 0;
      for (const file of filesToUpload) {
        const entryId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        batchEntryIds.push(entryId);

        // Create the queue entry up-front so the tray appears immediately.
        setUploadQueue((prev) => [
          ...prev,
          {
            id: entryId,
            name: file.name,
            progress: 0,
            status: "uploading",
          },
        ]);

        if (
          !(data.limits.acceptedMimeTypes as readonly string[]).includes(
            file.type,
          )
        ) {
          const msg = `${file.name}: only JPEG, PNG, and WebP are allowed.`;
          toast.error(msg);
          updateUploadEntry(entryId, { status: "error", error: msg });
          continue;
        }
        if (file.size > data.limits.maxImageBytes) {
          const msg = `${file.name}: image must be ${Math.floor(
            data.limits.maxImageBytes / (1024 * 1024),
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
        const dimensions = await readImageDimensions(file);

        const saved = await runAdminEffect(
          convexMutationEffect(() =>
            saveUploadedPhoto({
              storageId,
              alt: defaultAltFromFileName(file.name),
              caption: null,
              width: dimensions?.width ?? null,
              height: dimensions?.height ?? null,
              originalFileName: file.name,
              showInCarousel: surfaceTab === "all" || surfaceTab === "carousel",
              showInGallery: surfaceTab === "all" || surfaceTab === "gallery",
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
            error: `${file.name}: could not save photo.`,
          });
        }
      }

      setBusy(null);
      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? "Photo uploaded."
            : `${successCount} photos uploaded.`,
        );
      }

      // Auto-dismiss this batch's non-error entries; keep errors pinned.
      uploadDismissTimerRef.current = window.setTimeout(() => {
        uploadDismissTimerRef.current = null;
        setUploadQueue((prev) =>
          prev.filter(
            (entry) =>
              entry.status === "error" || !batchEntryIds.includes(entry.id),
          ),
        );
      }, 2500);
    },
    [
      data,
      generateUploadUrl,
      photos.length,
      saveUploadedPhoto,
      surfaceTab,
      updateUploadEntry,
    ],
  );

  const handleFileSelection = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      await processFiles(files);
    },
    [processFiles],
  );

  const canAcceptDrop =
    data !== undefined &&
    busy === null &&
    photos.length < data.limits.maxPhotos;

  const hasFilesBeingDragged = (transfer: DataTransfer | null): boolean => {
    if (!transfer) return false;
    // `types` is a DOMStringList/array-like; iterate safely.
    for (let i = 0; i < transfer.types.length; i += 1) {
      if (transfer.types[i] === "Files") return true;
    }
    return false;
  };

  const handleDragEnter = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      if (!hasFilesBeingDragged(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current += 1;
      if (canAcceptDrop) {
        setIsDraggingOver(true);
      }
    },
    [canAcceptDrop],
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
      convexMutationEffect(() => removeDraftPhoto({ stableId: deleteStableId })),
      { onErrorMessage: setInlineError },
    );
    setRowAction(deleteStableId, undefined);
    setDeleteStableId(null);
    if (outcome !== undefined) {
      clearPhotoEdit(deleteStableId);
      toast.success("Photo removed.");
    }
  }, [clearPhotoEdit, deleteStableId, removeDraftPhoto, setRowAction]);

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
    setInlineError(null);
    if (data?.hasDraftChanges || hasGalleryPageFlagPending) {
      const outcome = await runAdminEffect(
        convexMutationEffect(() => discardDraftPhotos({})),
        { onErrorMessage: setInlineError },
      );
      if (outcome === undefined) {
        return false;
      }
    }

    setEdits({});
    toast.success(
      data?.hasDraftChanges || hasGalleryPageFlagPending
        ? "Draft discarded. The editor now matches the published site."
        : "Unsaved changes discarded.",
    );
    return true;
  }, [
    data?.hasDraftChanges,
    discardDraftPhotos,
    hasGalleryPageFlagPending,
  ]);

  const handlePublish = useCallback(async () => {
    const saved = await savePendingEdits();
    if (!saved) {
      return;
    }

    const outcome = await runAction(
      "Publishing…",
      convexMutationEffect(() => publishPhotos({})),
    );
    if (outcome !== undefined) {
      toast.success("Gallery published.");
    }
  }, [publishPhotos, runAction, savePendingEdits]);

  const handleToolbarPublish = useCallback(() => {
    void handlePublish();
  }, [handlePublish]);

  const setGalleryPageVisible = useCallback(
    (enabled: boolean) => {
      void runAdminEffect(
        convexMutationEffect(() =>
          saveSectionIsEnabledDraft({ section: "photos", isEnabled: enabled }),
        ),
        { onErrorMessage: setInlineError },
      );
    },
    [saveSectionIsEnabledDraft],
  );

  const { toolbarPortal, editorRef } = useRegisterCmsEditor({
    section: "photos",
    sectionLabel: "Studio gallery",
    hasDraftOnServer,
    hasLocalEdits,
    publishedAt: data?.publishedAt ?? null,
    publishedByLabel,
    busy,
    autosaveStatus: "idle",
    inlineError,
    previewHref:
      surfaceTab === "gallery" ? "/preview/gallery" : "/preview#the-space",
    onPublish: handleToolbarPublish,
    onDiscardConfirm: handleDiscardConfirm,
    // No `flush` — dirty local edits trigger the nav-guard confirm dialog
    // (they're manual-save pending metadata tweaks, not autosavable).
  });

  if (data === undefined) {
    return <PhotosEditorSkeleton />;
  }

  const galleryPageEffective =
    data.galleryPage?.isEnabledDraft !== undefined
      ? data.galleryPage.isEnabledDraft
      : data.galleryPage?.isEnabledPublished !== false;

  const anyUploading = uploadQueue.some(
    (entry) => entry.status === "uploading" || entry.status === "saving",
  );

  return (
    <div
      ref={editorRef}
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
      {isDraggingOver && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center rounded-xl bg-primary/5 pt-16 sm:pt-24"
          aria-hidden
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-card/95 px-10 py-8 shadow-xl">
            <ImagePlus className="size-10 text-primary" aria-hidden />
            <p className="text-lg font-semibold text-foreground">
              Drop photos to upload
            </p>
            <p className="body-text-small text-muted-foreground">
              JPEG, PNG, or WebP · up to{" "}
              {Math.floor(data.limits.maxImageBytes / (1024 * 1024))}MB each
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Studio gallery
            </h2>
            <p className="body-text-small max-w-2xl text-foreground/85">
              Each photo can appear on the homepage{" "}
              <span className="font-medium">“The Space”</span> carousel, the
              public <span className="font-medium">Gallery</span> page, or
              both — choose per photo inside its card. The tabs below filter
              the list by surface; uploads default to the active surface.
              Gallery categories (Rooms, Gear, Grounds) apply to the Gallery
              surface only. Publish pushes order, per-surface flags, and
              Gallery page visibility live.
            </p>
            <div
              className="flex flex-wrap items-center gap-2 pt-1"
              role="tablist"
              aria-label="Filter photos by surface"
            >
              <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
                {(
                  [
                    ["all", "All photos", surfaceCounts.all] as const,
                    ["carousel", "Homepage carousel", surfaceCounts.carousel] as const,
                    ["gallery", "Gallery page", surfaceCounts.gallery] as const,
                  ] as const
                ).map(([id, label, count]) => {
                  const isActive = surfaceTab === id;
                  return (
                    <Button
                      key={id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      role="tab"
                      aria-selected={isActive}
                      className={cn(
                        "rounded-md px-3 transition-colors",
                        isActive
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => setSurfaceTab(id)}
                    >
                      <span>{label}</span>
                      <span
                        className={cn(
                          "ml-2 inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-sm px-1 text-[10px] font-medium tabular-nums",
                          isActive
                            ? "bg-muted text-foreground/85"
                            : "bg-muted/60 text-muted-foreground",
                        )}
                        aria-hidden
                      >
                        {count}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
            {surfaceTab !== "carousel" ? (
              <SiteVisibilityRow
                id="gallery-page-visible"
                title="Gallery page visibility"
                description={
                  <>
                    When off, <code>/gallery</code> 404s and the Gallery nav link
                    is hidden. Publish to apply.
                  </>
                }
                checked={galleryPageEffective}
                onCheckedChange={setGalleryPageVisible}
                disabled={busy !== null}
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept={data.limits.acceptedMimeTypes.join(",")}
              multiple
              className="hidden"
              onChange={(event) => void handleFileSelection(event)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy !== null || photos.length >= data.limits.maxPhotos}
            >
              {busy === "Uploading…" ? (
                <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="mr-1 size-4" aria-hidden />
              )}
              Upload photos
            </Button>
            <p className="body-text-small text-right text-foreground/70">
              JPEG, PNG, or WebP. Up to {Math.floor(data.limits.maxImageBytes / (1024 * 1024))}MB each.
              {photos.length >= data.limits.maxPhotos
                ? ` Gallery limit reached (${data.limits.maxPhotos}).`
                : ` ${photos.length}/${data.limits.maxPhotos} used.`}
            </p>
          </div>
        </div>
      </div>

      {/* Upload progress tray — shown per-file while uploading and for any errors after. */}
      {uploadQueue.length > 0 && (
        <div
          className="space-y-2 rounded-xl border border-border bg-muted/30 p-4"
          aria-live="polite"
          aria-busy={anyUploading}
        >
          <p className="body-text-small font-medium text-foreground/85">
            {anyUploading ? "Uploading photos…" : "Upload results"}
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

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          <p className="body-text text-foreground/80">
            No gallery photos yet. Drop images here or use the Upload button to
            add images.
          </p>
        </div>
      ) : visiblePhotos.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          <p className="body-text text-foreground/80">
            No photos on this surface yet.
          </p>
          <p className="body-text-small text-foreground/70">
            Switch to{" "}
            <button
              type="button"
              onClick={() => setSurfaceTab("all")}
              className="underline-offset-2 hover:underline"
            >
              All photos
            </button>{" "}
            to add an existing photo to this surface, or upload a new one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visiblePhotos.map((photo, index) => {
            const fields = getEditableFields(photo);
            const isDirty = edits[photo.stableId] !== undefined;
            const rowAction = rowBusy[photo.stableId];
            const isRowBusy = rowAction !== undefined;
            const isDraggingThis = draggingStableId === photo.stableId;
            const dropHint =
              reorderTarget?.stableId === photo.stableId &&
              draggingStableId !== null &&
              draggingStableId !== photo.stableId
                ? reorderTarget.position
                : null;
            const altInvalid = fields.alt.trim().length === 0;
            return (
              <Card
                key={photo.stableId}
                data-stable-id={photo.stableId}
                className={cn(
                  "relative flex min-w-0 flex-col gap-2 p-2.5 transition",
                  isDraggingThis && "opacity-60",
                  dropHint === "before" &&
                    "shadow-[0_-2px_0_0_var(--color-primary)]",
                  dropHint === "after" &&
                    "shadow-[0_2px_0_0_var(--color-primary)]",
                  isRowBusy && "pointer-events-none",
                )}
                draggable={busy === null && canReorder}
                onDragStart={(event) =>
                  handleRowDragStart(event, photo.stableId)
                }
                onDragOver={(event) => handleRowDragOver(event, photo.stableId)}
                onDrop={(event) => void handleRowDrop(event, photo.stableId)}
                onDragEnd={handleRowDragEnd}
              >
                <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
                  {canReorder ? (
                    <div
                      className="pointer-events-none absolute left-1.5 top-1.5 z-10 text-muted-foreground/70"
                      aria-hidden
                    >
                      <GripVertical className="size-4" />
                    </div>
                  ) : null}
                  <div className="absolute right-1 top-1 z-10 flex gap-0.5 rounded-md border border-border/60 bg-background/85 p-0.5 shadow-sm backdrop-blur-sm dark:bg-background/80">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="bg-transparent text-foreground hover:bg-muted/70 hover:text-foreground hover:no-underline disabled:text-foreground/35"
                      aria-label="Move photo up"
                      disabled={
                        index === 0 || !canReorder || busy !== null || isRowBusy
                      }
                      onClick={() => void movePhoto(photo.stableId, -1)}
                    >
                      <ArrowUp className="size-4 stroke-[2.25]" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="bg-transparent text-foreground hover:bg-muted/70 hover:text-foreground hover:no-underline disabled:text-foreground/35"
                      aria-label="Move photo down"
                      disabled={
                        index === visiblePhotos.length - 1 ||
                        !canReorder ||
                        busy !== null ||
                        isRowBusy
                      }
                      onClick={() => void movePhoto(photo.stableId, 1)}
                    >
                      <ArrowDown className="size-4 stroke-[2.25]" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive hover:no-underline"
                      aria-label="Delete photo"
                      disabled={busy !== null || isRowBusy}
                      onClick={() => setDeleteStableId(photo.stableId)}
                    >
                      <Trash2 className="size-4 stroke-[2.25]" aria-hidden />
                    </Button>
                  </div>
                  {photo.url ? (
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={photo.url}
                        alt={photo.alt}
                        fill
                        unoptimized
                        draggable={false}
                        className="select-none object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center px-2 text-center text-xs text-muted-foreground">
                      Image unavailable
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1.5">
                  <div className="min-w-0 space-y-0">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
                      <span className="mr-1.5">Photo #{index + 1}</span>
                      <span className="font-normal normal-case text-foreground/80">
                        {photo.originalFileName ?? "Untitled image"}
                      </span>
                    </p>
                    <p className="truncate text-[11px] leading-tight text-muted-foreground">
                      {photo.width && photo.height
                        ? `${photo.width} × ${photo.height}`
                        : "Dimensions unavailable"}
                      {" · "}
                      {photo.contentType}
                      {" · "}
                      {formatBytes(photo.sizeBytes)}
                    </p>
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
                  </div>

                  <div className="grid gap-1.5">
                    <label className="min-w-0 space-y-0.5">
                      <span className="text-[11px] font-medium leading-none text-foreground/90">
                        Alt text
                        <span
                          className="ml-1 text-destructive"
                          aria-hidden
                        >
                          *
                        </span>
                      </span>
                      <Input
                        value={fields.alt}
                        aria-invalid={altInvalid || undefined}
                        aria-describedby={
                          altInvalid ? `alt-hint-${photo.stableId}` : undefined
                        }
                        onChange={(event) =>
                          updatePhotoEdit(photo, { alt: event.target.value })
                        }
                        maxLength={MAX_ALT_LENGTH}
                        className="h-7 py-1 text-sm"
                      />
                      {altInvalid && (
                        <span
                          id={`alt-hint-${photo.stableId}`}
                          className="block text-xs text-amber-600 dark:text-amber-400"
                        >
                          Alt text is required before publish.
                        </span>
                      )}
                    </label>

                    <label className="min-w-0 space-y-0.5">
                      <span className="text-[11px] font-medium leading-none text-foreground/90">
                        Caption
                      </span>
                      <Textarea
                        value={fields.caption}
                        onChange={(event) =>
                          updatePhotoEdit(photo, { caption: event.target.value })
                        }
                        maxLength={MAX_CAPTION_LENGTH}
                        rows={2}
                        className="min-h-[2.5rem] max-h-24 resize-y py-1.5 text-sm [field-sizing:fixed]"
                      />
                    </label>

                    <fieldset className="space-y-1.5 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <legend className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                          Where it shows
                        </legend>
                        {!fields.showInCarousel && !fields.showInGallery ? (
                          <span className="rounded-sm bg-amber-100/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                            Hidden everywhere
                          </span>
                        ) : null}
                      </div>
                      <ul className="space-y-1">
                        {(
                          [
                            {
                              key: "carousel",
                              label: "Homepage carousel",
                              edited: fields.showInCarousel,
                              saved: photo.showInCarousel,
                            },
                            {
                              key: "gallery",
                              label: "Gallery page",
                              edited: fields.showInGallery,
                              saved: photo.showInGallery,
                            },
                          ] as const
                        ).map(({ key, label, edited, saved }) => {
                          const willChange = edited !== saved;
                          const inputId = `surface-${key}-${photo.stableId}`;
                          return (
                            <li
                              key={key}
                              className="flex items-center justify-between gap-2 rounded-sm bg-background/60 px-1.5 py-1"
                            >
                              <label
                                htmlFor={inputId}
                                className="flex min-w-0 items-center gap-2 text-[11px] text-foreground/95"
                              >
                                <span
                                  aria-hidden
                                  className={cn(
                                    "size-1.5 shrink-0 rounded-full transition-colors",
                                    edited
                                      ? "bg-emerald-500"
                                      : "bg-muted-foreground/40",
                                  )}
                                />
                                <span className="truncate">{label}</span>
                                {willChange ? (
                                  <span
                                    className={cn(
                                      "shrink-0 rounded-sm px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                                      edited
                                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200"
                                        : "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
                                    )}
                                  >
                                    {edited ? "Will appear" : "Will hide"}
                                  </span>
                                ) : null}
                              </label>
                              <Switch
                                id={inputId}
                                size="sm"
                                checked={edited}
                                onCheckedChange={(v) => {
                                  if (key === "carousel") {
                                    updatePhotoEdit(photo, {
                                      showInCarousel: v,
                                    });
                                  } else {
                                    updatePhotoEdit(photo, {
                                      showInGallery: v,
                                    });
                                  }
                                }}
                                disabled={busy !== null || isRowBusy}
                              />
                            </li>
                          );
                        })}
                      </ul>
                      {!fields.showInCarousel && !fields.showInGallery ? (
                        <p className="text-[11px] leading-snug text-amber-900/90 dark:text-amber-200/90">
                          With both surfaces off this photo won&apos;t appear
                          anywhere on the public site after publish. Consider
                          deleting it instead.
                        </p>
                      ) : null}
                    </fieldset>

                    {fields.showInGallery ? (
                    <fieldset className="min-w-0 space-y-1">
                      <legend className="text-[11px] font-medium leading-none text-foreground/90">
                        Gallery categories
                      </legend>
                      <p className="text-[11px] leading-tight text-muted-foreground">
                        Drives the public Gallery filter pills. Photos with no
                        categories still appear under <span className="font-medium">All</span>.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {GALLERY_CATEGORY_OPTIONS.map((option) => {
                          const isChecked = fields.categories.includes(
                            option.slug,
                          );
                          return (
                            <button
                              key={option.slug}
                              type="button"
                              role="checkbox"
                              aria-checked={isChecked}
                              title={option.description}
                              disabled={busy !== null || isRowBusy}
                              onClick={() =>
                                togglePhotoCategory(photo, option.slug)
                              }
                              className={cn(
                                "rounded-sm border px-2 py-0.5 text-[11px] transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                                isChecked
                                  ? "border-primary bg-primary/15 text-foreground"
                                  : "border-border bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground",
                                "disabled:cursor-not-allowed disabled:opacity-60",
                              )}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5">
                    <p className="text-[11px] leading-tight text-muted-foreground">
                      {isDirty
                        ? "Unsaved metadata changes."
                        : "Metadata saved to draft."}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Save photo details"
                      disabled={!isDirty || busy !== null || isRowBusy}
                      onClick={() => void savePhotoDetails(photo)}
                    >
                      {rowAction === "saving" ? (
                        <Loader2
                          className="mr-1 size-3.5 animate-spin"
                          aria-hidden
                        />
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

      {toolbarPortal}

      <AlertDialog
        open={deleteStableId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteStableId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete photo?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing this draft photo also removes its storage blob when nothing else references it.
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
                "Delete photo"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
