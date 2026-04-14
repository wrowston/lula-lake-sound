import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const siteFlagsValidator = v.object({
  priceTabEnabled: v.boolean(),
});

const siteMetadataValidator = v.object({
  /** Shared site copy / SEO-style fields; extend as CMS grows. */
  title: v.optional(v.string()),
  description: v.optional(v.string()),
});

const publishedSliceValidator = v.object({
  flags: siteFlagsValidator,
  metadata: v.optional(siteMetadataValidator),
});

const draftSliceValidator = v.object({
  flags: siteFlagsValidator,
  metadata: v.optional(siteMetadataValidator),
});

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
   * Site-wide CMS settings and feature flags (singleton row per `key`).
   * `published` is what public clients read; `draft` is optional until the full draft/publish flow exists.
   */
  siteSettings: defineTable({
    key: v.string(),
    updatedAt: v.number(),
    /** Clerk user id (`subject`) when the last write was authenticated. */
    updatedBy: v.optional(v.string()),
    published: publishedSliceValidator,
    draft: v.optional(draftSliceValidator),
  }).index("by_key", ["key"]),
});
