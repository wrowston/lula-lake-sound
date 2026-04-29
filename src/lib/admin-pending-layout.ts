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

const LAYOUTS = {
  "/admin": {
    title: "Dashboard",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_DASHBOARD_INNER_CLASS,
  },
  "/admin/about": {
    title: "About",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
  },
  "/admin/photos": {
    title: "Photos",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
  },
  "/admin/gear": {
    title: "Gear",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
  },
  "/admin/audio": {
    title: "Audio",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
  },
  "/admin/pricing": {
    title: "Pricing",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
  },
  "/admin/amenities-nearby": {
    title: "Amenities nearby",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
  },
  "/admin/faq": {
    title: "FAQ",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
  },
  "/admin/videos": {
    title: "Videos",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
  },
  "/admin/settings": {
    title: "Settings",
    outerClassName: ADMIN_PAGE_OUTER_CLASS,
    innerClassName: ADMIN_PAGE_INNER_CLASS,
  },
} as const satisfies Record<string, AdminPendingLayout>;

const ENTRIES = Object.entries(LAYOUTS) as [string, AdminPendingLayout][];

/**
 * Resolve layout metadata for an admin href (pathname or full URL without hash).
 * Unknown `/admin/*` paths fall back to the dashboard layout.
 */
export function getAdminPendingLayout(pathOrHref: string): AdminPendingLayout {
  const path = (pathOrHref.split("?")[0] ?? "").split("#")[0] || "/admin";

  const exact = LAYOUTS[path as keyof typeof LAYOUTS];
  if (exact) return exact;

  for (const [prefix, layout] of ENTRIES) {
    if (prefix === "/admin") continue;
    if (path === prefix || path.startsWith(`${prefix}/`)) return layout;
  }

  if (path.startsWith("/admin")) return LAYOUTS["/admin"];

  return LAYOUTS["/admin"];
}
