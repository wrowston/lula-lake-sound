import type { Infer } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type {
  pricingBillingCadenceValidator,
  pricingContentValidator,
  pricingPackageValidator,
  settingsContentValidator,
} from "./schema.shared";

export type CmsSection = Doc<"cmsSections">["section"];
export type CmsSnapshot = Doc<"cmsSections">["publishedSnapshot"];
export type SettingsSnapshot = Infer<typeof settingsContentValidator>;
export type PricingSnapshot = Infer<typeof pricingContentValidator>;
export type PricingPackage = Infer<typeof pricingPackageValidator>;
export type PricingBillingCadence = Infer<typeof pricingBillingCadenceValidator>;

/** Per-section default snapshots used for seeding and new-row inserts. */
export const SETTINGS_DEFAULTS: SettingsSnapshot = {
  metadata: {
    title: "Lula Lake Sound",
    description: "Music Production and Recording Services",
  },
};

/**
 * Default catalog shipped to brand-new deployments. Mirrors the legacy
 * hard-coded rates on `components/services-pricing.tsx` so the public site
 * renders the familiar pricing before the owner customizes anything.
 */
export const DEFAULT_PRICING_PACKAGES: PricingPackage[] = [
  {
    id: "pkg_recording_hourly",
    name: "Recording — Hourly",
    description: "Pay-as-you-go tracking time with an engineer included.",
    priceCents: 6000,
    currency: "USD",
    billingCadence: "hourly",
    highlight: false,
    sortOrder: 0,
    isActive: true,
    features: [
      "Experienced engineer included",
      "Full analog and digital signal chain",
      "Comfortable lounge and kitchen",
    ],
  },
  {
    id: "pkg_recording_six_hour",
    name: "Recording — 6 Hour Block",
    description: "Half-day recording session at a discounted block rate.",
    priceCents: 30000,
    currency: "USD",
    billingCadence: "six_hour_block",
    unitLabel: "per 6-hour block",
    highlight: true,
    sortOrder: 1,
    isActive: true,
    features: [
      "Six continuous hours in the live room",
      "Engineer + setup included",
      "Ideal for EP / single tracking days",
    ],
  },
  {
    id: "pkg_mixing",
    name: "Mixing & Mastering",
    description: "Polish tracked material into a release-ready mix + master.",
    priceCents: 15000,
    currency: "USD",
    billingCadence: "per_song",
    highlight: false,
    sortOrder: 2,
    isActive: true,
    features: [
      "Professional mixing per song",
      "Mastering included",
      "Stems provided on delivery",
    ],
  },
];

export const PRICING_DEFAULTS: PricingSnapshot = {
  flags: { priceTabEnabled: true },
  packages: DEFAULT_PRICING_PACKAGES,
};

export function defaultSnapshotForSection(section: CmsSection): CmsSnapshot {
  return section === "settings" ? SETTINGS_DEFAULTS : PRICING_DEFAULTS;
}

/**
 * Default user-facing label for each billing cadence.
 *
 * For the `"custom"` variant, callers should pass the package's `unitLabel`
 * directly — this helper returns an empty string as a sentinel so ignoring
 * the custom case is visible (never a plausible-but-wrong label).
 */
export function billingCadenceLabel(cadence: PricingBillingCadence): string {
  switch (cadence) {
    case "hourly":
      return "per hour";
    case "six_hour_block":
      return "per 6-hour block";
    case "daily":
      return "per day";
    case "per_song":
      return "per song";
    case "per_album":
      return "per album";
    case "per_project":
      return "per project";
    case "flat":
      return "flat rate";
    case "custom":
      return "";
  }
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
