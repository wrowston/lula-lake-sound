/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aboutPreviewDraft from "../aboutPreviewDraft.js";
import type * as aboutTeamStorage from "../aboutTeamStorage.js";
import type * as admin_about from "../admin/about.js";
import type * as admin_aboutTeam from "../admin/aboutTeam.js";
import type * as admin_audio from "../admin/audio.js";
import type * as admin_gear from "../admin/gear.js";
import type * as admin_photos from "../admin/photos.js";
import type * as admin_pricing from "../admin/pricing.js";
import type * as admin_publish from "../admin/publish.js";
import type * as admin_siteSettings from "../admin/siteSettings.js";
import type * as cms from "../cms.js";
import type * as cmsPublishHelpers from "../cmsPublishHelpers.js";
import type * as cmsShared from "../cmsShared.js";
import type * as errors from "../errors.js";
import type * as audioPreviewDraft from "../audioPreviewDraft.js";
import type * as audioTracks from "../audioTracks.js";
import type * as galleryPhotos from "../galleryPhotos.js";
import type * as gearEquipmentSeed from "../gearEquipmentSeed.js";
import type * as gearLegacySeed from "../gearLegacySeed.js";
import type * as gearPreviewDraft from "../gearPreviewDraft.js";
import type * as gearTree from "../gearTree.js";
import type * as inquiries from "../inquiries.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_sentryConvex from "../lib/sentryConvex.js";
import type * as migrations_gearFromEquipmentSpecs from "../migrations/gearFromEquipmentSpecs.js";
import type * as observability from "../observability.js";
import type * as photosPreviewDraft from "../photosPreviewDraft.js";
import type * as pricingPreviewDraft from "../pricingPreviewDraft.js";
import type * as public_ from "../public.js";
import type * as publicSettingsSnapshot from "../publicSettingsSnapshot.js";
import type * as seed from "../seed.js";
import type * as sentryNodeReport from "../sentryNodeReport.js";
import type * as siteSettingsPreviewDraft from "../siteSettingsPreviewDraft.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aboutPreviewDraft: typeof aboutPreviewDraft;
  aboutTeamStorage: typeof aboutTeamStorage;
  "admin/about": typeof admin_about;
  "admin/aboutTeam": typeof admin_aboutTeam;
  "admin/audio": typeof admin_audio;
  "admin/gear": typeof admin_gear;
  "admin/photos": typeof admin_photos;
  "admin/pricing": typeof admin_pricing;
  "admin/publish": typeof admin_publish;
  "admin/siteSettings": typeof admin_siteSettings;
  cms: typeof cms;
  cmsPublishHelpers: typeof cmsPublishHelpers;
  cmsShared: typeof cmsShared;
  errors: typeof errors;
  audioPreviewDraft: typeof audioPreviewDraft;
  audioTracks: typeof audioTracks;
  galleryPhotos: typeof galleryPhotos;
  gearEquipmentSeed: typeof gearEquipmentSeed;
  gearLegacySeed: typeof gearLegacySeed;
  gearPreviewDraft: typeof gearPreviewDraft;
  gearTree: typeof gearTree;
  inquiries: typeof inquiries;
  "lib/auth": typeof lib_auth;
  "lib/sentryConvex": typeof lib_sentryConvex;
  "migrations/gearFromEquipmentSpecs": typeof migrations_gearFromEquipmentSpecs;
  observability: typeof observability;
  photosPreviewDraft: typeof photosPreviewDraft;
  pricingPreviewDraft: typeof pricingPreviewDraft;
  public: typeof public_;
  publicSettingsSnapshot: typeof publicSettingsSnapshot;
  seed: typeof seed;
  sentryNodeReport: typeof sentryNodeReport;
  siteSettingsPreviewDraft: typeof siteSettingsPreviewDraft;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
