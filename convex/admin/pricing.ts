/**
 * Admin pricing API (INF-83).
 *
 * Thin convenience wrappers around the shared CMS publish pipeline
 * (`convex/cms.ts`) that scope everything to the `pricing` section and expose
 * a packages-centric shape for the admin editor and debugging.
 *
 * These queries and mutations always target the `pricing` row, so callers do
 * not need to pass a `section` argument. All owner-gate / validation rules live
 * in the shared helpers so behavior stays consistent with `publishSite`.
 */
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { internalQuery, mutation, query } from "../_generated/server";
import { pricingPackageValidator, siteFlagsValidator } from "../schema.shared";
import {
  DEFAULT_PRICING_PACKAGES,
  PRICING_DEFAULTS,
  cmsSnapshotsEqual,
  type PricingPackage,
  type PricingSnapshot,
} from "../cmsShared";
import {
  collectPublishIssues,
  ensureSectionRow,
  publishSectionCore,
} from "../cmsPublishHelpers";
import { requireCmsOwner } from "../lib/auth";
import { cmsValidationError } from "../errors";
import { sanitizePricingPackages } from "../publicSettingsSnapshot";

type PricingListShape = {
  flags: PricingSnapshot["flags"];
  packages: PricingPackage[];
  hasDraftChanges: boolean;
  publishedAt: number | null;
  publishedBy: string | null;
  updatedAt: number | null;
  updatedBy: string | null;
};

function readPricingSnapshot(raw: unknown): PricingSnapshot {
  if (raw && typeof raw === "object" && "flags" in raw) {
    const snap = raw as Partial<PricingSnapshot>;
    const flags =
      snap.flags && typeof snap.flags.priceTabEnabled === "boolean"
        ? snap.flags
        : PRICING_DEFAULTS.flags;
    return {
      flags,
      packages: sanitizePricingPackages(
        (snap as { packages?: unknown }).packages,
      ),
    };
  }
  return PRICING_DEFAULTS;
}

function toListShape(
  row: Doc<"cmsSections"> | null,
  which: "draft" | "published",
): PricingListShape {
  if (!row) {
    return {
      flags: PRICING_DEFAULTS.flags,
      // Drafts get the default catalog as a starting point for the editor;
      // the public/published view stays empty until the owner publishes,
      // matching `publishedPricingFromRows`.
      packages:
        which === "draft" ? [...DEFAULT_PRICING_PACKAGES] : [],
      hasDraftChanges: false,
      publishedAt: null,
      publishedBy: null,
      updatedAt: null,
      updatedBy: null,
    };
  }
  const source =
    which === "draft" ? (row.draftSnapshot ?? row.publishedSnapshot) : row.publishedSnapshot;
  const snap = readPricingSnapshot(source);
  return {
    flags: snap.flags,
    packages: snap.packages ?? [],
    hasDraftChanges: row.hasDraftChanges,
    publishedAt: row.publishedAt,
    publishedBy: row.publishedBy ?? null,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy ?? null,
  };
}

/**
 * Draft-or-published snapshot for the admin editor. Requires owner auth so we
 * never leak draft packages to non-owners.
 */
export const listDraft = query({
  args: {},
  handler: async (ctx): Promise<PricingListShape> => {
    await requireCmsOwner(ctx);
    const row = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "pricing"))
      .unique();
    return toListShape(row, "draft");
  },
});

/**
 * Published-only snapshot for admin dashboards / diffing. Owner-gated so this
 * mirrors {@link listDraft} and can safely be used side-by-side in the UI.
 */
export const listPublished = query({
  args: {},
  handler: async (ctx): Promise<PricingListShape> => {
    await requireCmsOwner(ctx);
    const row = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "pricing"))
      .unique();
    return toListShape(row, "published");
  },
});

/**
 * Persist a new draft packages + flags payload for the `pricing` section.
 *
 * Accepts the full set of packages (create / edit / delete done client-side
 * by diffing this array). Server enforces id uniqueness and basic value
 * validation before writing so drafts never land in an unpublishable state.
 */
export const saveDraftPricing = mutation({
  args: {
    flags: siteFlagsValidator,
    packages: v.array(pricingPackageValidator),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsOwner(ctx);

    const seenIds = new Set<string>();
    for (const pkg of args.packages) {
      if (pkg.id.trim().length === 0) {
        cmsValidationError("Each pricing package requires an id.", "id");
      }
      if (seenIds.has(pkg.id)) {
        cmsValidationError(
          `Duplicate pricing package id: ${pkg.id}`,
          "id",
        );
      }
      seenIds.add(pkg.id);
      if (pkg.name.trim().length === 0) {
        cmsValidationError(
          "Pricing package display name is required.",
          "name",
        );
      }
      if (
        !Number.isFinite(pkg.priceCents) ||
        pkg.priceCents < 0 ||
        !Number.isInteger(pkg.priceCents)
      ) {
        cmsValidationError(
          "Pricing package price must be a non-negative whole-cent integer.",
          "priceCents",
        );
      }
      if (pkg.currency.trim().length === 0) {
        cmsValidationError(
          "Pricing package currency is required.",
          "currency",
        );
      }
    }

    const { id, row } = await ensureSectionRow(ctx, "pricing", updatedBy);

    const content: PricingSnapshot = {
      flags: args.flags,
      packages: args.packages,
    };

    const hasDraftChanges = !cmsSnapshotsEqual(content, row.publishedSnapshot);
    const now = Date.now();

    await ctx.db.patch(id, {
      draftSnapshot: content,
      hasDraftChanges,
      updatedAt: now,
      updatedBy,
    });

    return { ok: true as const, section: "pricing" as const, hasDraftChanges };
  },
});

/**
 * Promote the pricing draft to published (same transactional semantics as
 * `api.cms.publishSection({ section: "pricing" })`). Kept here so the pricing
 * editor can call a single, pricing-specific action.
 */
export const publishPricing = mutation({
  args: {},
  handler: async (ctx) => {
    const { identity, userId, updatedBy } = await requireCmsOwner(ctx);
    void identity;
    const { id, row } = await ensureSectionRow(ctx, "pricing", updatedBy);
    return await publishSectionCore(ctx, {
      section: "pricing",
      id,
      row,
      publishedByUserId: userId,
      updatedByTokenId: updatedBy,
    });
  },
});

/**
 * Read-only preflight: check the current pricing draft (or published if no
 * draft) against the publish validator and return any issues.
 */
export const validatePricing = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);
    const row = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "pricing"))
      .unique();

    const snapshot =
      row?.draftSnapshot ?? row?.publishedSnapshot ?? PRICING_DEFAULTS;
    const issues = collectPublishIssues("pricing", snapshot);
    return {
      ok: issues.length === 0,
      section: "pricing" as const,
      issues,
    };
  },
});

/**
 * Internal snapshot dump for owner debugging. Mirrors
 * `internal.admin.siteSettings.debugSnapshot`.
 */
export const debugSnapshot = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "pricing"))
      .unique();
  },
});
