import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  cmsSectionValidator,
  cmsSnapshotValidator,
  gearScopeValidator,
  gearSpecsValidator,
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

  /**
   * Audio portfolio (INF-95): same draft/publish row model as gallery photos.
   * Public playback uses `ctx.storage.getUrl` (time-limited HTTPS URL) in `<audio src>`.
   */
  audioTrackMeta: defineTable({
    singletonKey: v.literal("default"),
    hasDraftChanges: v.boolean(),
    publishedAt: v.union(v.number(), v.null()),
    publishedBy: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_singleton", ["singletonKey"]),

  audioTracks: defineTable({
    scope: gearScopeValidator,
    stableId: v.string(),
    storageId: v.id("_storage"),
    title: v.string(),
    artist: v.optional(v.string()),
    description: v.string(),
    mimeType: v.string(),
    durationSec: v.optional(v.number()),
    /** HTTPS URL to album/track artwork (e.g. CDN). */
    albumThumbnailUrl: v.optional(v.string()),
    /** Public Spotify page for this release or track. */
    spotifyUrl: v.optional(v.string()),
    /** Public Apple Music page for this release or track. */
    appleMusicUrl: v.optional(v.string()),
    sortOrder: v.number(),
    sizeBytes: v.number(),
    originalFileName: v.optional(v.string()),
    /** Set when a row is created so abandoned uploads can be garbage-collected. */
    createdAt: v.number(),
  })
    .index("by_scope_and_sort", ["scope", "sortOrder"])
    .index("by_scope_and_stableId", ["scope", "stableId"])
    .index("by_storageId", ["storageId"])
    .index("by_scope_and_createdAt", ["scope", "createdAt"]),
});
