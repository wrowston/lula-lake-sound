import { internalMutation } from "./_generated/server";

const defaultPublished = {
  flags: { priceTabEnabled: true },
  metadata: {
    title: "Lula Lake Sound",
    description: "Studio and lake-house sessions.",
  },
} as const;

/**
 * Idempotent seed for local dev: creates the singleton `cmsSections` settings row if missing.
 *
 * Run once after deploying schema:
 * `bunx convex run internal.seed.seedSiteSettingsDefaults` (or from dashboard → Functions → internal).
 */
export const seedSiteSettingsDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("cmsSections")
      .withIndex("by_section", (q) => q.eq("section", "settings"))
      .unique();

    const now = Date.now();

    if (existing) {
      return { status: "already_seeded" as const, id: existing._id };
    }

    const id = await ctx.db.insert("cmsSections", {
      section: "settings",
      updatedAt: now,
      publishedSnapshot: defaultPublished,
      publishedAt: now,
      hasDraftChanges: false,
    });

    return { status: "inserted" as const, id };
  },
});
