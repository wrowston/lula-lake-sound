/**
 * One-shot migration: extract section content out of
 * `cmsSections.publishedSnapshot` / `draftSnapshot` JSON blobs into the new
 * per-section scoped tables, fold the `marketingFeatureFlags` singleton into
 * `cmsSections.isEnabled`, and drop the legacy payloads.
 *
 * Idempotent: safe to re-run (checks target scope for existing rows before
 * inserting and tolerates already-stripped blob columns).
 *
 * Run once post-deploy:
 *
 *   bunx convex run migrations/extractSectionContent:extractSectionContent
 *
 * After this completes and is verified, a follow-up deploy can drop:
 *   - `publishedSnapshot` / `draftSnapshot` columns from `cmsSections`
 *   - the `marketingFeatureFlags` table itself
 *   - the `cmsSnapshotValidator` + per-section snapshot validators in schema.shared.ts
 */
import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
  DEFAULT_PRICING_PACKAGES,
  MARKETING_FEATURE_FLAGS_DEFAULTS,
  type AboutBlock,
  type CmsSection,
  type MarketingFeatureFlagsSnapshot,
  type PricingPackage,
} from "../cmsShared";
import { DEFAULT_IS_ENABLED } from "../cmsMeta";

type Scope = "draft" | "published";

type AboutSnapshotShape = {
  heroImageStorageId?: unknown;
  heroTitle?: unknown;
  heroSubtitle?: unknown;
  bodyHtml?: unknown;
  body?: unknown;
  pullQuote?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  highlights?: unknown;
  teamMembers?: unknown;
};

type PricingSnapshotShape = {
  flags?: {
    priceTabEnabled?: unknown;
  };
  packages?: unknown;
};

type SettingsSnapshotShape = {
  metadata?: {
    title?: unknown;
    description?: unknown;
  };
};

export const extractSectionContent = internalMutation({
  args: {},
  handler: async (ctx) => {
    const sections: CmsSection[] = [
      "settings",
      "pricing",
      "about",
      "recordings",
    ];

    // Pull the legacy marketing-flags singleton (if still present) so the
    // migration can seed each row's `isEnabled`.
    const legacyFlagsRow = await ctx.db
      .query("marketingFeatureFlags")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "default"))
      .unique();
    const legacyFlags = normalizeLegacyFlags(
      legacyFlagsRow?.publishedSnapshot,
    );

    // Make sure a metadata row exists for every section.
    for (const section of sections) {
      const existing = await ctx.db
        .query("cmsSections")
        .withIndex("by_section", (q) => q.eq("section", section))
        .unique();
      const now = Date.now();

      if (!existing) {
        await ctx.db.insert("cmsSections", {
          section,
          isEnabled: isEnabledFromLegacy(section, legacyFlags),
          hasDraftChanges: false,
          publishedAt: now,
          updatedAt: now,
        });
        continue;
      }

      // Extract any legacy snapshots into scoped tables.
      await extractAboutScopeIfAvailable(
        ctx,
        existing._id,
        section,
        "published",
        existing.publishedSnapshot,
      );
      await extractAboutScopeIfAvailable(
        ctx,
        existing._id,
        section,
        "draft",
        existing.draftSnapshot,
      );

      await extractPricingScopeIfAvailable(
        ctx,
        section,
        "published",
        existing.publishedSnapshot,
      );
      await extractPricingScopeIfAvailable(
        ctx,
        section,
        "draft",
        existing.draftSnapshot,
      );

      await extractSettingsScopeIfAvailable(
        ctx,
        section,
        "published",
        existing.publishedSnapshot,
      );
      await extractSettingsScopeIfAvailable(
        ctx,
        section,
        "draft",
        existing.draftSnapshot,
      );

      // Apply legacy flag + drop the snapshot columns + normalise metadata.
      const patch: Record<string, unknown> = {
        isEnabled:
          existing.isEnabled ?? isEnabledFromLegacy(section, legacyFlags),
        publishedSnapshot: undefined,
        draftSnapshot: undefined,
      };
      await ctx.db.patch(existing._id, patch);
    }

    // For pricing specifically: preserve `priceTabEnabled` from legacy
    // published pricing snapshot OR from the legacy settings snapshot
    // (pre-split deployments). If the legacy marketing flags set a value
    // for `pricingSection` we prefer that (explicit override).
    const pricingRow = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "pricing"))
      .unique();
    if (pricingRow && pricingRow.isEnabled === undefined) {
      const pricingLegacy = extractPriceTabEnabled(
        pricingRow.publishedSnapshot,
      );
      const settingsRow = await ctx.db
        .query("cmsSections")
        .withIndex("by_section", (q) => q.eq("section", "settings"))
        .unique();
      const settingsLegacy = extractPriceTabEnabled(
        settingsRow?.publishedSnapshot,
      );
      const effective =
        legacyFlags?.pricingSection ??
        pricingLegacy ??
        settingsLegacy ??
        DEFAULT_IS_ENABLED.pricing;
      await ctx.db.patch(pricingRow._id, { isEnabled: effective });
    }

    // Seed the published pricing catalogue from defaults when the migration
    // started from an empty deployment (fresh install).
    const publishedPricing = await ctx.db
      .query("pricingPackages")
      .withIndex("by_scope_and_sort", (q) => q.eq("scope", "published"))
      .take(1);
    if (publishedPricing.length === 0) {
      for (const pkg of DEFAULT_PRICING_PACKAGES) {
        await ctx.db.insert("pricingPackages", {
          scope: "published",
          stableId: pkg.id,
          name: pkg.name,
          ...(pkg.description !== undefined
            ? { description: pkg.description }
            : {}),
          priceCents: pkg.priceCents,
          currency: pkg.currency,
          billingCadence: pkg.billingCadence,
          ...(pkg.unitLabel !== undefined ? { unitLabel: pkg.unitLabel } : {}),
          highlight: pkg.highlight,
          sortOrder: pkg.sortOrder,
          isActive: pkg.isActive,
          ...(pkg.features !== undefined ? { features: pkg.features } : {}),
        });
      }
    }

    // Drop the legacy marketing-flags singleton now that every section has
    // its own `isEnabled`. A follow-up schema deploy removes the table.
    if (legacyFlagsRow) {
      await ctx.db.delete(legacyFlagsRow._id);
    }

    return { ok: true as const };
  },
});

