/**
 * Marketing site visibility: About page, Recordings page, homepage pricing block.
 * Singleton `marketingFeatureFlags` table; draft/publish matches cmsSections.
 */
import { v } from "convex/values";
import {
  internalMutation,
  type MutationCtx,
  type QueryCtx,
  mutation,
  query,
} from "./_generated/server";
import { marketingFeatureFlagsSnapshotValidator } from "./schema.shared";
import {
  MARKETING_FEATURE_FLAGS_DEFAULTS,
  type MarketingFeatureFlagsSnapshot,
} from "./cmsShared";
import { requireCmsOwner } from "./lib/auth";
import { stripLegacyCmsMarketingFieldsFromDb } from "./lib/legacyCmsFieldStrip";
import type { Doc, Id } from "./_generated/dataModel";
import { collectMarketingFeatureFlagsPublishIssues } from "./cmsPublishHelpers";
import { cmsPublishValidationFailed } from "./errors";
import { publishedPricingFromRows } from "./publicSettingsSnapshot";

const SINGLETON = "default" as const;

function flagsEqual(
  a: MarketingFeatureFlagsSnapshot,
  b: MarketingFeatureFlagsSnapshot,
): boolean {
  return (
    a.aboutPage === b.aboutPage &&
    a.recordingsPage === b.recordingsPage &&
    a.pricingSection === b.pricingSection
  );
}

/** Safe published read; tolerates partial stored rows. */
export function publishedMarketingFeatureFlagsFromRow(
  row: Doc<"marketingFeatureFlags"> | null,
): MarketingFeatureFlagsSnapshot {
  if (!row) {
    return { ...MARKETING_FEATURE_FLAGS_DEFAULTS };
  }
  const s = row.publishedSnapshot;
  if (!s || typeof s !== "object") {
    return { ...MARKETING_FEATURE_FLAGS_DEFAULTS };
  }
  return normalizeFlags(s as MarketingFeatureFlagsSnapshot);
}

/**
 * Coerce any snapshot-shaped value to a full flag object. Matches
 * `publishedMarketingFeatureFlagsFromRow` so preview/draft reads behave like
 * the public query when older rows omit `pricingSection` (treat as default on).
 */
function normalizeFlags(
  raw: MarketingFeatureFlagsSnapshot | Record<string, unknown>,
): MarketingFeatureFlagsSnapshot {
  return {
    aboutPage: typeof raw.aboutPage === "boolean" ? raw.aboutPage : false,
    recordingsPage:
      typeof raw.recordingsPage === "boolean" ? raw.recordingsPage : false,
    pricingSection:
      typeof raw.pricingSection === "boolean" ? raw.pricingSection : true,
  };
}

export async function getMarketingFeatureFlagsRow(
  ctx: QueryCtx,
): Promise<Doc<"marketingFeatureFlags"> | null> {
  return await ctx.db
    .query("marketingFeatureFlags")
    .withIndex("by_singleton", (q) => q.eq("singletonKey", SINGLETON))
    .unique();
}

export const getPublishedMarketingFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    const row = await getMarketingFeatureFlagsRow(ctx);
    return publishedMarketingFeatureFlagsFromRow(row);
  },
});

/**
 * Owner-only draft for the marketing feature flags singleton (same shape as preview).
 */
export const listDraft = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    const row = await getMarketingFeatureFlagsRow(ctx);
    if (!row) {
      const base = { ...MARKETING_FEATURE_FLAGS_DEFAULTS };
      return {
        flags: base,
        hasDraftChanges: false,
        publishedAt: null as number | null,
        publishedBy: null as string | null,
        updatedAt: null as number | null,
        updatedBy: null as string | null,
      };
    }
    const effective =
      row.draftSnapshot ?? row.publishedSnapshot ?? MARKETING_FEATURE_FLAGS_DEFAULTS;
    const normalized = normalizeFlags(effective);
    return {
      flags: normalized,
      hasDraftChanges: row.hasDraftChanges,
      publishedAt: row.publishedAt,
      publishedBy: row.publishedBy ?? null,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy ?? null,
    };
  },
});

export const getPreviewMarketingFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    try {
      await requireCmsOwner(ctx);
    } catch {
      return null;
    }
    const row = await getMarketingFeatureFlagsRow(ctx);
    if (!row) {
      const base = { ...MARKETING_FEATURE_FLAGS_DEFAULTS };
      return {
        ...base,
        hasDraftChanges: false,
      };
    }
    const effective =
      row.draftSnapshot ?? row.publishedSnapshot ?? MARKETING_FEATURE_FLAGS_DEFAULTS;
    const normalized = normalizeFlags(effective);
    return {
      ...normalized,
      hasDraftChanges: row.hasDraftChanges,
    };
  },
});

export const saveMarketingFeatureFlagsDraft = mutation({
  args: { snapshot: marketingFeatureFlagsSnapshotValidator },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const id = await ensureMarketingFeatureFlagsRowId(ctx, updatedBy);
    const row = (await ctx.db.get(id))!;
    const content = normalizeFlags(args.snapshot);
    const hasDraftChanges = !flagsEqual(content, row.publishedSnapshot);
    const now = Date.now();
    await ctx.db.patch(id, {
      draftSnapshot: content,
      hasDraftChanges,
      updatedAt: now,
      updatedBy,
    });
    return { ok: true as const, hasDraftChanges };
  },
});

