import type { LucideIcon } from "lucide-react";
import {
  DollarSign,
  Wrench,
  ImageIcon,
  Video,
  Music,
  User,
  Settings,
} from "lucide-react";

/** Shared routes for admin sidebar and dashboard cards (excludes /admin root). */
export const ADMIN_MANAGE_NAV_ITEMS: {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    title: "Pricing",
    href: "/admin/pricing",
    icon: DollarSign,
    description: "Manage packages & rates",
  },
  {
    title: "Gear",
    href: "/admin/gear",
    icon: Wrench,
    description: "Equipment inventory",
  },
  {
    title: "Photos",
    href: "/admin/photos",
    icon: ImageIcon,
    description: "Gallery management",
  },
  {
    title: "Videos",
    href: "/admin/videos",
    icon: Video,
    description: "Video portfolio",
  },
  {
    title: "Audio",
    href: "/admin/audio",
    icon: Music,
    description: "Audio samples",
  },
  {
    title: "About",
    href: "/admin/about",
    icon: User,
    description: "Studio bio & story",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Site configuration",
  },
];

/**
 * Keys returned from `api.cms.listPendingDrafts`. Aggregates every CMS
 * surface that tracks its own draft state (`cmsSections` + the two singleton
 * meta tables).
 */
export type PendingDraftKey =
  | "settings"
  | "pricing"
  | "about"
  | "recordings"
  | "gear"
  | "photos";

/**
 * Nav target + user-facing label for each pending-draft key. `recordings` is
 * flag-only and is managed from the Audio admin page, so it links there.
 */
export const PENDING_SECTION_NAV: Record<
  PendingDraftKey,
  { readonly href: string; readonly label: string }
> = {
  settings: { href: "/admin/settings", label: "Settings" },
  pricing: { href: "/admin/pricing", label: "Pricing" },
  about: { href: "/admin/about", label: "About" },
  recordings: { href: "/admin/audio", label: "Audio" },
  gear: { href: "/admin/gear", label: "Gear" },
  photos: { href: "/admin/photos", label: "Photos" },
};

/** Stable display order for pending-draft chips / dots. */
export const PENDING_SECTION_ORDER: readonly PendingDraftKey[] = [
  "settings",
  "pricing",
  "about",
  "gear",
  "photos",
  "recordings",
];