function normalizeLegacyFlags(
  raw: unknown,
): MarketingFeatureFlagsSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const aboutPage = typeof r.aboutPage === "boolean" ? r.aboutPage : null;
  const recordingsPage =
    typeof r.recordingsPage === "boolean" ? r.recordingsPage : null;
  const pricingSection =
    typeof r.pricingSection === "boolean" ? r.pricingSection : null;
  if (
    aboutPage === null &&
    recordingsPage === null &&
    pricingSection === null
  ) {
    return null;
  }
  return {
    aboutPage: aboutPage ?? MARKETING_FEATURE_FLAGS_DEFAULTS.aboutPage,
    recordingsPage:
      recordingsPage ?? MARKETING_FEATURE_FLAGS_DEFAULTS.recordingsPage,
    pricingSection:
      pricingSection ?? MARKETING_FEATURE_FLAGS_DEFAULTS.pricingSection,
  };
}

function isEnabledFromLegacy(
  section: CmsSection,
  legacy: MarketingFeatureFlagsSnapshot | null,
): boolean {
  if (!legacy) return DEFAULT_IS_ENABLED[section];
  if (section === "about") return legacy.aboutPage;
  if (section === "recordings") return legacy.recordingsPage;
  if (section === "pricing") return legacy.pricingSection;
  return DEFAULT_IS_ENABLED[section];
}

function extractPriceTabEnabled(snapshot: unknown): boolean | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const s = snapshot as PricingSnapshotShape;
  if (s.flags && typeof s.flags.priceTabEnabled === "boolean") {
    return s.flags.priceTabEnabled;
  }
  return null;
}

