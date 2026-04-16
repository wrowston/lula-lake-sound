import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  cmsSectionValidator,
  cmsSnapshotValidator,
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
});
