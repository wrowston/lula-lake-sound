import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import {
  ABOUT_DEFAULTS,
  PRICING_DEFAULTS,
  SETTINGS_DEFAULTS,
  type AboutBlock,
  type AboutSnapshot,
  type AboutTeamMember,
  type PricingPackage,
  type PricingSnapshot,
  type PublicAboutSnapshot,
  type PublicAboutTeamMember,
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
  "custom",
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
  if (
    v.billingCadence === "custom" &&
    (typeof v.unitLabel !== "string" || v.unitLabel.trim().length === 0)
  ) {
    return false;
  }
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

function isValidAboutBlock(value: unknown): value is AboutBlock {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.type !== "paragraph" && v.type !== "heading") return false;
  if (typeof v.text !== "string") return false;
  return true;
}

function isValidAboutTeamMember(value: unknown): value is AboutTeamMember {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || v.id.trim().length === 0) return false;
  if (typeof v.name !== "string") return false;
  if (typeof v.title !== "string") return false;
  if (
    v.storageId !== undefined &&
    (typeof v.storageId !== "string" || v.storageId.length === 0)
  ) {
    return false;
  }
  return true;
}

/**
 * Returns safe published About page copy. Tolerant of partially-invalid
 * stored data (e.g. a stray non-string highlight won't blow up the public
 * route) and falls back to `ABOUT_DEFAULTS` when there's nothing usable.
 *
 * Strings are passed through **as text** — consumers must not feed them to
 * `dangerouslySetInnerHTML`. If a future field stores markdown that allows
 * raw HTML, sanitize here (e.g. rehype-sanitize) before returning.
 */
export function publishedAboutFromRow(
  row: Doc<"cmsSections"> | null,
): AboutSnapshot {
  const snap = row?.publishedSnapshot as unknown;
  if (!snap || typeof snap !== "object") {
    return ABOUT_DEFAULTS;
  }

  const s = snap as {
    published?: unknown;
    heroImageStorageId?: unknown;
    heroTitle?: unknown;
    heroSubtitle?: unknown;
    bodyHtml?: unknown;
    body?: unknown;
    pullQuote?: unknown;
    highlights?: unknown;
    seoTitle?: unknown;
    seoDescription?: unknown;
    teamMembers?: unknown;
  };

  // INF-46: hidden by default. Missing flag on legacy rows is treated as
  // `false` so shipping the feature doesn't unexpectedly expose the page;
  // the owner must toggle it on explicitly from the CMS.
  const published = typeof s.published === "boolean" ? s.published : false;
  const heroImageStorageId =
    typeof s.heroImageStorageId === "string" && s.heroImageStorageId.length > 0
      ? (s.heroImageStorageId as Id<"_storage">)
      : undefined;
  const heroTitle =
    typeof s.heroTitle === "string" ? s.heroTitle : ABOUT_DEFAULTS.heroTitle;
  const heroSubtitle =
    typeof s.heroSubtitle === "string" ? s.heroSubtitle : undefined;

  const bodyHtml =
    typeof s.bodyHtml === "string" && s.bodyHtml.trim().length > 0
      ? s.bodyHtml
      : undefined;

  const body: AboutBlock[] = Array.isArray(s.body)
    ? s.body.filter(isValidAboutBlock)
    : [];

  const pullQuote =
    typeof s.pullQuote === "string" && s.pullQuote.trim().length > 0
      ? s.pullQuote
      : undefined;

  const highlights: string[] | undefined = Array.isArray(s.highlights)
    ? s.highlights.filter((h): h is string => typeof h === "string")
    : undefined;

  const seoTitle = typeof s.seoTitle === "string" ? s.seoTitle : undefined;
  const seoDescription =
    typeof s.seoDescription === "string" ? s.seoDescription : undefined;

  const teamMembers: AboutTeamMember[] | undefined = Array.isArray(s.teamMembers)
    ? s.teamMembers.filter(isValidAboutTeamMember).map((m) => ({
        id: m.id,
        name: m.name,
        title: m.title,
        ...(m.storageId !== undefined
          ? { storageId: m.storageId as Id<"_storage"> }
          : {}),
      }))
    : undefined;

  return {
    published,
    ...(heroImageStorageId !== undefined ? { heroImageStorageId } : {}),
    heroTitle,
    ...(heroSubtitle !== undefined ? { heroSubtitle } : {}),
    ...(bodyHtml !== undefined ? { bodyHtml } : {}),
    // Legacy block body kept so pre-INF-98 rows keep rendering when
    // `bodyHtml` is absent. Once all rows have `bodyHtml`, this can be
    // dropped alongside the schema field.
    body: body.length > 0 ? body : ABOUT_DEFAULTS.body,
    ...(pullQuote !== undefined ? { pullQuote } : {}),
    ...(highlights !== undefined ? { highlights } : {}),
    ...(seoTitle !== undefined ? { seoTitle } : {}),
    ...(seoDescription !== undefined ? { seoDescription } : {}),
    ...(teamMembers !== undefined && teamMembers.length > 0
      ? { teamMembers }
      : {}),
  };
}

/**
 * Resolve team headshots + the CMS-picked hero image to signed URLs for
 * anonymous public callers (never leaks raw storage ids). `null` signals the
 * blob is missing / deleted — the public renderer should fall back to a
 * baked-in default image.
 */
export async function materializePublicAbout(
  ctx: QueryCtx,
  snapshot: AboutSnapshot,
): Promise<PublicAboutSnapshot> {
  const { teamMembers, heroImageStorageId, ...rest } = snapshot;

  const heroImageUrl =
    heroImageStorageId !== undefined
      ? await ctx.storage.getUrl(heroImageStorageId)
      : null;

  const publicTeam: PublicAboutTeamMember[] | undefined =
    teamMembers && teamMembers.length > 0
      ? await Promise.all(
          teamMembers.map(async (m) => ({
            id: m.id,
            name: m.name,
            title: m.title,
            imageUrl:
              m.storageId !== undefined
                ? await ctx.storage.getUrl(m.storageId)
                : null,
          })),
        )
      : undefined;

  return {
    ...rest,
    ...(publicTeam !== undefined ? { teamMembers: publicTeam } : {}),
    heroImageUrl,
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
