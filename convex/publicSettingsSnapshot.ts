import type { Doc } from "./_generated/dataModel";
import { SETTINGS_DEFAULTS } from "./cmsShared";

type SettingsFlags = Doc<"cmsSections">["publishedSnapshot"]["flags"];
type SettingsMetadata = NonNullable<
  Doc<"cmsSections">["publishedSnapshot"]["metadata"]
>;

/** Public API shape: `metadata` is either an object or explicit `null`, never `undefined`. */
export type PublicPublishedSettingsPayload = {
  flags: SettingsFlags;
  metadata: SettingsMetadata | null;
  updatedAt: number | null;
  publishedAt: number | null;
  publishedBy: string | null;
};

function isValidFlags(value: unknown): value is SettingsFlags {
  return (
    typeof value === "object" &&
    value !== null &&
    "priceTabEnabled" in value &&
    typeof (value as { priceTabEnabled: unknown }).priceTabEnabled === "boolean"
  );
}

function normalizeMetadata(
  value: unknown,
): Doc<"cmsSections">["publishedSnapshot"]["metadata"] {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  const o = value as Record<string, unknown>;
  const title = o.title;
  const description = o.description;
  const next: SettingsMetadata = {};
  if (typeof title === "string") {
    next.title = title;
  }
  if (typeof description === "string") {
    next.description = description;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

function metadataForPublic(
  normalized: Doc<"cmsSections">["publishedSnapshot"]["metadata"],
): NonNullable<Doc<"cmsSections">["publishedSnapshot"]["metadata"]> | null {
  return normalized !== undefined ? normalized : null;
}

/**
 * Returns safe published settings for public readers: never throws if
 * `publishedSnapshot` is partially invalid; falls back to seeded defaults.
 */
export function publishedSettingsFromRow(
  row: Doc<"cmsSections"> | null,
): PublicPublishedSettingsPayload | null {
  if (!row) {
    return null;
  }

  const snap = row.publishedSnapshot as unknown;
  if (typeof snap !== "object" || snap === null) {
    return {
      flags: SETTINGS_DEFAULTS.flags,
      metadata: metadataForPublic(SETTINGS_DEFAULTS.metadata),
      updatedAt: row.updatedAt,
      publishedAt: row.publishedAt,
      publishedBy: row.publishedBy ?? null,
    };
  }

  const rawFlags = (snap as { flags?: unknown }).flags;
  const flags = isValidFlags(rawFlags) ? rawFlags : SETTINGS_DEFAULTS.flags;

  const rawMeta = (snap as { metadata?: unknown }).metadata;
  const normalizedMeta = normalizeMetadata(rawMeta);
  const metadata =
    normalizedMeta !== undefined
      ? normalizedMeta
      : metadataForPublic(SETTINGS_DEFAULTS.metadata);

  return {
    flags,
    metadata,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    publishedBy: row.publishedBy ?? null,
  };
}
