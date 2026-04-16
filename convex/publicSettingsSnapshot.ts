import type { Doc } from "./_generated/dataModel";
import {
  PRICING_DEFAULTS,
  SETTINGS_DEFAULTS,
  type PricingPackage,
  type PricingSnapshot,
  type SettingsSnapshot,
} from "./cmsShared";

type SettingsFlags = PricingSnapshot["flags"];
type SettingsMetadata = NonNullable<SettingsSnapshot["metadata"]>;

function isValidFlags(value: unknown): value is SettingsFlags {
  return (
    typeof value === "object" &&
    value !== null &&
    "priceTabEnabled" in value &&
    typeof (value as { priceTabEnabled: unknown }).priceTabEnabled === "boolean"
  );
}

const VALID_CADENCES = new Set<PricingPackage["billingCadence"]>([
  "hourly",
  "six_hour_block",
  "daily",
  "per_song",
  "per_album",
  "per_project",
  "flat",
]);

function isValidPackage(value: unknown): value is PricingPackage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || v.id.trim().length === 0) return false;
  if (typeof v.name !== "string" || v.name.trim().length === 0) return false;
  if (
    typeof v.priceCents !== "number" ||
    !Number.isFinite(v.priceCents) ||
    v.priceCents < 0
  )
    return false;
  if (typeof v.currency !== "string" || v.currency.trim().length === 0)
    return false;
  if (
    typeof v.billingCadence !== "string" ||
    !VALID_CADENCES.has(v.billingCadence as PricingPackage["billingCadence"])
  )
    return false;
  if (typeof v.highlight !== "boolean") return false;
  if (typeof v.sortOrder !== "number" || !Number.isFinite(v.sortOrder))
    return false;
  if (typeof v.isActive !== "boolean") return false;
  if (
    v.description !== undefined &&
    v.description !== null &&
    typeof v.description !== "string"
  )
    return false;
  if (
    v.unitLabel !== undefined &&
    v.unitLabel !== null &&
    typeof v.unitLabel !== "string"
  )
    return false;
  if (v.features !== undefined && v.features !== null) {
    if (!Array.isArray(v.features)) return false;
    if (!v.features.every((f) => typeof f === "string")) return false;
  }
  return true;
}

/** Keep only packages the public should see, sorted by `sortOrder` then name. */
export function sanitizePricingPackages(raw: unknown): PricingPackage[] {
  if (!Array.isArray(raw)) return [];
  const out: PricingPackage[] = [];
  for (const item of raw) {
    if (isValidPackage(item)) {
      out.push(item);
    }
  }
  out.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.name.localeCompare(b.name);
  });
  return out;
}

/**
 * Returns safe published pricing data for public readers.
 *
 * Flag resolution order:
 * 1. `pricing` row's `publishedSnapshot.flags` (new split schema), when valid.
 * 2. Legacy `settings` row's `publishedSnapshot.flags` (pre-split), when valid.
 * 3. `PRICING_DEFAULTS`.
 *
 * Packages come from the `pricing` row when present and valid; legacy rows
 * never stored packages so this is always `[]` until the first pricing publish.
 *
 * Falling back to legacy is what keeps the site rendering correctly for
 * deployments that haven't yet written to the pricing section.
 */
export function publishedPricingFromRows(
  pricingRow: Doc<"cmsSections"> | null,
  settingsRow: Doc<"cmsSections"> | null,
): { flags: SettingsFlags; packages: PricingPackage[] } {
  let flags: SettingsFlags | null = null;
  let packages: PricingPackage[] = [];

  const pricingSnap = pricingRow?.publishedSnapshot as unknown;
  if (pricingSnap && typeof pricingSnap === "object") {
    const rawFlags = (pricingSnap as { flags?: unknown }).flags;
    if (isValidFlags(rawFlags)) {
      flags = rawFlags;
    }
    packages = sanitizePricingPackages(
      (pricingSnap as { packages?: unknown }).packages,
    );
  }

  if (flags === null) {
    const settingsSnap = settingsRow?.publishedSnapshot as unknown;
    if (settingsSnap && typeof settingsSnap === "object") {
      const rawFlags = (settingsSnap as { flags?: unknown }).flags;
      if (isValidFlags(rawFlags)) {
        flags = rawFlags;
      }
    }
  }

  return {
    flags: flags ?? PRICING_DEFAULTS.flags,
    packages,
  };
}

/**
 * Returns safe published site metadata. Never throws if `publishedSnapshot`
 * is partially invalid; falls back to seeded defaults.
 */
export function publishedSettingsFromRow(
  row: Doc<"cmsSections"> | null,
): { metadata: SettingsMetadata } {
  const snap = row?.publishedSnapshot as unknown;
  const defaults = SETTINGS_DEFAULTS.metadata ?? {
    title: "",
    description: "",
  };
  if (!snap || typeof snap !== "object") {
    return { metadata: defaults };
  }

  const rawMetadata = (snap as { metadata?: unknown }).metadata;
  if (
    rawMetadata === null ||
    rawMetadata === undefined ||
    typeof rawMetadata !== "object"
  ) {
    return { metadata: defaults };
  }

  const m = rawMetadata as { title?: unknown; description?: unknown };
  return {
    metadata: {
      title: typeof m.title === "string" ? m.title : defaults.title,
      description:
        typeof m.description === "string"
          ? m.description
          : defaults.description,
    },
  };
}
