import type { ComponentType } from "react";
import { AdminDashboardLoadingSkeleton } from "@/components/admin/admin-dashboard-loading-skeleton";
import { AboutEditorSkeleton } from "@/app/admin/about/about-editor-skeleton";
import { PhotosEditorSkeleton } from "@/app/admin/photos/photos-editor-skeleton";
import { GearEditorSkeleton } from "@/app/admin/gear/gear-editor-skeleton";
import { AudioEditorSkeleton } from "@/app/admin/audio/audio-editor-skeleton";
import { PricingEditorSkeleton } from "@/app/admin/pricing/pricing-editor-skeleton";
import { AmenitiesEditorSkeleton } from "@/app/admin/amenities-nearby/amenities-editor-skeleton";
import { FaqEditorSkeleton } from "@/app/admin/faq/faq-editor-skeleton";
import { VideosEditorSkeleton } from "@/app/admin/videos/videos-editor-skeleton";
import { SettingsEditorSkeleton } from "@/app/admin/settings/settings-editor-skeleton";
import { InquiriesEditorSkeleton } from "@/app/admin/inquiries/inquiries-editor-skeleton";

/** Shared layout shell classes for admin CMS pages and their loading states. */
export const ADMIN_PAGE_OUTER_CLASS = "flex-1 px-5 py-8 pb-12 sm:px-8";
export const ADMIN_PAGE_INNER_CLASS = "mx-auto max-w-6xl";
export const ADMIN_DASHBOARD_INNER_CLASS = `${ADMIN_PAGE_INNER_CLASS} space-y-8`;

/** Layout shell for admin route loading / optimistic navigation (matches each page.tsx wrapper). */
export type AdminPendingLayout = {
  readonly title: string;
  readonly outerClassName: string;
  readonly innerClassName: string;
};

type AdminPendingRouteEntry = AdminPendingLayout & {
  readonly Body: ComponentType;
};

const ROUTES = {
  "/admin": {
    title: "Dashboard",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_DASHBOARD_INNER_CLASS,
    Body: AdminDashboardLoadingSkeleton,
  },
  "/admin/inquiries": {
    title: "Contact submissions",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
    Body: InquiriesEditorSkeleton,
  },
  "/admin/about": {
    title: "About",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
    Body: AboutEditorSkeleton,
  },
  "/admin/photos": {
    title: "Photos",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
    Body: PhotosEditorSkeleton,
  },
  "/admin/gear": {
    title: "Gear",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
    Body: GearEditorSkeleton,
  },
  "/admin/audio": {
    title: "Audio",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
    Body: AudioEditorSkeleton,
  },
  "/admin/pricing": {
    title: "Pricing",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
    Body: PricingEditorSkeleton,
  },
  "/admin/amenities-nearby": {
    title: "Amenities nearby",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
    Body: AmenitiesEditorSkeleton,
  },
  "/admin/faq": {
    title: "FAQ",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
    Body: FaqEditorSkeleton,
  },
  "/admin/videos": {
    title: "Videos",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
    Body: VideosEditorSkeleton,
  },
  "/admin/settings": {
    title: "Settings",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
    Body: SettingsEditorSkeleton,
  },
} as const satisfies Record<string, AdminPendingRouteEntry>;

const ENTRIES = Object.entries(ROUTES) as [string, AdminPendingRouteEntry][];

function normalizePath(pathOrHref: string): string {
  return (pathOrHref.split("?")[0] ?? "").split("#")[0] || "/admin";
}

function resolveAdminPendingRoute(pathOrHref: string): AdminPendingRouteEntry {
  const path = normalizePath(pathOrHref);

  const exact = ROUTES[path as keyof typeof ROUTES];
  if (exact) return exact;

  for (const [prefix, entry] of ENTRIES) {
    if (prefix === "/admin") continue;
    if (path === prefix || path.startsWith(`${prefix}/`)) return entry;
  }

  if (path.startsWith("/admin")) return ROUTES["/admin"];

  return ROUTES["/admin"];
}

/**
 * Resolve layout metadata for an admin href (pathname or full URL without hash).
 * Unknown `/admin/*` paths fall back to the dashboard layout.
 */
export function getAdminPendingLayout(pathOrHref: string): AdminPendingLayout {
  const entry = resolveAdminPendingRoute(pathOrHref);
  return {
    title: entry.title,
    outerClassName: entry.outerClassName,
    innerClassName: entry.innerClassName,
  };
}

/** Skeleton component for optimistic navigation / loading for the given admin path. */
export function getAdminPendingBody(pathOrHref: string): ComponentType {
  return resolveAdminPendingRoute(pathOrHref).Body;
}
