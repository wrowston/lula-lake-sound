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
