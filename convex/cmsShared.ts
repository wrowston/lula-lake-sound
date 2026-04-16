import type { Infer } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type {
  settingsContentValidator,
  pricingContentValidator,
} from "./schema.shared";

export type CmsSection = Doc<"cmsSections">["section"];
export type CmsSnapshot = Doc<"cmsSections">["publishedSnapshot"];
export type SettingsSnapshot = Infer<typeof settingsContentValidator>;
export type PricingSnapshot = Infer<typeof pricingContentValidator>;

/** Per-section default snapshots used for seeding and new-row inserts. */
export const SETTINGS_DEFAULTS: SettingsSnapshot = {
  metadata: {
    title: "Lula Lake Sound",
    description: "Music Production and Recording Services",
  },
};

export const PRICING_DEFAULTS: PricingSnapshot = {
  flags: { priceTabEnabled: true },
};

export function defaultSnapshotForSection(section: CmsSection): CmsSnapshot {
  return section === "settings" ? SETTINGS_DEFAULTS : PRICING_DEFAULTS;
}

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

/** Deep equality for section snapshots without relying on `JSON.stringify` key order. */
export function cmsSnapshotsEqual(a: CmsSnapshot, b: CmsSnapshot): boolean {
  return deepEqual(a, b);
}

/**
 * Legacy alias kept so existing imports keep working.
 * @deprecated Use {@link cmsSnapshotsEqual}.
 */
export const settingsSnapshotsEqual = cmsSnapshotsEqual;