export async function publishMarketingFeatureFlagsCore(
  ctx: MutationCtx,
  args: { userId: string; updatedBy: string | undefined },
): Promise<
  { kind: "nothing_to_publish" } | { kind: "published"; publishedAt: number }
> {
  const id = await ensureMarketingFeatureFlagsRowId(ctx, args.updatedBy);
  const row = (await ctx.db.get(id))!;
  const draft = row.draftSnapshot;
  if (!draft || !row.hasDraftChanges) {
    return { kind: "nothing_to_publish" };
  }
  const issues = collectMarketingFeatureFlagsPublishIssues(draft);
  if (issues.length > 0) {
    cmsPublishValidationFailed(
      "marketingFeatureFlags",
      "Marketing feature flags failed publish validation.",
      issues,
    );
  }
  const now = Date.now();
  await ctx.db.patch(id, {
    publishedSnapshot: draft,
    publishedAt: now,
    publishedBy: args.userId,
    draftSnapshot: undefined,
    hasDraftChanges: false,
    updatedAt: now,
    updatedBy: args.updatedBy,
  });
  return { kind: "published", publishedAt: now };
}

export const publishMarketingFeatureFlags = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId, updatedBy } = await requireCmsOwner(ctx);
    const out = await publishMarketingFeatureFlagsCore(ctx, { userId, updatedBy });
    if (out.kind === "nothing_to_publish") {
      return { ok: true as const, kind: "nothing_to_publish" as const };
    }
    return {
      ok: true as const,
      kind: "published" as const,
      publishedAt: out.publishedAt,
    };
  },
});

export const discardMarketingFeatureFlagsDraft = mutation({
  args: {},
  handler: async (ctx) => {
    const { updatedBy } = await requireCmsOwner(ctx);
    const row = await getMarketingFeatureFlagsRow(ctx);
    if (!row) {
      return { ok: true as const, discarded: false };
    }
    if (!row.draftSnapshot || !row.hasDraftChanges) {
      return { ok: true as const, discarded: false };
    }
    const now = Date.now();
    await ctx.db.patch(row._id, {
      draftSnapshot: undefined,
      hasDraftChanges: false,
      updatedAt: now,
      updatedBy,
    });
    return { ok: true as const, discarded: true };
  },
});

async function ensureMarketingFeatureFlagsRowId(
  ctx: MutationCtx,
  updatedBy: string | undefined,
): Promise<Id<"marketingFeatureFlags">> {
  const existing = await getMarketingFeatureFlagsRow(ctx);
  if (existing) {
    return existing._id;
  }
  const now = Date.now();
  return await ctx.db.insert("marketingFeatureFlags", {
    singletonKey: SINGLETON,
    publishedSnapshot: { ...MARKETING_FEATURE_FLAGS_DEFAULTS },
    hasDraftChanges: false,
    publishedAt: now,
    updatedAt: now,
    updatedBy,
  });
}

/**
 * Internal: ensure row exists and backfill from legacy `about.published` and
 * `pricing.flags` on first run after deploy. Shared with `seed:seedSiteSettingsDefaults`.
 */
export async function ensureMarketingFeatureFlagsSeededHandler(
  ctx: MutationCtx,
): Promise<
  | { status: "already_seeded"; id: Id<"marketingFeatureFlags"> }
  | { status: "inserted"; id: Id<"marketingFeatureFlags"> }
> {
  const now = Date.now();
  const existing = await getMarketingFeatureFlagsRow(ctx);
  if (existing) {
    await stripLegacyCmsMarketingFieldsFromDb(ctx);
    return { status: "already_seeded" as const, id: existing._id };
  }
  const [aboutRow, pricingRow, settingsRow] = await Promise.all([
    ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "about"))
      .unique(),
    ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "pricing"))
      .unique(),
    ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "settings"))
      .unique(),
  ]);
  const aboutSnap = aboutRow?.publishedSnapshot as
    | { published?: boolean }
    | undefined;
  const legacyAboutPublished =
    aboutSnap && typeof aboutSnap.published === "boolean"
      ? aboutSnap.published
      : false;
  const pricing = publishedPricingFromRows(pricingRow, settingsRow);
  const rawPricing = pricingRow?.publishedSnapshot as
    | { flags?: { recordingsPageEnabled?: boolean } }
    | undefined;
  const rec =
    rawPricing?.flags &&
    typeof rawPricing.flags.recordingsPageEnabled === "boolean"
      ? rawPricing.flags.recordingsPageEnabled
      : false;
  const snapshot: MarketingFeatureFlagsSnapshot = {
    aboutPage: legacyAboutPublished,
    recordingsPage: rec,
    pricingSection: pricing.flags.priceTabEnabled,
  };
  const id = await ctx.db.insert("marketingFeatureFlags", {
    singletonKey: SINGLETON,
    publishedSnapshot: snapshot,
    hasDraftChanges: false,
    publishedAt: now,
    updatedAt: now,
  });
  await stripLegacyCmsMarketingFieldsFromDb(ctx);
  return { status: "inserted" as const, id };
}

export const ensureMarketingFeatureFlagsSeeded = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ensureMarketingFeatureFlagsSeededHandler(ctx);
  },
});
