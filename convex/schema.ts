import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  cmsSectionValidator,
  cmsSnapshotValidator,
  gearScopeValidator,
  gearSpecsValidator,
  marketingFeatureFlagsSnapshotValidator,
} from "./schema.shared";

// Draft/publish model: see docs/cms-publish.md (INF-70).

/**
 * CMS sections use **one row per section** (approach B):
 * - `publishedSnapshot` + `publishedAt` + optional `publishedBy` (Clerk user id) — what public readers see (atomic updates on publish).
 * - `draftSnapshot` — working copy for admins; optional until first edit.
 * - `hasDraftChanges` — true when draft differs from published (cleared on publish / discard).
 *
 * Snapshots are a union across sections; consumers must narrow via the row's `section` field.
 * First-time publish: `publishedSnapshot` may be a seeded default; saving draft populates
 * `draftSnapshot`; publish copies `draftSnapshot` → `publishedSnapshot` in one `patch`.
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
  /**
   * Per-section CMS documents. `section` is the primary key for the singleton pattern
   * (one row per section literal, e.g. `settings`, `pricing`).
   */
  cmsSections: defineTable({
    section: cmsSectionValidator,
    updatedAt: v.number(),
    /** Clerk user id (`subject`) when the last write was authenticated. */
    updatedBy: v.optional(v.string()),
    publishedSnapshot: cmsSnapshotValidator,
    publishedAt: v.union(v.number(), v.null()),
    /** Clerk user id (`subject`) who last published this section. */
    publishedBy: v.optional(v.string()),
    draftSnapshot: v.optional(cmsSnapshotValidator),
    hasDraftChanges: v.boolean(),
  }).index("by_section", ["section"]),

  /**
   * Marketing site visibility: About page, Recordings page, homepage pricing block.
   * Draft/publish matches `cmsSections` semantics; singleton row only.
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

  /**
   * Studio gear CMS (INF-86): separate rows per scope so we can index by category
   * and sort. Publish replaces all `published` rows in one transaction; discard
   * copies `published` → `draft` after clearing draft.
   */
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
