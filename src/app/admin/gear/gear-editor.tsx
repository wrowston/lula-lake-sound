"use client";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useMutation,
  useQuery,
} from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Effect, pipe } from "effect";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { convexMutationEffect, type CmsAppError } from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { CmsPublishToolbar } from "@/components/admin/cms-publish-toolbar";

/** Client-side limits (Convex schema is structural only). */
const MAX_NAME_LEN = 500;
const MAX_MARKDOWN_LEN = 20_000;
const MAX_KV_PAIRS = 40;
const MAX_KV_KEY_LEN = 200;
const MAX_KV_VALUE_LEN = 4_000;
const MAX_URL_LEN = 2_048;
const SPECS_PREVIEW_LEN = 96;

type GearSpecs =
  | { kind: "markdown"; text: string }
  | { kind: "kv"; pairs: { key: string; value: string }[] };

type GearItemPayload = {
  stableId: string;
  categoryStableId: string;
  name: string;
  sort: number;
  specs: GearSpecs;
  url?: string | null;
};

type GearCategoryPayload = {
  stableId: string;
  name: string;
  sort: number;
  items: GearItemPayload[];
};

function generateCategoryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `cat_${crypto.randomUUID()}`;
  }
  return `cat_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function generateItemId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `item_${crypto.randomUUID()}`;
  }
  return `item_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function specsPreview(specs: GearSpecs): string {
  if (specs.kind === "markdown") {
    const t = specs.text.trim().replace(/\s+/g, " ");
    return t.length > SPECS_PREVIEW_LEN
      ? `${t.slice(0, SPECS_PREVIEW_LEN)}…`
      : t || "—";
  }
  const joined = specs.pairs
    .map((p) => `${p.key.trim()}: ${p.value.trim()}`)
    .join(" · ");
  return joined.length > SPECS_PREVIEW_LEN
    ? `${joined.slice(0, SPECS_PREVIEW_LEN)}…`
    : joined || "—";
}

export function validateItemName(name: string): string | null {
  const t = name.trim();
  if (t.length === 0) return "Name is required.";
  if (t.length > MAX_NAME_LEN) return `Name must be at most ${MAX_NAME_LEN} characters.`;
  return null;
}

export function validateCategoryName(name: string): string | null {
  return validateItemName(name);
}

export function validateSpecs(specs: GearSpecs): string | null {
  if (specs.kind === "markdown") {
    if (specs.text.length > MAX_MARKDOWN_LEN) {
      return `Details must be at most ${MAX_MARKDOWN_LEN} characters.`;
    }
    return null;
  }
  if (specs.pairs.length > MAX_KV_PAIRS) {
    return `At most ${MAX_KV_PAIRS} key/value lines.`;
  }
  for (let i = 0; i < specs.pairs.length; i++) {
    const { key, value } = specs.pairs[i];
    if (key.length > MAX_KV_KEY_LEN) {
      return `Key ${i + 1} must be at most ${MAX_KV_KEY_LEN} characters.`;
    }
    if (value.length > MAX_KV_VALUE_LEN) {
      return `Value ${i + 1} must be at most ${MAX_KV_VALUE_LEN} characters.`;
    }
  }
  return null;
}

export function validateUrl(url: string): string | null {
  const t = url.trim();
  if (t.length === 0) return null;
  if (t.length > MAX_URL_LEN) return `URL must be at most ${MAX_URL_LEN} characters.`;
  try {
    const parsed = new URL(t);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Enter a valid http(s) URL or leave blank.";
    }
  } catch {
    return "Enter a valid http(s) URL or leave blank.";
  }
  return null;
}

export function sortCategories(cats: GearCategoryPayload[]): GearCategoryPayload[] {
  return [...cats].sort(
    (a, b) => a.sort - b.sort || a.stableId.localeCompare(b.stableId),
  );
}

export function sortItems(items: GearItemPayload[]): GearItemPayload[] {
  return [...items].sort(
    (a, b) => a.sort - b.sort || a.stableId.localeCompare(b.stableId),
  );
}

/** Next sort for a new row at the end; avoids colliding with gaps after deletes. */
export function nextAppendSort(sorts: readonly number[]): number {
  if (sorts.length === 0) return 0;
  return Math.max(...sorts) + 1;
}

