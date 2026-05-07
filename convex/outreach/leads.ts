import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { insertOutreachAuditEntry } from "../lib/outreachAudit";
import {
  assertOutreachWorkspaceAccess,
  resolveOutreachWorkspace,
} from "../lib/outreachAuth";
import { outreachLeadStatusValidator } from "../schema.shared";

const LIST_LIMIT = 100;

export const listByStatus = query({
  args: {
    workspaceId: v.optional(v.string()),
    status: outreachLeadStatusValidator,
  },
  handler: async (ctx, args) => {
    const { workspaceId } = await resolveOutreachWorkspace(ctx, args.workspaceId);

    return await ctx.db
      .query("outreachLeads")
      .withIndex("by_workspaceId_and_status", (q) =>
        q.eq("workspaceId", workspaceId).eq("status", args.status),
      )
      .order("desc")
      .take(LIST_LIMIT);
  },
});

/** Recent leads created by the signed-in user within a workspace. */
export const listForCreator = query({
  args: {
    workspaceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity, workspaceId } = await resolveOutreachWorkspace(
      ctx,
      args.workspaceId,
    );

    return await ctx.db
      .query("outreachLeads")
      .withIndex("by_workspaceId_and_createdByTokenIdentifier", (q) =>
        q
          .eq("workspaceId", workspaceId)
          .eq("createdByTokenIdentifier", identity.tokenIdentifier),
      )
      .order("desc")
      .take(LIST_LIMIT);
  },
});

export const get = query({
  args: { leadId: v.id("outreachLeads") },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (lead === null) {
      return null;
    }
    await assertOutreachWorkspaceAccess(ctx, lead.workspaceId);
    return lead;
  },
});

export const create = mutation({
  args: {
    workspaceId: v.optional(v.string()),
    name: v.string(),
    company: v.optional(v.string()),
    links: v.array(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity, workspaceId } = await resolveOutreachWorkspace(
      ctx,
      args.workspaceId,
    );
    const now = Date.now();
    const leadId = await ctx.db.insert("outreachLeads", {
      workspaceId,
      name: args.name,
      company: args.company,
      links: args.links,
      email: args.email,
      phone: args.phone,
      source: args.source,
      status: "new",
      createdAt: now,
      updatedAt: now,
      createdByTokenIdentifier: identity.tokenIdentifier,
    });

    await insertOutreachAuditEntry(ctx, {
      workspaceId,
      actorTokenIdentifier: identity.tokenIdentifier,
      action: "lead.created",
      entityType: "outreachLead",
      entityId: leadId,
    });

    return leadId;
  },
});

export const updateStatus = mutation({
  args: {
    leadId: v.id("outreachLeads"),
    status: outreachLeadStatusValidator,
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (lead === null) {
      return null;
    }
    const identity = await assertOutreachWorkspaceAccess(ctx, lead.workspaceId);
    const workspaceId = lead.workspaceId;
    const now = Date.now();
    await ctx.db.patch(args.leadId, {
      status: args.status,
      updatedAt: now,
    });

    await insertOutreachAuditEntry(ctx, {
      workspaceId,
      actorTokenIdentifier: identity.tokenIdentifier,
      action: "lead.status_updated",
      entityType: "outreachLead",
      entityId: args.leadId,
      details: { status: args.status },
    });

    return args.leadId;
  },
});
