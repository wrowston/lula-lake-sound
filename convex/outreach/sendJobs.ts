import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { insertOutreachAuditEntry } from "../lib/outreachAudit";
import {
  assertOutreachWorkspaceAccess,
  resolveOutreachWorkspace,
} from "../lib/outreachAuth";
import {
  outreachSendJobStatusValidator,
  outreachSendRecipientStatusValidator,
} from "../schema.shared";

const MAX_LEADS_PER_JOB = 200;
const RECIPIENT_LIST_LIMIT = 500;

export const createWithRecipients = mutation({
  args: {
    workspaceId: v.optional(v.string()),
    leadIds: v.array(v.id("outreachLeads")),
  },
  handler: async (ctx, args) => {
    const { identity, workspaceId } = await resolveOutreachWorkspace(
      ctx,
      args.workspaceId,
    );

    if (args.leadIds.length === 0) {
      return null;
    }
    const uniqueLeadIds = [...new Set(args.leadIds)];
    if (uniqueLeadIds.length > MAX_LEADS_PER_JOB) {
      return null;
    }

    const validLeadIds = [];
    for (const leadId of uniqueLeadIds) {
      const lead = await ctx.db.get(leadId);
      if (lead !== null && lead.workspaceId === workspaceId) {
        validLeadIds.push(leadId);
      }
    }
    if (validLeadIds.length === 0) {
      return null;
    }

    const now = Date.now();
    const sendJobId = await ctx.db.insert("outreachSendJobs", {
      workspaceId,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      createdByTokenIdentifier: identity.tokenIdentifier,
    });

    for (const leadId of validLeadIds) {
      await ctx.db.insert("outreachSendRecipients", {
        workspaceId,
        sendJobId,
        leadId,
        status: "pending",
        updatedAt: now,
      });
    }

    await insertOutreachAuditEntry(ctx, {
      workspaceId,
      actorTokenIdentifier: identity.tokenIdentifier,
      action: "send_job.created",
      entityType: "outreachSendJob",
      entityId: sendJobId,
      details: { leadCount: String(validLeadIds.length) },
    });

    return sendJobId;
  },
});

export const listRecipientsForJob = query({
  args: {
    sendJobId: v.id("outreachSendJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.sendJobId);
    if (job === null) {
      return [];
    }
    await assertOutreachWorkspaceAccess(ctx, job.workspaceId);
    const workspaceId = job.workspaceId;

    return await ctx.db
      .query("outreachSendRecipients")
      .withIndex("by_workspaceId_and_sendJobId", (q) =>
        q.eq("workspaceId", workspaceId).eq("sendJobId", args.sendJobId),
      )
      .take(RECIPIENT_LIST_LIMIT);
  },
});

export const updateJobStatus = mutation({
  args: {
    sendJobId: v.id("outreachSendJobs"),
    status: outreachSendJobStatusValidator,
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.sendJobId);
    if (job === null) {
      return null;
    }
    const identity = await assertOutreachWorkspaceAccess(ctx, job.workspaceId);
    const workspaceId = job.workspaceId;
    const now = Date.now();
    await ctx.db.patch(args.sendJobId, {
      status: args.status,
      updatedAt: now,
    });

    await insertOutreachAuditEntry(ctx, {
      workspaceId,
      actorTokenIdentifier: identity.tokenIdentifier,
      action: "send_job.status_updated",
      entityType: "outreachSendJob",
      entityId: args.sendJobId,
      details: { status: args.status },
    });

    return args.sendJobId;
  },
});

export const updateRecipientOutcome = mutation({
  args: {
    sendJobId: v.id("outreachSendJobs"),
    leadId: v.id("outreachLeads"),
    status: outreachSendRecipientStatusValidator,
    resendMessageId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.sendJobId);
    if (job === null) {
      return null;
    }
    const identity = await assertOutreachWorkspaceAccess(ctx, job.workspaceId);
    const workspaceId = job.workspaceId;

    const recipient = await ctx.db
      .query("outreachSendRecipients")
      .withIndex("by_workspaceId_and_sendJobId_and_leadId", (q) =>
        q
          .eq("workspaceId", workspaceId)
          .eq("sendJobId", args.sendJobId)
          .eq("leadId", args.leadId),
      )
      .first();

    if (recipient === null) {
      return null;
    }

    const now = Date.now();
    await ctx.db.patch(recipient._id, {
      status: args.status,
      updatedAt: now,
      ...(args.resendMessageId !== undefined
        ? { resendMessageId: args.resendMessageId }
        : {}),
      ...(args.error !== undefined ? { error: args.error } : {}),
    });

    await insertOutreachAuditEntry(ctx, {
      workspaceId,
      actorTokenIdentifier: identity.tokenIdentifier,
      action: "send_recipient.updated",
      entityType: "outreachSendRecipient",
      entityId: recipient._id,
      details: {
        sendJobId: args.sendJobId,
        leadId: args.leadId,
        status: args.status,
      },
    });

    return recipient._id;
  },
});
