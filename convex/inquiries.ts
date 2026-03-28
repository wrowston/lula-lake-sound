import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    artistName: v.string(),
    contactName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("inquiries", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
