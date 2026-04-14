import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  cmsSectionValidator,
  settingsContentValidator,
} from "./schema.shared";
import type { Doc, Id } from "./_generated/dataModel";

const SETTINGS_DEFAULTS: Doc<"cmsSections">["publishedSnapshot"] = {
  flags: { priceTabEnabled: true },
  metadata: {
    title: "Lula Lake Sound",
    description: "Studio and lake-house sessions.",
  },
};

function snapshotsEqual(
  a: Doc<"cmsSections">["publishedSnapshot"],
  b: Doc<"cmsSections">["publishedSnapshot"],
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
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
): Promise<{ row: Doc<"cmsSections">; id: Id<"cmsSections"> }> {
  const existing = await getSectionRow(ctx, section);
  const now = Date.now();
  const identity = await ctx.auth.getUserIdentity();
  const updatedBy = identity?.tokenIdentifier;

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
  },
  handler: async (ctx, args) => {
    const { id, row } = await ensureSectionRow(ctx, args.section);
    const now = Date.now();
    const identity = await ctx.auth.getUserIdentity();
    const updatedBy = identity?.tokenIdentifier;

    const hasDraftChanges = !snapshotsEqual(
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
 * Atomically replaces the published snapshot from the current draft in one transaction.
 * Public readers always see the previous published snapshot until this commit completes.
 */
export const publishSection = mutation({
  args: { section: cmsSectionValidator },
  handler: async (ctx, args) => {
    const { id, row } = await ensureSectionRow(ctx, args.section);
    const draft = row.draftSnapshot;
    if (!draft) {
      throw new Error(
        "No draft to publish: call saveDraft first or discardDraft is not needed.",
      );
    }

    const now = Date.now();
    const identity = await ctx.auth.getUserIdentity();
    const updatedBy = identity?.tokenIdentifier;

    await ctx.db.patch(id, {
      publishedSnapshot: draft,
      publishedAt: now,
      draftSnapshot: draft,
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
  args: { section: cmsSectionValidator },
  handler: async (ctx, args) => {
    const row = await getSectionRow(ctx, args.section);
    if (!row) {
      return { ok: true as const, section: args.section, discarded: false };
    }

    if (!row.draftSnapshot && !row.hasDraftChanges) {
      return { ok: true as const, section: args.section, discarded: false };
    }

    const now = Date.now();
    const identity = await ctx.auth.getUserIdentity();
    const updatedBy = identity?.tokenIdentifier;

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
