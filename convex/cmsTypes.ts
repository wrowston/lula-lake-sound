import type { Doc } from "./_generated/dataModel";

/** Site-wide settings payload (flags + metadata) stored inside section snapshots. */
export type SettingsContent = Doc<"cmsSections">["publishedSnapshot"];

/** Section identifiers that participate in the shared draft/publish flow. */
export type CmsSection = Doc<"cmsSections">["section"];
