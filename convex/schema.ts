import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  aboutContentRowValidator,
  aboutHighlightRowValidator,
  aboutTeamMemberRowValidator,
  cmsSectionValidator,
  cmsSnapshotValidator,
  gearScopeValidator,
  gearSpecsValidator,
  marketingFeatureFlagsSnapshotValidator,
  pricingPackageRowValidator,
  settingsContentRowValidator,
} from "./schema.shared";

/**
 * CMS sections (one row per section):
 *
 * - `cmsSections` is a **metadata-only** table: publish bookkeeping
 *   (`hasDraftChanges`, `publishedAt`, `publishedBy`, timestamps) plus the
 *   section's visibility flag (`isEnabled` with optional `isEnabledDraft`).
 * - Section content lives in dedicated scoped tables
 *   (`aboutContent` / `aboutHighlights` / `aboutTeamMembers`,
 *   `pricingPackages`, `settingsContent`) using the same `scope: "draft" | "published"`
 *   pattern as `gearCategories` / `galleryPhotos`. Publish copies the draft
 *   scope onto the published scope in a single mutation.
 * - The `recordings` section is flag-only (no content table); the public page
 *   reads copy from `src/app/recordings/recordings-data.ts`.
 *
 * `publishedSnapshot` / `draftSnapshot` columns remain **optional** on
 * `cmsSections` during the transition so pre-migration rows keep validating.
 * They are stripped by `migrations/extractSectionContent.ts`; a follow-up
 * deploy will remove the columns entirely.
 */
export default defineSchema({
  inquiries: defineTable({
    artistName: v.string(),
    contactName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.string(),
    createdAt: v.number(),
  }),

  cmsSections: defineTable({
    section: cmsSectionValidator,
    /** Published visibility. Controls route/section visibility on the public site. */
    isEnabled: v.optional(v.boolean()),
    /** Draft override for `isEnabled`; cleared on publish / discard. */
    isEnabledDraft: v.optional(v.boolean()),
    hasDraftChanges: v.boolean(),
    publishedAt: v.union(v.number(), v.null()),
    /** Clerk user id (`subject`) who last published this section. */
    publishedBy: v.optional(v.string()),
    updatedAt: v.number(),
    /** Clerk user id (`subject`) when the last write was authenticated. */
    updatedBy: v.optional(v.string()),
    /** @deprecated Pre-refactor JSON blob; stripped by the content migration. */
    publishedSnapshot: v.optional(cmsSnapshotValidator),
    /** @deprecated Pre-refactor JSON blob; stripped by the content migration. */
    draftSnapshot: v.optional(cmsSnapshotValidator),
  }).index("by_section", ["section"]),

  aboutContent: defineTable(aboutContentRowValidator).index("by_scope", [
    "scope",
  ]),

  aboutHighlights: defineTable(aboutHighlightRowValidator)
    .index("by_scope_and_sort", ["scope", "sort"])
    .index("by_scope_and_stableId", ["scope", "stableId"]),

  aboutTeamMembers: defineTable(aboutTeamMemberRowValidator)
    .index("by_scope_and_sort", ["scope", "sort"])
    .index("by_scope_and_stableId", ["scope", "stableId"]),

  pricingPackages: defineTable(pricingPackageRowValidator)
    .index("by_scope_and_sort", ["scope", "sortOrder"])
    .index("by_scope_and_stableId", ["scope", "stableId"]),

  settingsContent: defineTable(settingsContentRowValidator).index("by_scope", [
    "scope",
  ]),

  /**
   * @deprecated Marketing visibility now lives on `cmsSections.isEnabled` rows
   * per section. Kept in the schema so the existing singleton row still
   * validates until `migrations/extractSectionContent.ts` deletes it. A
   * follow-up deploy drops this table.
   */
  marketingFeatureFlags: defineTable({
    singletonKey: v.literal("default"),
    publishedSnapshot: marketingFeatureFlagsSnapshotValidator,
    draftSnapshot: v.optional(marketingFeatureFlagsSnapshotValidator),
    hasDraftChanges: v.boolean(),
    publishedAt: v.union(v.number(), v.null()),
    publishedBy: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_singleton", ["singletonKey"]),

  gearMeta: defineTable({
    singletonKey: v.literal("default"),
    hasDraftChanges: v.boolean(),
    publishedAt: v.union(v.number(), v.null()),
    publishedBy: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_singleton", ["singletonKey"]),

  gearCategories: defineTable({
    scope: gearScopeValidator,
    /** Client-generated stable id (not Convex `_id`). */
    stableId: v.string(),
    name: v.string(),
    sort: v.number(),
  })
    .index("by_scope_and_sort", ["scope", "sort"])
    .index("by_scope_and_stableId", ["scope", "stableId"]),

  gearItems: defineTable({
    scope: gearScopeValidator,
    stableId: v.string(),
    /** References `gearCategories.stableId` for the same scope. */
    categoryStableId: v.string(),
    name: v.string(),
    sort: v.number(),
    specs: gearSpecsValidator,
    url: v.optional(v.string()),
  })
    .index("by_scope", ["scope"])
    .index("by_scope_and_category_and_sort", [
      "scope",
      "categoryStableId",
      "sort",
    ])
    .index("by_scope_and_stableId", ["scope", "stableId"]),

  galleryPhotoMeta: defineTable({
    singletonKey: v.literal("default"),
    hasDraftChanges: v.boolean(),
    publishedAt: v.union(v.number(), v.null()),
    publishedBy: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_singleton", ["singletonKey"]),

  galleryPhotos: defineTable({
    scope: gearScopeValidator,
    stableId: v.string(),
    storageId: v.id("_storage"),
    alt: v.string(),
    caption: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    sortOrder: v.number(),
    contentType: v.string(),
    sizeBytes: v.number(),
    originalFileName: v.optional(v.string()),
  })
    .index("by_scope_and_sort", ["scope", "sortOrder"])
    .index("by_scope_and_stableId", ["scope", "stableId"])
    .index("by_storageId", ["storageId"]),
});
