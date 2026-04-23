/**
 * Strips pre–marketingFeatureFlags fields still present on `cmsSections` rows so
 * documents match the current union shape (INF-48). Idempotent; safe to run repeatedly.
 */
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

function stripAboutPublished(snap: unknown): unknown {
  if (!snap || typeof snap !== "object" || !("published" in snap)) {
    return null;
  }
  const { published: _p, ...rest } = snap as Record<string, unknown>;
  return rest;
}

function stripPricingRecordingsFlag(snap: unknown): unknown {
  if (!snap || typeof snap !== "object" || !("flags" in snap)) {
    return null;
  }
  const s = snap as { flags: Record<string, unknown> };
  if (!s.flags || !("recordingsPageEnabled" in s.flags)) {
    return null;
  }
  const { recordingsPageEnabled: _r, ...restFlags } = s.flags;
  return { ...s, flags: restFlags };
}

export type StripLegacyCmsMarketingFieldsResult = {
  about: "patched" | "unchanged" | "no_row";
  pricing: "patched" | "unchanged" | "no_row";
};

/**
 * Removes `published` from about snapshots and `recordingsPageEnabled` from
 * pricing `flags`. Uses loose checks so it only runs when legacy keys are present.
 */
export async function stripLegacyCmsMarketingFieldsFromDb(
  ctx: MutationCtx,
): Promise<StripLegacyCmsMarketingFieldsResult> {
  let about: StripLegacyCmsMarketingFieldsResult["about"] = "no_row";
  let pricing: StripLegacyCmsMarketingFieldsResult["pricing"] = "no_row";

  const aboutRow = await ctx.db
    .query("cmsSections")
    .withIndex("by_section", (q) => q.eq("section", "about"))
    .unique();
  if (aboutRow) {
    about = "unchanged";
    const nextPub = stripAboutPublished(aboutRow.publishedSnapshot);
    const nextDraft = aboutRow.draftSnapshot
      ? stripAboutPublished(aboutRow.draftSnapshot)
      : null;
    const patch: Partial<Doc<"cmsSections">> = {};
    if (nextPub !== null) {
      patch.publishedSnapshot =
        nextPub as Doc<"cmsSections">["publishedSnapshot"];
    }
    if (nextDraft !== null) {
      patch.draftSnapshot = nextDraft as Doc<"cmsSections">["draftSnapshot"];
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(aboutRow._id, patch);
      about = "patched";
    }
  }

  const pricingRow = await ctx.db
    .query("cmsSections")
    .withIndex("by_section", (q) => q.eq("section", "pricing"))
    .unique();
  if (pricingRow) {
    pricing = "unchanged";
    const nextPub = stripPricingRecordingsFlag(pricingRow.publishedSnapshot);
    const nextDraft = pricingRow.draftSnapshot
      ? stripPricingRecordingsFlag(pricingRow.draftSnapshot)
      : null;
    const patch: Partial<Doc<"cmsSections">> = {};
    if (nextPub !== null) {
      patch.publishedSnapshot =
        nextPub as Doc<"cmsSections">["publishedSnapshot"];
    }
    if (nextDraft !== null) {
      patch.draftSnapshot = nextDraft as Doc<"cmsSections">["draftSnapshot"];
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(pricingRow._id, patch);
      pricing = "patched";
    }
  }

  return { about, pricing };
}
