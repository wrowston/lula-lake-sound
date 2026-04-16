import type { Doc } from "./_generated/dataModel";
import { SETTINGS_DEFAULTS } from "./cmsShared";

type SettingsFlags = Doc<"cmsSections">["publishedSnapshot"]["flags"];

function isValidFlags(value: unknown): value is SettingsFlags {
  return (
    typeof value === "object" &&
    value !== null &&
    "priceTabEnabled" in value &&
    typeof (value as { priceTabEnabled: unknown }).priceTabEnabled === "boolean"
  );
}

/**
 * Returns safe published settings flags for public readers: never throws if
 * `publishedSnapshot` is partially invalid; falls back to seeded defaults.
 */
export function publishedSettingsFromRow(
  row: Doc<"cmsSections"> | null,
): { flags: SettingsFlags } | null {
  if (!row) {
    return null;
  }

  const snap = row.publishedSnapshot as unknown;
  if (typeof snap !== "object" || snap === null) {
    return {
      flags: SETTINGS_DEFAULTS.flags,
    };
  }

  const rawFlags = (snap as { flags?: unknown }).flags;
  const flags = isValidFlags(rawFlags) ? rawFlags : SETTINGS_DEFAULTS.flags;

  return { flags };
}
