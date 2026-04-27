import type { LucideIcon } from "lucide-react";
import {
  DollarSign,
  Wrench,
  ImageIcon,
  Video,
  Music,
  User,
  Settings,
  MapPin,
  CircleHelp,
} from "lucide-react";

/** Shared routes for admin sidebar and dashboard cards (excludes /admin root). */
export const ADMIN_MANAGE_NAV_ITEMS: {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    title: "About",
    href: "/admin/about",
    icon: User,
    description: "Studio bio & story",
  },
  {
    title: "Photos",
    href: "/admin/photos",
    icon: ImageIcon,
    description: "Gallery management",
  },
  {
    title: "Gear",
    href: "/admin/gear",
    icon: Wrench,
    description: "Equipment inventory",
  },
  {
    title: "Audio",
    href: "/admin/audio",
    icon: Music,
    description: "Audio samples",
  },
  {
    title: "Pricing",
    href: "/admin/pricing",
    icon: DollarSign,
    description: "Manage packages & rates",
  },
  {
    title: "Amenities nearby",
    href: "/admin/amenities-nearby",
    icon: MapPin,
    description: "Local favorites on the homepage",
  },
  {
    title: "FAQ",
    href: "/admin/faq",
    icon: CircleHelp,
    description: "Homepage questions & answers",
  },
  {
    title: "Videos",
    href: "/admin/videos",
    icon: Video,
    description: "Video portfolio",
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
  | "faq"
  | "amenitiesNearby"
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
  faq: { href: "/admin/faq", label: "FAQ" },
  amenitiesNearby: {
    href: "/admin/amenities-nearby",
    label: "Amenities nearby",
  },
  gear: { href: "/admin/gear", label: "Gear" },
  photos: { href: "/admin/photos", label: "Photos" },
};

/** Stable display order for pending-draft chips / dots. */
export const PENDING_SECTION_ORDER: readonly PendingDraftKey[] = [
  "settings",
  "pricing",
  "about",
  "faq",
  "amenitiesNearby",
  "gear",
  "photos",
  "recordings",
];
