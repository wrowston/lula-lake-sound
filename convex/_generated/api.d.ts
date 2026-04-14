/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_siteSettings from "../admin/siteSettings.js";
import type * as cms from "../cms.js";
import type * as cmsShared from "../cmsShared.js";
import type * as inquiries from "../inquiries.js";
import type * as lib_auth from "../lib/auth.js";
import type * as seed from "../seed.js";
import type * as siteSettings from "../siteSettings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/siteSettings": typeof admin_siteSettings;
  cms: typeof cms;
  cmsShared: typeof cmsShared;
  inquiries: typeof inquiries;
  "lib/auth": typeof lib_auth;
  seed: typeof seed;
  siteSettings: typeof siteSettings;
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
