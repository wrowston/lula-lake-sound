import type { Doc } from "./_generated/dataModel";
import {
  PRICING_DEFAULTS,
  SETTINGS_DEFAULTS,
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

/**
 * Returns safe published pricing flags for public readers.
 *
 * Resolution order:
 * 1. `pricing` row's `publishedSnapshot.flags` (new split schema), when valid.
 * 2. Legacy `settings` row's `publishedSnapshot.flags` (pre-split), when valid.
 * 3. `PRICING_DEFAULTS`.
 *
 * Falling back to legacy is what keeps the site rendering correctly for
 * deployments that haven't yet written to the pricing section.
 */
export function publishedPricingFromRows(
  pricingRow: Doc<"cmsSections"> | null,
  settingsRow: Doc<"cmsSections"> | null,
): { flags: SettingsFlags } {
  const pricingSnap = pricingRow?.publishedSnapshot as unknown;
  if (pricingSnap && typeof pricingSnap === "object") {
    const rawFlags = (pricingSnap as { flags?: unknown }).flags;
    if (isValidFlags(rawFlags)) {
      return { flags: rawFlags };
    }
  }

  const settingsSnap = settingsRow?.publishedSnapshot as unknown;
  if (settingsSnap && typeof settingsSnap === "object") {
    const rawFlags = (settingsSnap as { flags?: unknown }).flags;
    if (isValidFlags(rawFlags)) {
      return { flags: rawFlags };
    }
  }

  return { flags: PRICING_DEFAULTS.flags };
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
