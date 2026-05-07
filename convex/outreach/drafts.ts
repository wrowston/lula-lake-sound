import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { insertOutreachAuditEntry } from "../lib/outreachAudit";
import {
  assertOutreachWorkspaceAccess,
  resolveOutreachWorkspace,
} from "../lib/outreachAuth";
import { outreachDraftBodyFormatValidator } from "../schema.shared";

const LIST_LIMIT = 50;

export const listForLead = query({
  args: {
    leadId: v.id("outreachLeads"),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (lead === null) {
      return [];
    }
    await assertOutreachWorkspaceAccess(ctx, lead.workspaceId);
    const workspaceId = lead.workspaceId;

    return await ctx.db
      .query("outreachDrafts")
      .withIndex("by_workspaceId_and_leadId", (q) =>
        q.eq("workspaceId", workspaceId).eq("leadId", args.leadId),
      )
      .order("desc")
      .take(LIST_LIMIT);
  },
});

export const create = mutation({
  args: {
    workspaceId: v.optional(v.string()),
    leadId: v.id("outreachLeads"),
    subject: v.string(),
    body: v.string(),
    bodyFormat: outreachDraftBodyFormatValidator,
    version: v.number(),
    agentRunRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity, workspaceId } = await resolveOutreachWorkspace(
      ctx,
      args.workspaceId,
    );

    const lead = await ctx.db.get(args.leadId);
    if (lead === null || lead.workspaceId !== workspaceId) {
      return null;
    }

    const now = Date.now();
    const draftId = await ctx.db.insert("outreachDrafts", {
      workspaceId,
      leadId: args.leadId,
      subject: args.subject,
      body: args.body,
      bodyFormat: args.bodyFormat,
      version: args.version,
      agentRunRef: args.agentRunRef,
      createdAt: now,
      updatedAt: now,
      createdByTokenIdentifier: identity.tokenIdentifier,
    });

    await insertOutreachAuditEntry(ctx, {
      workspaceId,
      actorTokenIdentifier: identity.tokenIdentifier,
      action: "draft.created",
      entityType: "outreachDraft",
      entityId: draftId,
      details: {
        leadId: args.leadId,
        version: String(args.version),
      },
    });

    return draftId;
  },
});
