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
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CmsPublishToolbar } from "@/components/admin/cms-publish-toolbar";
import { convexMutationEffect, type CmsAppError } from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { cn } from "@/lib/utils";

const MAX_ALT_LENGTH = 240;
const MAX_CAPTION_LENGTH = 600;

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
};

type PhotoEdits = Record<
  string,
  {
    alt: string;
    caption: string;
  }
>;

function defaultAltFromFileName(fileName: string): string {
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validatePhotoFields(alt: string, caption: string): string | null {
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

function sequentialEffects(
  effects: Array<Effect.Effect<unknown, CmsAppError>>,
): Effect.Effect<void, CmsAppError> {
  return effects.reduce(
    (acc, effect) => pipe(acc, Effect.flatMap(() => effect)),
    Effect.succeed(undefined) as Effect.Effect<void, CmsAppError>,
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);

  const [busy, setBusy] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [edits, setEdits] = useState<PhotoEdits>({});
  const [deleteStableId, setDeleteStableId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const photos = useMemo(
    () => (data?.photos ?? []) as PhotoItem[],
    [data],
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

  const getEditableFields = useCallback(
    (photo: PhotoItem) => ({
      alt: edits[photo.stableId]?.alt ?? photo.alt,
      caption: edits[photo.stableId]?.caption ?? (photo.caption ?? ""),
    }),
    [edits],
  );

  const updatePhotoEdit = useCallback((photo: PhotoItem, patch: Partial<{ alt: string; caption: string }>) => {
    setEdits((current) => {
      const base = {
        alt: current[photo.stableId]?.alt ?? photo.alt,
        caption: current[photo.stableId]?.caption ?? (photo.caption ?? ""),
      };
      const next = {
        alt: patch.alt ?? base.alt,
        caption: patch.caption ?? base.caption,
      };
      if (
        next.alt === photo.alt &&
        next.caption === (photo.caption ?? "")
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
  }, []);

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

      const outcome = await runAction(
        "Saving…",
        convexMutationEffect(() =>
          updateDraftPhotoMetadata({
            stableId: photo.stableId,
            alt: fields.alt.trim(),
            caption: fields.caption.trim().length > 0 ? fields.caption.trim() : null,
          }),
        ),
      );
      if (outcome === undefined) {
        return false;
      }

      clearPhotoEdit(photo.stableId);
      toast.success("Photo details saved.");
      return true;
    },
    [clearPhotoEdit, getEditableFields, runAction, updateDraftPhotoMetadata],
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
        toast.error(validationError);
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

  const movePhoto = useCallback(
    async (stableId: string, direction: -1 | 1) => {
      const index = photos.findIndex((photo) => photo.stableId === stableId);
      if (index === -1) return;
      const target = index + direction;
      if (target < 0 || target >= photos.length) return;

      const reordered = [...photos];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(target, 0, moved);

      const outcome = await runAction(
        "Reordering…",
        convexMutationEffect(() =>
          reorderDraftPhotos({
            orderedStableIds: reordered.map((photo) => photo.stableId),
          }),
        ),
      );
      if (outcome !== undefined) {
        toast.success("Photo order updated.");
      }
    },
    [photos, reorderDraftPhotos, runAction],
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

      let successCount = 0;
      for (const file of filesToUpload) {
        if (
          !(data.limits.acceptedMimeTypes as readonly string[]).includes(
            file.type,
          )
        ) {
          toast.error(`${file.name}: only JPEG, PNG, and WebP are allowed.`);
          continue;
        }
        if (file.size > data.limits.maxImageBytes) {
          toast.error(
            `${file.name}: image must be ${Math.floor(
              data.limits.maxImageBytes / (1024 * 1024),
            )}MB or smaller.`,
          );
          continue;
        }

        const upload = await runAdminEffect(
          convexMutationEffect(() => generateUploadUrl({})),
          { onErrorMessage: setInlineError },
        );
        if (!upload) {
          break;
        }

        const uploadResponse = await fetch(upload.uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          toast.error(`${file.name}: upload failed.`);
          continue;
        }

        const { storageId } = (await uploadResponse.json()) as {
          storageId: Id<"_storage">;
        };
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
            }),
          ),
          { onErrorMessage: setInlineError },
        );

        if (saved !== undefined) {
          successCount += 1;
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
    },
    [data, generateUploadUrl, photos.length, saveUploadedPhoto],
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
    const outcome = await runAction(
      "Deleting…",
      convexMutationEffect(() => removeDraftPhoto({ stableId: deleteStableId })),
    );
    setDeleteStableId(null);
    if (outcome !== undefined) {
      clearPhotoEdit(deleteStableId);
      toast.success("Photo removed.");
    }
  }, [clearPhotoEdit, deleteStableId, removeDraftPhoto, runAction]);

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
    setInlineError(null);
    if (hasDraftOnServer) {
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
      hasDraftOnServer
        ? "Draft discarded. The editor now matches the published site."
        : "Unsaved changes discarded.",
    );
    return true;
  }, [discardDraftPhotos, hasDraftOnServer]);

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

  if (data === undefined) {
    return <p className="body-text text-foreground/80">Loading photos…</p>;
  }

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
              Upload and arrange the photos shown in the “The Space” section.
              Drag and drop images onto this page, or use the Upload button.
              Uploads land in draft first; publish makes the new order and metadata live.
            </p>
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

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          <p className="body-text text-foreground/80">
            No gallery photos yet. Drop images here or use the Upload button to
            start the carousel.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {photos.map((photo, index) => {
            const fields = getEditableFields(photo);
            const isDirty = edits[photo.stableId] !== undefined;
            return (
              <article
                key={photo.stableId}
                className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-sm lg:grid-cols-[240px_minmax(0,1fr)]"
              >
                <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                  {photo.url ? (
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={photo.url}
                        alt={photo.alt}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="240px"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
                      Image unavailable
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
                        Photo #{index + 1}
                      </p>
                      <p className="body-text-small text-foreground/80">
                        {photo.originalFileName ?? "Untitled image"}
                      </p>
                      <p className="body-text-small text-muted-foreground">
                        {photo.width && photo.height
                          ? `${photo.width} × ${photo.height}`
                          : "Dimensions unavailable"}
                        {" · "}
                        {photo.contentType}
                        {" · "}
                        {formatBytes(photo.sizeBytes)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Move photo up"
                        disabled={index === 0 || busy !== null}
                        onClick={() => void movePhoto(photo.stableId, -1)}
                      >
                        <ArrowUp className="size-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Move photo down"
                        disabled={index === photos.length - 1 || busy !== null}
                        onClick={() => void movePhoto(photo.stableId, 1)}
                      >
                        <ArrowDown className="size-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Delete photo"
                        disabled={busy !== null}
                        onClick={() => setDeleteStableId(photo.stableId)}
                      >
                        <Trash2 className="size-4 text-destructive" aria-hidden />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <label className="space-y-1">
                      <span className="body-text-small text-muted-foreground">
                        Alt text
                      </span>
                      <Input
                        value={fields.alt}
                        onChange={(event) =>
                          updatePhotoEdit(photo, { alt: event.target.value })
                        }
                        maxLength={MAX_ALT_LENGTH}
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="body-text-small text-muted-foreground">
                        Caption
                      </span>
                      <Textarea
                        value={fields.caption}
                        onChange={(event) =>
                          updatePhotoEdit(photo, { caption: event.target.value })
                        }
                        maxLength={MAX_CAPTION_LENGTH}
                        rows={3}
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="body-text-small text-muted-foreground">
                      {isDirty ? "Unsaved metadata changes." : "Metadata saved to draft."}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!isDirty || busy !== null}
                      onClick={() => void savePhotoDetails(photo)}
                    >
                      <Save className="mr-1 size-4" aria-hidden />
                      Save details
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <CmsPublishToolbar
        section="photos"
        sectionLabel="Studio gallery"
        hasDraftOnServer={hasDraftOnServer}
        hasLocalEdits={hasLocalEdits}
        publishedAt={data.publishedAt}
        publishedByLabel={publishedByLabel}
        busy={busy}
        onPublish={() => void handlePublish()}
        onDiscardConfirm={handleDiscardConfirm}
        previewHref="/preview#the-space"
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
            <AlertDialogTitle>Delete photo?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing this draft photo also removes its storage blob when nothing else references it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy !== null}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={busy !== null}
              onClick={() => void handleDeleteConfirm()}
            >
              Delete photo
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
