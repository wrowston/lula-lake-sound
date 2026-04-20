"use client";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
  useMutation,
} from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { useCallback, useMemo, useState } from "react";
import { Effect } from "effect";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { convexMutationEffect, type CmsAppError } from "@/lib/effect-errors";
import { runAdminEffect } from "@/lib/admin-run-effect";
import { CmsPublishToolbar } from "@/components/admin/cms-publish-toolbar";
import { useAutosaveDraft } from "@/lib/use-autosave-draft";

type BillingCadence =
  | "hourly"
  | "six_hour_block"
  | "daily"
  | "per_song"
  | "per_album"
  | "per_project"
  | "flat"
  | "custom";

type PricingPackage = {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  billingCadence: BillingCadence;
  unitLabel?: string;
  highlight: boolean;
  sortOrder: number;
  isActive: boolean;
  features?: string[];
};

type PricingContent = {
  flags: { priceTabEnabled: boolean };
  packages: PricingPackage[];
};

const VALID_CADENCES: readonly BillingCadence[] = [
  "hourly",
  "six_hour_block",
  "daily",
  "per_song",
  "per_album",
  "per_project",
  "flat",
  "custom",
] as const;

const CADENCE_LABELS: Record<BillingCadence, string> = {
  hourly: "Per hour",
  six_hour_block: "Per 6-hour block",
  daily: "Per day",
  per_song: "Per song",
  per_album: "Per album",
  per_project: "Per project",
  flat: "Flat rate",
  custom: "Custom…",
};

/** Shared `Input` / textarea styling so admin fields stay readable on light surfaces. */
const PRICING_FIELD_INPUT_CLASS =
  "text-foreground placeholder:text-muted-foreground";

