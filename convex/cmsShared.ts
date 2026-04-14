import type { Doc } from "./_generated/dataModel";

/** Single source of truth for initial `publishedSnapshot` on new settings rows. */
export const SETTINGS_DEFAULTS: Doc<"cmsSections">["publishedSnapshot"] = {
  flags: { priceTabEnabled: true },
  metadata: {
    title: "Lula Lake Sound",
    description: "Music Production and Recording Services",
  },
};

/** Deep equality for settings snapshots without relying on `JSON.stringify` key order. */
export function settingsSnapshotsEqual(
  a: Doc<"cmsSections">["publishedSnapshot"],
  b: Doc<"cmsSections">["publishedSnapshot"],
): boolean {
  if (a.flags.priceTabEnabled !== b.flags.priceTabEnabled) {
    return false;
  }
  const ma = a.metadata;
  const mb = b.metadata;
  if (ma === undefined && mb === undefined) {
    return true;
  }
  if (ma === undefined || mb === undefined) {
    return false;
  }
  return ma.title === mb.title && ma.description === mb.description;
}
