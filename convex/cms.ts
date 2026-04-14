import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  cmsSectionValidator,
  settingsContentValidator,
} from "./schema.shared";
import type { Doc, Id } from "./_generated/dataModel";
import { SETTINGS_DEFAULTS, settingsSnapshotsEqual } from "./cmsShared";

async function requireCmsWriter(
  ctx: MutationCtx,
  adminSecret: string | undefined,
): Promise<{ updatedBy: string | undefined }> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity) {
    return { updatedBy: identity.tokenIdentifier };
  }
  const expected = process.env.CMS_ADMIN_SECRET;
  if (!expected || adminSecret !== expected) {
    throw new Error("Unauthorized");
  }
  return { updatedBy: "cms-admin-secret" };
}

async function getSectionRow(
  ctx: MutationCtx,
  section: Doc<"cmsSections">["section"],
): Promise<Doc<"cmsSections"> | null> {
  return await ctx.db
    .query("cmsSections")
    .withIndex("by_section", (q) => q.eq("section", section))
    .unique();
}

async function ensureSectionRow(
  ctx: MutationCtx,
  section: Doc<"cmsSections">["section"],
  updatedBy: string | undefined,
): Promise<{ row: Doc<"cmsSections">; id: Id<"cmsSections"> }> {
  const existing = await getSectionRow(ctx, section);
  const now = Date.now();

  if (existing) {
    return { row: existing, id: existing._id };
  }

  if (section !== "settings") {
    throw new Error(`Unknown CMS section: ${section}`);
  }

  const id = await ctx.db.insert("cmsSections", {
    section: "settings",
    updatedAt: now,
    updatedBy,
    publishedSnapshot: SETTINGS_DEFAULTS,
    publishedAt: now,
    hasDraftChanges: false,
  });
  const row = await ctx.db.get("cmsSections", id);
  if (!row) {
    throw new Error("Failed to load cmsSections row after insert");
  }
  return { row, id };
}

/**
 * Persist a working copy for a section. Does not change what public readers see.
 * First save on a new environment creates the singleton row (same defaults as seed).
 */
export const saveDraft = mutation({
  args: {
    section: cmsSectionValidator,
    content: settingsContentValidator,
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsWriter(ctx, args.adminSecret);
    const { id, row } = await ensureSectionRow(
      ctx,
      args.section,
      updatedBy,
    );
    const now = Date.now();

    const hasDraftChanges = !settingsSnapshotsEqual(
      args.content,
      row.publishedSnapshot,
    );

    await ctx.db.patch(id, {
      draftSnapshot: args.content,
      hasDraftChanges,
      updatedAt: now,
      updatedBy,
    });

    return { ok: true as const, section: args.section, hasDraftChanges };
  },
});

/**
 * Atomically promotes the current draft to published in one transaction, then clears
 * `draftSnapshot` so a second publish without `saveDraft` fails fast.
 * Public readers always see the previous published snapshot until this commit completes.
 */
export const publishSection = mutation({
  args: {
    section: cmsSectionValidator,
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsWriter(ctx, args.adminSecret);
    const { id, row } = await ensureSectionRow(
      ctx,
      args.section,
      updatedBy,
    );
    const draft = row.draftSnapshot;
    if (!draft) {
      throw new Error(
        "No draft to publish: call saveDraft first or discardDraft is not needed.",
      );
    }

    const now = Date.now();

    await ctx.db.patch(id, {
      publishedSnapshot: draft,
      publishedAt: now,
      draftSnapshot: undefined,
      hasDraftChanges: false,
      updatedAt: now,
      updatedBy,
    });

    return { ok: true as const, section: args.section, publishedAt: now };
  },
});

/**
 * Drops unpublished edits and aligns the working copy with what is live.
 * Stub behavior: clears optional draft fields; no-op if there was no draft.
 */
export const discardDraft = mutation({
  args: {
    section: cmsSectionValidator,
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { updatedBy } = await requireCmsWriter(ctx, args.adminSecret);
    const row = await getSectionRow(ctx, args.section);
    if (!row) {
      return { ok: true as const, section: args.section, discarded: false };
    }

    if (!row.draftSnapshot && !row.hasDraftChanges) {
      return { ok: true as const, section: args.section, discarded: false };
    }

    const now = Date.now();

    await ctx.db.replace("cmsSections", row._id, {
      section: row.section,
      publishedSnapshot: row.publishedSnapshot,
      publishedAt: row.publishedAt,
      updatedAt: now,
      updatedBy,
      hasDraftChanges: false,
    });

    return { ok: true as const, section: args.section, discarded: true };
  },
});
