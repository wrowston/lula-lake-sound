import type { Doc } from "./_generated/dataModel";

/** Single source of truth for initial `publishedSnapshot` on new settings rows. */
export const SETTINGS_DEFAULTS: Doc<"cmsSections">["publishedSnapshot"] = {
  flags: { priceTabEnabled: true },
  metadata: {
    title: "Lula Lake Sound",
    description: "Music Production and Recording Services",
  },
};

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (a === null || b === null) {
    return a === b;
  }
  if (typeof a !== "object") {
    return false;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  if (Array.isArray(b)) {
    return false;
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
  for (const k of keys) {
    if (!deepEqual(ao[k], bo[k])) {
      return false;
    }
  }
  return true;
}

/** Deep equality for settings snapshots without relying on `JSON.stringify` key order. */
export function settingsSnapshotsEqual(
  a: Doc<"cmsSections">["publishedSnapshot"],
  b: Doc<"cmsSections">["publishedSnapshot"],
): boolean {
  return deepEqual(a, b);
}
