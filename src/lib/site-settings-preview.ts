import type { SiteSettings } from "@/lib/site-settings";

/**
 * Result of `api.siteSettingsPreviewDraft.getPreviewSiteSettings`.
 * Import this type only from preview routes/components so public bundles stay aligned
 * with `SiteSettings` + draft status.
 */
export type PreviewSiteSettings = SiteSettings & {
  hasDraftChanges: boolean;
};
