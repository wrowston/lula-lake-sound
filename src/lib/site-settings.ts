/** Shape returned by `siteSettings.getPublished` and `siteSettings.getPreview`. */
export type SiteSettings = {
  flags: { priceTabEnabled: boolean };
  metadata: { title?: string; description?: string } | null;
  updatedAt: number | null;
  publishedAt: number | null;
  publishedBy: string | null;
};