function sequentialEffects(
  effects: Array<Effect.Effect<unknown, CmsAppError>>,
): Effect.Effect<void, CmsAppError> {
  return effects.reduce(
    (acc, e) => pipe(acc, Effect.flatMap(() => e)),
    Effect.succeed(undefined) as Effect.Effect<void, CmsAppError>,
  );
}

export function GearEditor() {
  return (
    <>
      <AuthLoading>
        <p className="body-text text-foreground/80">Authenticating…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="body-text text-foreground/80">
          Sign in to manage studio gear.
        </p>
      </Unauthenticated>

      <Authenticated>
        <GearEditorForm />
      </Authenticated>
    </>
  );
}

type CategorySheetState =
  | { mode: "create"; stableId: string; name: string }
  | { mode: "edit"; stableId: string; name: string; sort: number };

type ItemSheetState =
  | {
      mode: "create";
      stableId: string;
      categoryStableId: string;
      name: string;
      sort: number;
      specsKind: "markdown" | "kv";
      markdown: string;
      pairs: { key: string; value: string }[];
      url: string;
    }
  | {
      mode: "edit";
      stableId: string;
      categoryStableId: string;
      name: string;
      sort: number;
      specsKind: "markdown" | "kv";
      markdown: string;
      pairs: { key: string; value: string }[];
      url: string;
    };

