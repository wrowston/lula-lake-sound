import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import {
  ABOUT_DEFAULTS,
  PRICING_DEFAULTS,
  SETTINGS_DEFAULTS,
  type AboutSnapshot,
  type PricingPackage,
  type PricingSnapshot,
  type PublicAboutSnapshot,
  type PublicAboutTeamMember,
  type SettingsSnapshot,
} from "./cmsShared";
import { loadAboutTree, type AboutTree } from "./aboutTree";
import { loadPricingPackages, pricingPackageFromRow } from "./pricingTree";
import { loadSettingsContent } from "./settingsTree";
import { getSectionMetaRow, publishedIsEnabled } from "./cmsMeta";

type SettingsFlags = PricingSnapshot["flags"];
type SettingsMetadata = NonNullable<SettingsSnapshot["metadata"]>;

/**
 * Keep only packages the public should see (active, well-formed), sorted
 * by `sortOrder` then name. Retained so older callers keep compiling; new
 * code should read `pricingPackages` rows directly and call
 * `pricingPackageFromRow`.
 */
export function sanitizePricingPackages(raw: unknown): PricingPackage[] {
  if (!Array.isArray(raw)) return [];
  const out: PricingPackage[] = [];
  for (const item of raw) {
    if (item && typeof item === "object") {
      out.push(item as PricingPackage);
    }
  }
  out.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
  return out;
}

/**
 * Resolve the published pricing payload for anonymous readers.
 *
 * Reads `pricingPackages` (scope="published") and the `pricing` row's
 * `isEnabled` flag. Returns the historical `{ flags: { priceTabEnabled },
 * packages }` shape so front-end consumers keep working while the admin
 * API transitions; `priceTabEnabled` now mirrors `cmsSections.isEnabled`.
 */
export async function publishedPricingFromScoped(
  ctx: QueryCtx,
): Promise<{ flags: SettingsFlags; packages: PricingPackage[] }> {
  const [pricingRow, packageRows] = await Promise.all([
    getSectionMetaRow(ctx, "pricing"),
    loadPricingPackages(ctx, "published"),
  ]);
  const priceTabEnabled = publishedIsEnabled(pricingRow, "pricing");
  return {
    flags: { priceTabEnabled },
    packages: packageRows.map(pricingPackageFromRow),
  };
}

function aboutSnapshotFromTree(tree: AboutTree): AboutSnapshot {
  if (tree.content === null) {
    return ABOUT_DEFAULTS;
  }
  return {
    ...(tree.content.heroImageStorageId !== undefined
      ? { heroImageStorageId: tree.content.heroImageStorageId }
      : {}),
    heroTitle: tree.content.heroTitle,
    ...(tree.content.heroSubtitle !== undefined
      ? { heroSubtitle: tree.content.heroSubtitle }
      : {}),
    ...(tree.content.bodyHtml !== undefined
      ? { bodyHtml: tree.content.bodyHtml }
      : {}),
    body:
      tree.content.bodyBlocks && tree.content.bodyBlocks.length > 0
        ? tree.content.bodyBlocks
        : ABOUT_DEFAULTS.body,
    ...(tree.content.pullQuote !== undefined
      ? { pullQuote: tree.content.pullQuote }
      : {}),
    ...(tree.highlights.length > 0
      ? { highlights: tree.highlights.map((h) => h.text) }
      : {}),
    ...(tree.content.seoTitle !== undefined
      ? { seoTitle: tree.content.seoTitle }
      : {}),
    ...(tree.content.seoDescription !== undefined
      ? { seoDescription: tree.content.seoDescription }
      : {}),
    ...(tree.teamMembers.length > 0
      ? {
          teamMembers: tree.teamMembers.map((m) => ({
            id: m.stableId,
            name: m.name,
            title: m.title,
            ...(m.storageId !== undefined
              ? { storageId: m.storageId as Id<"_storage"> }
              : {}),
          })),
        }
      : {}),
  };
}

/**
 * Published About payload for anonymous readers. Falls back to
 * `ABOUT_DEFAULTS` when no content exists so the public route always renders.
 */
export async function publishedAboutFromScoped(
  ctx: QueryCtx,
): Promise<AboutSnapshot> {
  const tree = await loadAboutTree(ctx, "published");
  return aboutSnapshotFromTree(tree);
}

/**
 * Owner-preview resolver — draft-first with published fallback. Matches the
 * editor's effective view so preview and admin stay in sync.
 */
export async function previewAboutFromScoped(
  ctx: QueryCtx,
): Promise<AboutSnapshot> {
  const draft = await loadAboutTree(ctx, "draft");
  if (draft.content !== null) {
    return aboutSnapshotFromTree(draft);
  }
  return publishedAboutFromScoped(ctx);
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
 * Published site metadata for anonymous readers. Falls back to the seeded
 * defaults when the row is missing or partial.
 */
export async function publishedSettingsFromScoped(
  ctx: QueryCtx,
): Promise<{ metadata: SettingsMetadata }> {
  const defaults = SETTINGS_DEFAULTS.metadata ?? {
    title: "",
    description: "",
  };
  const row = await loadSettingsContent(ctx, "published");
  if (!row) return { metadata: defaults };
  return {
    metadata: {
      ...(row.title !== undefined ? { title: row.title } : { title: defaults.title }),
      ...(row.description !== undefined
        ? { description: row.description }
        : { description: defaults.description }),
    },
  };
}

// --- Legacy shape shims -----------------------------------------------------
//
// A handful of older callers still ask for the pre-refactor readers. Keeping
// these thin shims means admin debug tools and tests keep compiling until
// they're swapped to the new readers.

export { PRICING_DEFAULTS };
