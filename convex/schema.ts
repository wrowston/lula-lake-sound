import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  cmsSectionValidator,
  settingsContentValidator,
} from "./schema.shared";

/**
 * CMS sections use **one row per section** (approach B):
 * - `publishedSnapshot` + `publishedAt` — what public readers see (atomic updates on publish).
 * - `draftSnapshot` — working copy for admins; optional until first edit.
 * - `hasDraftChanges` — true when draft differs from published (cleared on publish / discard).
 *
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
   * @deprecated Pre–INF-70 singleton. Run `internal.migrations.migrateSiteSettingsToCmsSections`
   * once, then remove this table from the schema in a follow-up deploy after the row is gone.
   */
  siteSettings: defineTable({
    key: v.string(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
    published: settingsContentValidator,
    draft: v.optional(settingsContentValidator),
    /** Added for migration bookkeeping; absent on older rows. */
    publishedAt: v.optional(v.union(v.number(), v.null())),
  }).index("by_key", ["key"]),
  /**
   * Per-section CMS documents. `section` is the primary key for the singleton pattern
   * (e.g. one row with section === "settings").
   */
  cmsSections: defineTable({
    section: cmsSectionValidator,
    updatedAt: v.number(),
    /** Clerk user id (`subject`) when the last write was authenticated. */
    updatedBy: v.optional(v.string()),
    publishedSnapshot: settingsContentValidator,
    publishedAt: v.union(v.number(), v.null()),
    draftSnapshot: v.optional(settingsContentValidator),
    hasDraftChanges: v.boolean(),
  }).index("by_section", ["section"]),
});