function GearEditorForm() {
  const { user } = useUser();
  const data = useQuery(api.admin.gear.listDraftGear);
  const putCategory = useMutation(api.admin.gear.putDraftCategory);
  const removeCategory = useMutation(api.admin.gear.removeDraftCategory);
  const putItem = useMutation(api.admin.gear.putDraftItem);
  const removeItem = useMutation(api.admin.gear.removeDraftItem);
  const publishGear = useMutation(api.admin.gear.publishGear);
  const discardDraftGear = useMutation(api.admin.gear.discardDraftGear);

  const [busy, setBusy] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [categorySheet, setCategorySheet] = useState<CategorySheetState | null>(
    null,
  );
  const [itemSheet, setItemSheet] = useState<ItemSheetState | null>(null);

  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const tree = useMemo(
    () => (data ? sortCategories(data.tree as GearCategoryPayload[]) : []),
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
  const hasLocalEdits = false;

  const publishedByLabel =
    data?.publishedBy && user?.id === data.publishedBy ? "You" : undefined;

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
    setInlineError(null);
    if (hasDraftOnServer) {
      setBusy("Discarding…");
      const outcome = await runAdminEffect(
        convexMutationEffect(() => discardDraftGear({})),
        { onErrorMessage: setInlineError },
      );
      setBusy(null);
      if (outcome === undefined) {
        return false;
      }
    }
    toast.success(
      hasDraftOnServer
        ? "Draft discarded. The editor now matches the published site."
        : "Nothing to discard.",
    );
    return true;
  }, [discardDraftGear, hasDraftOnServer]);

  const openCreateCategory = useCallback(() => {
    setCategorySheet({
      mode: "create",
      stableId: generateCategoryId(),
      name: "",
    });
  }, []);

  const saveCategorySheet = useCallback(async () => {
    if (!categorySheet || !data) return;
    const nameErr = validateCategoryName(categorySheet.name);
    if (nameErr) {
      setInlineError(nameErr);
      toast.error(nameErr);
      return;
    }
    const name = categorySheet.name.trim();
    if (categorySheet.mode === "create") {
      const program = convexMutationEffect(() =>
        putCategory({
          stableId: categorySheet.stableId,
          name,
          sort: nextAppendSort(tree.map((c) => c.sort)),
        }),
      );
      const ok = await runAction("Saving…", program);
      if (ok !== undefined) {
        setCategorySheet(null);
        toast.success("Category added.");
      }
    } else {
      const program = convexMutationEffect(() =>
        putCategory({
          stableId: categorySheet.stableId,
          name,
          sort: categorySheet.sort,
        }),
      );
      const ok = await runAction("Saving…", program);
      if (ok !== undefined) {
        setCategorySheet(null);
        toast.success("Category updated.");
      }
    }
  }, [categorySheet, data, putCategory, runAction, tree]);

  const moveCategory = useCallback(
    async (stableId: string, direction: -1 | 1) => {
      const idx = tree.findIndex((c) => c.stableId === stableId);
      if (idx === -1) return;
      const target = idx + direction;
      if (target < 0 || target >= tree.length) return;
      const reordered = [...tree];
      const [moved] = reordered.splice(idx, 1);
      reordered.splice(target, 0, moved);
      const effects = reordered.map((cat, i) =>
        convexMutationEffect(() =>
          putCategory({
            stableId: cat.stableId,
            name: cat.name,
            sort: i,
          }),
        ),
      );
      const ok = await runAction("Reordering…", sequentialEffects(effects));
      if (ok !== undefined) toast.success("Order updated.");
    },
    [putCategory, runAction, tree],
  );

  const confirmDeleteCategory = useCallback(async () => {
    if (!deleteCategoryId) return;
    const program = convexMutationEffect(() =>
      removeCategory({ stableId: deleteCategoryId }),
    );
    const ok = await runAction("Deleting…", program);
    setDeleteCategoryId(null);
    if (ok !== undefined) toast.success("Category removed.");
  }, [deleteCategoryId, removeCategory, runAction]);

  const openCreateItem = useCallback((categoryStableId: string) => {
    const cat = tree.find((c) => c.stableId === categoryStableId);
    const sort = cat
      ? nextAppendSort(sortItems(cat.items).map((i) => i.sort))
      : 0;
    setItemSheet({
      mode: "create",
      stableId: generateItemId(),
      categoryStableId,
      name: "",
      sort,
      specsKind: "markdown",
      markdown: "",
      pairs: [{ key: "", value: "" }],
      url: "",
    });
  }, [tree]);

  const openEditItem = useCallback((item: GearItemPayload) => {
    const specs = item.specs;
    const isMd = specs.kind === "markdown";
    setItemSheet({
      mode: "edit",
      stableId: item.stableId,
      categoryStableId: item.categoryStableId,
      name: item.name,
      sort: item.sort,
      specsKind: isMd ? "markdown" : "kv",
      markdown: isMd ? specs.text : "",
      pairs:
        specs.kind === "kv" && specs.pairs.length > 0
          ? specs.pairs.map((p) => ({ key: p.key, value: p.value }))
          : [{ key: "", value: "" }],
      url: item.url ?? "",
    });
  }, []);

  const buildSpecsFromSheet = useCallback((sheet: ItemSheetState): GearSpecs => {
    if (sheet.specsKind === "markdown") {
      return { kind: "markdown", text: sheet.markdown };
    }
    const pairs = sheet.pairs
      .map((p) => ({
        key: p.key.trim(),
        value: p.value.trim(),
      }))
      .filter((p) => p.key.length > 0 || p.value.length > 0);
    return { kind: "kv", pairs };
  }, []);

  const saveItemSheet = useCallback(async () => {
    if (!itemSheet || !data) return;
    const nameErr = validateItemName(itemSheet.name);
    if (nameErr) {
      setInlineError(nameErr);
      toast.error(nameErr);
      return;
    }
    const specs = buildSpecsFromSheet(itemSheet);
    const specErr = validateSpecs(specs);
    if (specErr) {
      setInlineError(specErr);
      toast.error(specErr);
      return;
    }
    const urlErr = validateUrl(itemSheet.url);
    if (urlErr) {
      setInlineError(urlErr);
      toast.error(urlErr);
      return;
    }
    const name = itemSheet.name.trim();
    const urlRaw = itemSheet.url.trim();
    const url = urlRaw.length > 0 ? urlRaw : null;

    const payload = {
      stableId: itemSheet.stableId,
      categoryStableId: itemSheet.categoryStableId,
      name,
      sort: itemSheet.sort,
      specs,
      url,
    };

    const program = convexMutationEffect(() => putItem(payload));
    const ok = await runAction("Saving…", program);
    if (ok !== undefined) {
      setItemSheet(null);
      toast.success(itemSheet.mode === "create" ? "Item added." : "Item saved.");
    }
  }, [buildSpecsFromSheet, data, itemSheet, putItem, runAction]);

  const moveItem = useCallback(
    async (categoryStableId: string, itemStableId: string, direction: -1 | 1) => {
      const cat = tree.find((c) => c.stableId === categoryStableId);
      if (!cat) return;
      const items = sortItems(cat.items);
      const idx = items.findIndex((i) => i.stableId === itemStableId);
      if (idx === -1) return;
      const target = idx + direction;
      if (target < 0 || target >= items.length) return;
      const reordered = [...items];
      const [moved] = reordered.splice(idx, 1);
      reordered.splice(target, 0, moved);
      const effects = reordered.map((it, i) =>
        convexMutationEffect(() =>
          putItem({
            stableId: it.stableId,
            categoryStableId,
            name: it.name,
            sort: i,
            specs: it.specs,
            url: it.url ?? null,
          }),
        ),
      );
      const ok = await runAction("Reordering…", sequentialEffects(effects));
      if (ok !== undefined) toast.success("Order updated.");
    },
    [putItem, runAction, tree],
  );

  const confirmDeleteItem = useCallback(async () => {
    if (!deleteItemId) return;
    const program = convexMutationEffect(() =>
      removeItem({ stableId: deleteItemId }),
    );
    const ok = await runAction("Deleting…", program);
    setDeleteItemId(null);
    if (ok !== undefined) toast.success("Item removed.");
  }, [deleteItemId, removeItem, runAction]);

  const publishProgram = convexMutationEffect(() => publishGear({}));

  if (data === undefined) {
    return (
      <p className="body-text text-foreground/80">Loading gear…</p>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Studio gear
          </h2>
          <p className="body-text-small max-w-2xl text-foreground/85">
            Organize equipment by category. Edits stay in draft until you publish
            the gear section.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="body-text-small text-foreground/85">
            {tree.length === 0
              ? "Start by adding a category, then add items inside it."
              : `${tree.length} categor${tree.length === 1 ? "y" : "ies"}`}
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0 sm:w-auto"
            onClick={openCreateCategory}
          >
            <Plus className="mr-1 size-4" aria-hidden />
            Add category
          </Button>
        </div>
      </div>

      {tree.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-foreground/80">
          No gear yet. Add a category to list microphones, consoles, and other
          studio equipment.
        </p>
      ) : (
        <div className="space-y-5">
          {tree.map((cat, catIdx) => (
            <section
              key={cat.stableId}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
                    Category
                  </p>
                  <h3 className="font-heading text-lg font-semibold leading-snug text-foreground">
                    {cat.name}
                  </h3>
                  <p className="body-text-small text-foreground/75">
                    {cat.items.length} item{cat.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-0.5 sm:flex-nowrap">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Move category up"
                    disabled={catIdx === 0 || busy !== null}
                    onClick={() => void moveCategory(cat.stableId, -1)}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Move category down"
                    disabled={catIdx === tree.length - 1 || busy !== null}
                    onClick={() => void moveCategory(cat.stableId, 1)}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Edit category name"
                    disabled={busy !== null}
                    onClick={() =>
                      setCategorySheet({
                        mode: "edit",
                        stableId: cat.stableId,
                        name: cat.name,
                        sort: cat.sort,
                      })
                    }
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Delete category"
                    disabled={busy !== null}
                    onClick={() => setDeleteCategoryId(cat.stableId)}
                  >
                    <Trash2 className="size-4 text-destructive" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-1 shrink-0"
                    disabled={busy !== null}
                    onClick={() => openCreateItem(cat.stableId)}
                  >
                    <Plus className="mr-1 size-3.5" aria-hidden />
                    Add item
                  </Button>
                </div>
              </div>

              {sortItems(cat.items).length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-foreground/80">
                  No items in this category yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {sortItems(cat.items).map((item, itemIdx, arr) => (
                    <li key={item.stableId}>
                      <div className="grid grid-cols-1 gap-3 px-5 py-3.5 transition-colors hover:bg-muted/25 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_auto] sm:items-start sm:gap-6 sm:py-3.5">
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-medium leading-snug text-foreground">
                            {item.name}
                          </p>
                          <p className="body-text-small text-foreground/80 sm:hidden">
                            {specsPreview(item.specs)}
                          </p>
                        </div>
                        <p className="body-text-small hidden min-w-0 whitespace-normal text-foreground/80 sm:block">
                          {specsPreview(item.specs)}
                        </p>
                        <div className="flex flex-nowrap items-center justify-end gap-0.5 sm:justify-self-end sm:pt-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Move ${item.name} up`}
                            disabled={itemIdx === 0 || busy !== null}
                            onClick={() =>
                              void moveItem(
                                cat.stableId,
                                item.stableId,
                                -1,
                              )
                            }
                          >
                            <ArrowUp className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Move ${item.name} down`}
                            disabled={
                              itemIdx === arr.length - 1 || busy !== null
                            }
                            onClick={() =>
                              void moveItem(
                                cat.stableId,
                                item.stableId,
                                1,
                              )
                            }
                          >
                            <ArrowDown className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${item.name}`}
                            disabled={busy !== null}
                            onClick={() => openEditItem(item)}
                          >
                            <Pencil className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${item.name}`}
                            disabled={busy !== null}
                            onClick={() =>
                              setDeleteItemId(item.stableId)
                            }
                          >
                            <Trash2
                              className="size-3.5 text-destructive"
                              aria-hidden
                            />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <CmsPublishToolbar
        section="gear"
        sectionLabel="gear"
        hasDraftOnServer={hasDraftOnServer}
        hasLocalEdits={hasLocalEdits}
        publishedAt={data.publishedAt ?? null}
        publishedByLabel={publishedByLabel}
        busy={busy}
        inlineError={inlineError}
        previewHref="/preview#equipment-specs"
        onPublish={() => {
          void (async () => {
            const ok = await runAction("Publishing…", publishProgram);
            if (ok !== undefined) {
              toast.success("Gear published.");
            }
          })();
        }}
        onDiscardConfirm={handleDiscardConfirm}
      />

      <Sheet
        open={categorySheet !== null}
        onOpenChange={(open) => {
          if (!open) setCategorySheet(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          {categorySheet ? (
            <>
              <SheetHeader>
                <SheetTitle>
                  {categorySheet.mode === "create"
                    ? "New category"
                    : "Edit category"}
                </SheetTitle>
                <SheetDescription>
                  Category names appear as section headings on the site.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="gear-cat-name">Name</Label>
                  <Input
                    id="gear-cat-name"
                    value={categorySheet.name}
                    maxLength={MAX_NAME_LEN}
                    onChange={(e) =>
                      setCategorySheet((prev) =>
                        prev ? { ...prev, name: e.target.value } : prev,
                      )
                    }
                    placeholder="e.g. Microphones"
                    aria-invalid={
                      categorySheet.name.trim().length === 0 ? true : undefined
                    }
                  />
                </div>
              </div>
              <SheetFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setCategorySheet(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  disabled={busy !== null}
                  onClick={() => void saveCategorySheet()}
                >
                  Save
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={itemSheet !== null}
        onOpenChange={(open) => {
          if (!open) setItemSheet(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col sm:max-w-lg"
        >
          {itemSheet ? (
            <ItemSheetBody
              itemSheet={itemSheet}
              setItemSheet={setItemSheet}
              busy={busy}
              onSave={() => void saveItemSheet()}
              onCancel={() => setItemSheet(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteCategoryId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteCategoryId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              All gear items in this category will be removed. This cannot be
              undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy !== null}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={busy !== null}
              onClick={() => void confirmDeleteCategory()}
            >
              {busy === "Deleting…" ? "Deleting…" : "Delete category"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteItemId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteItemId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the gear entry from your draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy !== null}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={busy !== null}
              onClick={() => void confirmDeleteItem()}
            >
              {busy === "Deleting…" ? "Deleting…" : "Delete item"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ItemSheetBody({
  itemSheet,
  setItemSheet,
  busy,
  onSave,
  onCancel,
}: {
  readonly itemSheet: ItemSheetState;
  readonly setItemSheet: Dispatch<
    SetStateAction<ItemSheetState | null>
  >;
  readonly busy: string | null;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}) {
  const selectClass = cn(
    "h-9 w-full min-w-0 appearance-none rounded-lg border border-input bg-background px-2.5 pr-8 py-1 text-sm font-medium text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
  );

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {itemSheet.mode === "create" ? "New gear item" : "Edit gear item"}
        </SheetTitle>
        <SheetDescription>
          Required: name. Details can be a single block of text or labeled
          lines.
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          <Label htmlFor="gear-item-name">Name</Label>
          <Input
            id="gear-item-name"
            value={itemSheet.name}
            maxLength={MAX_NAME_LEN}
            onChange={(e) =>
              setItemSheet((prev) =>
                prev ? { ...prev, name: e.target.value } : prev,
              )
            }
            placeholder="e.g. Neumann U87"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gear-specs-kind">Details format</Label>
          <div className="relative">
            <select
              id="gear-specs-kind"
              value={itemSheet.specsKind}
              onChange={(e) => {
                const v = e.target.value === "kv" ? "kv" : "markdown";
                setItemSheet((prev) => (prev ? { ...prev, specsKind: v } : prev));
              }}
              className={selectClass}
            >
              <option value="markdown">Paragraph</option>
              <option value="kv">Key / value lines</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        </div>

        {itemSheet.specsKind === "markdown" ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="gear-markdown">Details</Label>
              <span className="text-xs text-foreground/75 tabular-nums">
                {itemSheet.markdown.length}/{MAX_MARKDOWN_LEN}
              </span>
            </div>
            <Textarea
              id="gear-markdown"
              value={itemSheet.markdown}
              maxLength={MAX_MARKDOWN_LEN}
              onChange={(e) =>
                setItemSheet((prev) =>
                  prev ? { ...prev, markdown: e.target.value } : prev,
                )
              }
              rows={8}
              placeholder="Capsule, polar patterns, notable uses…"
              className="min-h-[8rem] resize-y"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Lines</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setItemSheet((prev) =>
                    prev
                      ? {
                          ...prev,
                          pairs: [...prev.pairs, { key: "", value: "" }],
                        }
                      : prev,
                  )
                }
              >
                <Plus className="mr-1 size-3.5" aria-hidden />
                Add line
              </Button>
            </div>
            <ul className="space-y-3">
              {itemSheet.pairs.map((pair, idx) => (
                <li
                  key={idx}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  <Input
                    placeholder="Label"
                    value={pair.key}
                    maxLength={MAX_KV_KEY_LEN}
                    onChange={(e) =>
                      setItemSheet((prev) => {
                        if (!prev) return prev;
                        const next = [...prev.pairs];
                        next[idx] = { ...next[idx], key: e.target.value };
                        return { ...prev, pairs: next };
                      })
                    }
                  />
                  <div className="flex gap-1">
                    <Input
                      className="flex-1"
                      placeholder="Value"
                      value={pair.value}
                      maxLength={MAX_KV_VALUE_LEN}
                      onChange={(e) =>
                        setItemSheet((prev) => {
                          if (!prev) return prev;
                          const next = [...prev.pairs];
                          next[idx] = { ...next[idx], value: e.target.value };
                          return { ...prev, pairs: next };
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove line ${idx + 1}`}
                      disabled={itemSheet.pairs.length <= 1}
                      onClick={() =>
                        setItemSheet((prev) => {
                          if (!prev || prev.pairs.length <= 1) return prev;
                          return {
                            ...prev,
                            pairs: prev.pairs.filter((_, i) => i !== idx),
                          };
                        })
                      }
                    >
                      <Trash2 className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="gear-url">Link (optional)</Label>
          <Input
            id="gear-url"
            type="url"
            inputMode="url"
            value={itemSheet.url}
            maxLength={MAX_URL_LEN}
            onChange={(e) =>
              setItemSheet((prev) =>
                prev ? { ...prev, url: e.target.value } : prev,
              )
            }
            placeholder="https://…"
          />
        </div>
      </div>

      <SheetFooter className="flex-col gap-2 border-t border-border pt-4 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={busy !== null}
          onClick={onSave}
        >
          Save
        </Button>
      </SheetFooter>
    </>
  );
}
