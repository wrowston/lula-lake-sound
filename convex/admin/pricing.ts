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
  type PricingPackage,
  type PricingSnapshot,
} from "../cmsShared";
import {
  collectPublishIssues,
  publishSectionCore,
} from "../cmsPublishHelpers";
import {
  effectiveIsEnabled,
  ensureSectionMetaRow,
  getSectionMetaRow,
  publishedIsEnabled,
  recomputeSectionHasDraftChanges,
} from "../cmsMeta";
import {
  loadPricingPackages,
  pricingPackageFromRow,
  replacePricingDraftFromPackages,
} from "../pricingTree";
import { requireCmsOwner } from "../lib/auth";
import { cmsValidationError } from "../errors";

type PricingListShape = {
  flags: PricingSnapshot["flags"];
  packages: PricingPackage[];
  hasDraftChanges: boolean;
  publishedAt: number | null;
  publishedBy: string | null;
  updatedAt: number | null;
  updatedBy: string | null;
};

async function toListShape(
  ctx: import("../_generated/server").QueryCtx,
  row: Doc<"cmsSections"> | null,
  which: "draft" | "published",
): Promise<PricingListShape> {
  if (!row) {
    return {
      flags: PRICING_DEFAULTS.flags,
      // Drafts get the default catalogue as a starting point for the editor;
      // the published view stays empty until the owner publishes.
      packages: which === "draft" ? [...DEFAULT_PRICING_PACKAGES] : [],
      hasDraftChanges: false,
      publishedAt: null,
      publishedBy: null,
      updatedAt: null,
      updatedBy: null,
    };
  }

  const draft =
    which === "draft" ? await loadPricingPackages(ctx, "draft") : [];
  const published = await loadPricingPackages(ctx, "published");
  const rows = which === "draft" && draft.length > 0 ? draft : published;

  const priceTabEnabled =
    which === "draft"
      ? effectiveIsEnabled(row, "pricing")
      : publishedIsEnabled(row, "pricing");

  return {
    flags: { priceTabEnabled },
    packages: rows.map(pricingPackageFromRow),
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
    const row = await getSectionMetaRow(ctx, "pricing");
    return await toListShape(ctx, row, "draft");
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
    const row = await getSectionMetaRow(ctx, "pricing");
    return await toListShape(ctx, row, "published");
  },
});

/**
 * Persist a new draft packages payload for the `pricing` section.
 *
 * Accepts the full set of packages (create / edit / delete done client-side
 * by diffing this array). Server enforces id uniqueness and basic value
 * validation before writing so drafts never land in an unpublishable state.
 *
 * The `flags` arg is accepted for back-compat with existing callers but no
 * longer persisted — pricing visibility lives on `cmsSections.pricing.isEnabled`
 * and is toggled via `api.cms.saveSectionIsEnabledDraft`.
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
        cmsValidationError(`Duplicate pricing package id: ${pkg.id}`, "id");
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

    await ensureSectionMetaRow(ctx, "pricing", updatedBy);
    await replacePricingDraftFromPackages(ctx, args.packages);
    await recomputeSectionHasDraftChanges(ctx, "pricing", updatedBy);

    const row = await getSectionMetaRow(ctx, "pricing");
    return {
      ok: true as const,
      section: "pricing" as const,
      hasDraftChanges: row?.hasDraftChanges ?? false,
    };
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
    const { userId, updatedBy } = await requireCmsOwner(ctx);
    const { id, row } = await ensureSectionMetaRow(ctx, "pricing", updatedBy);
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
    const issues = await collectPublishIssues(ctx, "pricing");
    return {
      ok: issues.length === 0,
      section: "pricing" as const,
      issues,
    };
  },
});

/**
 * Internal snapshot dump for owner debugging. Returns the metadata row and
 * both scopes of the pricing catalogue.
 */
export const debugSnapshot = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [row, draft, published] = await Promise.all([
      getSectionMetaRow(ctx, "pricing"),
      loadPricingPackages(ctx, "draft"),
      loadPricingPackages(ctx, "published"),
    ]);
    return {
      row,
      draft,
      published,
    };
  },
});