function isCadence(value: string): value is BillingCadence {
  return (VALID_CADENCES as readonly string[]).includes(value);
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `pkg_${crypto.randomUUID()}`;
  }
  return `pkg_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function toPricingContent(raw: {
  flags: { priceTabEnabled: boolean };
  packages: PricingPackage[];
}): PricingContent {
  return {
    flags: { priceTabEnabled: raw.flags.priceTabEnabled },
    packages: raw.packages.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      currency: p.currency,
      billingCadence: p.billingCadence,
      unitLabel: p.unitLabel,
      highlight: p.highlight,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      features: p.features ? [...p.features] : undefined,
    })),
  };
}

function renumberSortOrder(packages: PricingPackage[]): PricingPackage[] {
  return packages.map((p, idx) => ({ ...p, sortOrder: idx }));
}

function priceCentsToDisplay(cents: number): string {
  if (!Number.isFinite(cents)) return "";
  return (cents / 100).toFixed(2);
}

function parsePriceInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

export function PricingEditor() {
  return (
    <>
      <AuthLoading>
        <p className="body-text text-muted-foreground">Authenticating…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="body-text text-muted-foreground">
          Sign in to manage pricing.
        </p>
      </Unauthenticated>

      <Authenticated>
        <PricingForm />
      </Authenticated>
    </>
  );
}

function PricingForm() {
  const { user } = useUser();
  const pricing = useQuery(api.admin.pricing.listDraft);
  const saveDraft = useMutation(api.admin.pricing.saveDraftPricing);
  const publish = useMutation(api.admin.pricing.publishPricing);
  const discard = useMutation(api.cms.discardDraft);

  const [localDraft, setLocalDraft] = useState<PricingContent | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const source: PricingContent | undefined = useMemo(() => {
    if (localDraft) return localDraft;
    if (!pricing) return undefined;
    return toPricingContent({
      flags: pricing.flags,
      packages: pricing.packages as PricingPackage[],
    });
  }, [localDraft, pricing]);

  const mutate = useCallback(
    (next: PricingContent) => {
      setInlineError(null);
      setLocalDraft(next);
    },
    [],
  );

  const setPriceTabEnabled = useCallback(
    (checked: boolean) => {
      if (!source) return;
      mutate({
        ...source,
        flags: { ...source.flags, priceTabEnabled: checked },
      });
    },
    [source, mutate],
  );

  const addPackage = useCallback(() => {
    if (!source) return;
    const next: PricingPackage = {
      id: generateId(),
      name: "New package",
      description: "",
      priceCents: 0,
      currency: "USD",
      billingCadence: "hourly",
      highlight: false,
      sortOrder: source.packages.length,
      isActive: true,
      features: [],
    };
    mutate({
      ...source,
      packages: renumberSortOrder([...source.packages, next]),
    });
  }, [source, mutate]);

  const updatePackage = useCallback(
    (id: string, patch: Partial<PricingPackage>) => {
      if (!source) return;
      mutate({
        ...source,
        packages: source.packages.map((p) =>
          p.id === id ? { ...p, ...patch } : p,
        ),
      });
    },
    [source, mutate],
  );

  const removePackage = useCallback(
    (id: string) => {
      if (!source) return;
      mutate({
        ...source,
        packages: renumberSortOrder(
          source.packages.filter((p) => p.id !== id),
        ),
      });
    },
    [source, mutate],
  );

  const movePackage = useCallback(
    (id: string, direction: -1 | 1) => {
      if (!source) return;
      const idx = source.packages.findIndex((p) => p.id === id);
      if (idx === -1) return;
      const target = idx + direction;
      if (target < 0 || target >= source.packages.length) return;
      const next = [...source.packages];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      mutate({
        ...source,
        packages: renumberSortOrder(next),
      });
    },
    [source, mutate],
  );

  const toggleHighlight = useCallback(
    (id: string) => {
      if (!source) return;
      mutate({
        ...source,
        packages: source.packages.map((p) => ({
          ...p,
          highlight: p.id === id ? !p.highlight : false,
        })),
      });
    },
    [source, mutate],
  );

  const runAction = useCallback(
    async <A,>(label: string, program: Effect.Effect<A, CmsAppError>) => {
      setInlineError(null);
      setBusy(label);
      const outcome = await runAdminEffect(program, {
        onErrorMessage: setInlineError,
      });
      if (outcome !== undefined) {
        setLocalDraft(null);
      }
      setBusy(null);
      return outcome;
    },
    [],
  );

  const hasDraftOnServer = pricing?.hasDraftChanges ?? false;
  const hasLocalEdits = localDraft !== null;

  const { status: autosaveStatus, flush: flushAutosave } = useAutosaveDraft({
    dirty: hasLocalEdits && source !== undefined,
    debounceResetKey: localDraft,
    pauseWhen: busy !== null,
    saveEffect: () =>
      convexMutationEffect(() =>
        saveDraft({
          flags: source?.flags ?? { priceTabEnabled: false },
          packages: source?.packages ?? [],
        }),
      ),
    onSaved: () => setLocalDraft(null),
  });

  const handleDiscardConfirm = useCallback(async (): Promise<boolean> => {
    setInlineError(null);
    if (hasDraftOnServer) {
      setBusy("Discarding…");
      const outcome = await runAdminEffect(
        convexMutationEffect(() => discard({ section: "pricing" })),
        { onErrorMessage: setInlineError },
      );
      setBusy(null);
      if (outcome === undefined) {
        return false;
      }
    }
    setLocalDraft(null);
    toast.success(
      hasDraftOnServer
        ? "Draft discarded. The editor now matches the published site."
        : "Unsaved changes discarded.",
    );
    return true;
  }, [discard, hasDraftOnServer]);

  if (pricing === undefined) {
    return <p className="body-text text-muted-foreground">Loading pricing…</p>;
  }

  if (!source) {
    return (
      <p className="body-text text-muted-foreground">
        No pricing settings available.
      </p>
    );
  }

  const publishedByLabel =
    pricing.publishedBy && user?.id === pricing.publishedBy ? "You" : undefined;

  return (
    <div className="space-y-10 pb-24">
      <fieldset className="space-y-3">
        <legend className="label-text text-muted-foreground">Visibility</legend>
        <div className="flex items-start gap-3">
          <Switch
            id="pricing-price-tab-enabled"
            checked={source.flags.priceTabEnabled}
            onCheckedChange={setPriceTabEnabled}
          />
          <div className="space-y-1">
            <label
              htmlFor="pricing-price-tab-enabled"
              className="body-text-small cursor-pointer text-foreground"
            >
              Show pricing on marketing site
            </label>
            <p className="body-text-small text-muted-foreground">
              Hides pricing on the public site when off. Preview still shows
              the draft value.
            </p>
          </div>
        </div>
      </fieldset>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Packages &amp; rates</h2>
            <p className="body-text-small text-muted-foreground">
              Hourly, 6-hour-block, or any other cadence. The highlighted row
              is emphasized on the public site as the recommended package.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addPackage}>
            <Plus className="mr-1 size-4" aria-hidden />
            Add package
          </Button>
        </div>

        {source.packages.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No packages yet. Click “Add package” to create the first one.
          </p>
        ) : (
          <ul className="space-y-4">
            {source.packages.map((pkg, idx) => (
              <li
                key={pkg.id}
                className={cn(
                  "rounded-lg border p-4 shadow-sm transition-colors",
                  pkg.highlight
                    ? "border-primary/60 bg-primary/5"
                    : "border-border bg-background",
                  !pkg.isActive && "opacity-60",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono text-xs">#{idx + 1}</span>
                    {pkg.highlight ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        <Star className="size-3" aria-hidden /> Recommended
                      </span>
                    ) : null}
                    {!pkg.isActive ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Hidden
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Move up"
                      disabled={idx === 0}
                      onClick={() => movePackage(pkg.id, -1)}
                    >
                      <ArrowUp className="size-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Move down"
                      disabled={idx === source.packages.length - 1}
                      onClick={() => movePackage(pkg.id, 1)}
                    >
                      <ArrowDown className="size-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete package"
                      onClick={() => removePackage(pkg.id)}
                    >
                      <Trash2 className="size-4 text-destructive" aria-hidden />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="body-text-small text-muted-foreground">
                      Name
                    </span>
                    <Input
                      type="text"
                      value={pkg.name}
                      onChange={(e) =>
                        updatePackage(pkg.id, { name: e.target.value })
                      }
                      placeholder="Recording — Hourly"
                      className={PRICING_FIELD_INPUT_CLASS}
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="body-text-small text-muted-foreground">
                      Cadence
                    </span>
                    <div className="relative">
                      <select
                        value={pkg.billingCadence}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (!isCadence(raw)) return;
                          // Switching to a preset clears any custom unit
                          // label so the preset's default label shows through.
                          // Switching to custom preseeds unitLabel from the
                          // previous preset so the user has a starting point.
                          if (raw === "custom") {
                            updatePackage(pkg.id, {
                              billingCadence: raw,
                              unitLabel:
                                pkg.unitLabel && pkg.unitLabel.trim().length > 0
                                  ? pkg.unitLabel
                                  : CADENCE_LABELS[pkg.billingCadence]
                                      .toLowerCase()
                                      .replace(/…$/, ""),
                            });
                          } else {
                            updatePackage(pkg.id, {
                              billingCadence: raw,
                              unitLabel: undefined,
                            });
                          }
                        }}
                        className={cn(
                          "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-background px-2.5 pr-8 py-1 text-sm font-medium text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
                        )}
                      >
                        {VALID_CADENCES.map((c) => (
                          <option key={c} value={c}>
                            {CADENCE_LABELS[c]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                    </div>
                  </label>

                  <label className="block space-y-1">
                    <span className="body-text-small text-muted-foreground">
                      Price
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        aria-label="Price amount"
                        value={priceCentsToDisplay(pkg.priceCents)}
                        onChange={(e) => {
                          const next = parsePriceInput(e.target.value);
                          if (next === null) {
                            if (e.target.value.trim() === "") {
                              updatePackage(pkg.id, { priceCents: 0 });
                            }
                            return;
                          }
                          updatePackage(pkg.id, { priceCents: next });
                        }}
                        className={cn(PRICING_FIELD_INPUT_CLASS, "flex-1")}
                      />
                      <Input
                        type="text"
                        aria-label="Currency"
                        value={pkg.currency}
                        maxLength={6}
                        onChange={(e) =>
                          updatePackage(pkg.id, {
                            currency: e.target.value.toUpperCase(),
                          })
                        }
                        className={cn(PRICING_FIELD_INPUT_CLASS, "w-20")}
                      />
                    </div>
                  </label>

                  <label className="block space-y-1">
                    <span className="body-text-small text-muted-foreground">
                      {pkg.billingCadence === "custom"
                        ? "Custom cadence label"
                        : "Unit label (optional)"}
                    </span>
                    <Input
                      type="text"
                      value={pkg.unitLabel ?? ""}
                      onChange={(e) =>
                        updatePackage(pkg.id, {
                          unitLabel:
                            e.target.value === ""
                              ? undefined
                              : e.target.value,
                        })
                      }
                      onBlur={(e) => {
                        const trimmed = e.target.value.trim();
                        if (trimmed !== (pkg.unitLabel ?? "")) {
                          updatePackage(pkg.id, {
                            unitLabel: trimmed === "" ? undefined : trimmed,
                          });
                        }
                      }}
                      placeholder={
                        pkg.billingCadence === "custom"
                          ? "e.g. per weekend lockout"
                          : CADENCE_LABELS[pkg.billingCadence]
                      }
                      aria-invalid={
                        pkg.billingCadence === "custom" &&
                        (pkg.unitLabel ?? "").trim() === ""
                      }
                      className={PRICING_FIELD_INPUT_CLASS}
                    />
                    {pkg.billingCadence === "custom" &&
                    (pkg.unitLabel ?? "").trim() === "" ? (
                      <p className="text-xs text-destructive">
                        Required for custom cadence.
                      </p>
                    ) : null}
                  </label>

                  <label className="col-span-full block space-y-1">
                    <span className="body-text-small text-muted-foreground">
                      Description
                    </span>
                    <textarea
                      rows={2}
                      value={pkg.description ?? ""}
                      onChange={(e) =>
                        updatePackage(pkg.id, {
                          description:
                            e.target.value.trim() === ""
                              ? undefined
                              : e.target.value,
                        })
                      }
                      className={cn(
                        PRICING_FIELD_INPUT_CLASS,
                        "block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
                      )}
                    />
                  </label>

                  <div className="col-span-full space-y-2">
                    <span className="body-text-small text-muted-foreground">
                      Features
                    </span>
                    <FeaturesEditor
                      features={pkg.features ?? []}
                      onChange={(next) =>
                        updatePackage(pkg.id, {
                          features: next.length > 0 ? next : undefined,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={pkg.highlight}
                      onCheckedChange={() => toggleHighlight(pkg.id)}
                    />
                    Recommended
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={pkg.isActive}
                      onCheckedChange={(checked) =>
                        updatePackage(pkg.id, { isActive: checked })
                      }
                    />
                    Show on site
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CmsPublishToolbar
        section="pricing"
        sectionLabel="pricing"
        hasDraftOnServer={hasDraftOnServer}
        hasLocalEdits={hasLocalEdits}
        publishedAt={pricing.publishedAt ?? null}
        publishedByLabel={publishedByLabel}
        busy={busy}
        inlineError={inlineError}
        autosaveStatus={autosaveStatus}
        previewHref="/preview#services-pricing"
        onPublish={() => {
          const publishOnce = convexMutationEffect(() => publish({}));
          void (async () => {
            if (hasLocalEdits) {
              const flushed = await flushAutosave();
              if (!flushed) return;
            }
            await runAction("Publishing…", publishOnce);
          })();
        }}
        onDiscardConfirm={handleDiscardConfirm}
      />
    </div>
  );
}

interface FeaturesEditorProps {
  readonly features: readonly string[];
  readonly onChange: (next: string[]) => void;
}

/**
 * One input per feature so each bullet is an obvious, focusable field. Empty
 * rows are trimmed on blur so the stored list never contains whitespace-only
 * entries, but the row itself stays visible while the user is typing.
 */
function FeaturesEditor({ features, onChange }: FeaturesEditorProps) {
  const update = (idx: number, value: string) => {
    const next = [...features];
    next[idx] = value;
    onChange(next);
  };

  const remove = (idx: number) => {
    const next = features.filter((_, i) => i !== idx);
    onChange(next);
  };

  const add = () => {
    onChange([...features, ""]);
  };

  const commit = () => {
    const cleaned = features.map((f) => f.trim()).filter((f) => f.length > 0);
    if (cleaned.length !== features.length) {
      onChange(cleaned);
    }
  };

  return (
    <div className="space-y-2">
      {features.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          No features yet. Add bullet points describing what this package
          includes.
        </p>
      ) : (
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <Input
                type="text"
                value={feature}
                onChange={(e) => update(idx, e.target.value)}
                onBlur={commit}
                placeholder={`Feature ${idx + 1}`}
                className={cn(PRICING_FIELD_INPUT_CLASS, "flex-1")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove feature ${idx + 1}`}
                onClick={() => remove(idx)}
              >
                <X className="size-4 text-muted-foreground" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1 size-3.5" aria-hidden />
        Add feature
      </Button>
    </div>
  );
}
