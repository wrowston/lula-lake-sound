import { internalMutation } from "../_generated/server";
import { stripLegacyCmsMarketingFieldsFromDb } from "../lib/legacyCmsFieldStrip";

/**
 * One-time / maintenance: remove legacy `about.published` and
 * `pricing.flags.recordingsPageEnabled` from `cmsSections` documents so stored
 * snapshots only carry current fields (visibility lives in `marketingFeatureFlags`).
 *
 * Idempotent. Safe to run after every deploy.
 *
 * ```bash
 * bunx convex run migrations/stripLegacyCmsMarketingFields:stripLegacyCmsMarketingFields
 * ```
 */
export const stripLegacyCmsMarketingFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await stripLegacyCmsMarketingFieldsFromDb(ctx);
  },
});
