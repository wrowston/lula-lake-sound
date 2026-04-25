import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  aboutContentRowValidator,
  aboutHighlightRowValidator,
  aboutTeamMemberRowValidator,
  cmsSectionValidator,
  gearScopeValidator,
  gearSpecsValidator,
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
    /** Uploaded album/track artwork stored in Convex file storage. */
    albumThumbnailStorageId: v.optional(v.id("_storage")),
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
    .index("by_albumThumbnailStorageId", ["albumThumbnailStorageId"])
    .index("by_scope_and_createdAt", ["scope", "createdAt"]),
});
