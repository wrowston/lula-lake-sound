import { query } from "../_generated/server";
import { requireCmsOwner } from "../lib/auth";

const ADMIN_INQUIRIES_LIST_LIMIT = 100;

/**
 * Recent contact form submissions for the CMS (read-only).
 * Gated to the same identities as other admin mutations (`requireCmsOwner`).
 */
export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsOwner(ctx);

    const rows = await ctx.db
      .query("inquiries")
      .withIndex("by_createdAt")
      .order("desc")
      .take(ADMIN_INQUIRIES_LIST_LIMIT);

    return rows.map((row) => ({
      _id: row._id,
      artistName: row.artistName,
      contactName: row.contactName,
      email: row.email,
      phone: row.phone,
      message: row.message,
      createdAt: row.createdAt,
    }));
  },
});