async function extractAboutScopeIfAvailable(
  ctx: import("../_generated/server").MutationCtx,
  sectionRowId: Id<"cmsSections">,
  section: CmsSection,
  scope: Scope,
  snapshot: unknown,
): Promise<void> {
  if (section !== "about") return;
  if (!snapshot || typeof snapshot !== "object") return;

  // Skip if the target scope already has content (idempotency).
  const existing = await ctx.db
    .query("aboutContent")
    .withIndex("by_scope", (q) => q.eq("scope", scope))
    .unique();
  if (existing !== null) return;

  const s = snapshot as AboutSnapshotShape;
  const heroTitle =
    typeof s.heroTitle === "string" && s.heroTitle.length > 0
      ? s.heroTitle
      : null;
  if (heroTitle === null) return;

  const bodyBlocks: AboutBlock[] = Array.isArray(s.body)
    ? s.body.filter((b): b is AboutBlock => {
        if (!b || typeof b !== "object") return false;
        const type = (b as { type?: unknown }).type;
        if (type !== "paragraph" && type !== "heading") return false;
        return typeof (b as { text?: unknown }).text === "string";
      })
    : [];

  await ctx.db.insert("aboutContent", {
    scope,
    ...(typeof s.heroImageStorageId === "string" && s.heroImageStorageId.length > 0
      ? { heroImageStorageId: s.heroImageStorageId as Id<"_storage"> }
      : {}),
    heroTitle,
    ...(typeof s.heroSubtitle === "string"
      ? { heroSubtitle: s.heroSubtitle }
      : {}),
    ...(typeof s.bodyHtml === "string" ? { bodyHtml: s.bodyHtml } : {}),
    ...(bodyBlocks.length > 0 ? { bodyBlocks } : {}),
    ...(typeof s.pullQuote === "string" ? { pullQuote: s.pullQuote } : {}),
    ...(typeof s.seoTitle === "string" ? { seoTitle: s.seoTitle } : {}),
    ...(typeof s.seoDescription === "string"
      ? { seoDescription: s.seoDescription }
      : {}),
  });

  if (Array.isArray(s.highlights)) {
    let sort = 0;
    for (const h of s.highlights) {
      if (typeof h === "string" && h.trim().length > 0) {
        await ctx.db.insert("aboutHighlights", {
          scope,
          stableId: `hl_${sort}`,
          text: h,
          sort,
        });
        sort += 1;
      }
    }
  }

  if (Array.isArray(s.teamMembers)) {
    let sort = 0;
    for (const m of s.teamMembers) {
      if (!m || typeof m !== "object") continue;
      const mm = m as {
        id?: unknown;
        name?: unknown;
        title?: unknown;
        storageId?: unknown;
      };
      if (typeof mm.id !== "string" || mm.id.length === 0) continue;
      if (typeof mm.name !== "string") continue;
      if (typeof mm.title !== "string") continue;
      await ctx.db.insert("aboutTeamMembers", {
        scope,
        stableId: mm.id,
        name: mm.name,
        title: mm.title,
        ...(typeof mm.storageId === "string" && mm.storageId.length > 0
          ? { storageId: mm.storageId as Id<"_storage"> }
          : {}),
        sort,
      });
      sort += 1;
    }
  }

  // Reference the `sectionRowId` so the type checker sees it's used — we
  // keep it in the signature so future migrations can reach back to the
  // metadata row if they need to.
  void sectionRowId;
}

async function extractPricingScopeIfAvailable(
  ctx: import("../_generated/server").MutationCtx,
  section: CmsSection,
  scope: Scope,
  snapshot: unknown,
): Promise<void> {
  if (section !== "pricing") return;
  if (!snapshot || typeof snapshot !== "object") return;

  const existing = await ctx.db
    .query("pricingPackages")
    .withIndex("by_scope_and_sort", (q) => q.eq("scope", scope))
    .take(1);
  if (existing.length > 0) return;

  const s = snapshot as PricingSnapshotShape;
  if (!Array.isArray(s.packages)) return;

  const legalCadences: PricingPackage["billingCadence"][] = [
    "hourly",
    "six_hour_block",
    "daily",
    "per_song",
    "per_album",
    "per_project",
    "flat",
    "custom",
  ];

  for (const raw of s.packages) {
    if (!raw || typeof raw !== "object") continue;
    const p = raw as Record<string, unknown>;
    if (typeof p.id !== "string" || p.id.trim().length === 0) continue;
    if (typeof p.name !== "string" || p.name.trim().length === 0) continue;
    if (typeof p.priceCents !== "number" || !Number.isFinite(p.priceCents)) continue;
    if (typeof p.currency !== "string" || p.currency.trim().length === 0) continue;
    if (
      typeof p.billingCadence !== "string" ||
      !legalCadences.includes(p.billingCadence as PricingPackage["billingCadence"])
    )
      continue;
    if (typeof p.highlight !== "boolean") continue;
    if (typeof p.sortOrder !== "number") continue;
    if (typeof p.isActive !== "boolean") continue;

    await ctx.db.insert("pricingPackages", {
      scope,
      stableId: p.id,
      name: p.name,
      ...(typeof p.description === "string" ? { description: p.description } : {}),
      priceCents: p.priceCents,
      currency: p.currency,
      billingCadence: p.billingCadence as PricingPackage["billingCadence"],
      ...(typeof p.unitLabel === "string" ? { unitLabel: p.unitLabel } : {}),
      highlight: p.highlight,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      ...(Array.isArray(p.features) &&
      p.features.every((f) => typeof f === "string")
        ? { features: p.features as string[] }
        : {}),
    });
  }
}

async function extractSettingsScopeIfAvailable(
  ctx: import("../_generated/server").MutationCtx,
  section: CmsSection,
  scope: Scope,
  snapshot: unknown,
): Promise<void> {
  if (section !== "settings") return;
  if (!snapshot || typeof snapshot !== "object") return;

  const existing = await ctx.db
    .query("settingsContent")
    .withIndex("by_scope", (q) => q.eq("scope", scope))
    .unique();
  if (existing !== null) return;

  const s = snapshot as SettingsSnapshotShape;
  const title =
    s.metadata && typeof s.metadata.title === "string" ? s.metadata.title : undefined;
  const description =
    s.metadata && typeof s.metadata.description === "string"
      ? s.metadata.description
      : undefined;

  if (title === undefined && description === undefined) return;

  await ctx.db.insert("settingsContent", {
    scope,
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
  });
}
