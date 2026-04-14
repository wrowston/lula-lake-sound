import Link from "next/link";
import {
  DollarSign,
  Wrench,
  ImageIcon,
  Video,
  Music,
  User,
  Settings,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";

const sections = [
  {
    label: "Pricing",
    desc: "Manage packages & rates",
    href: "/admin/pricing",
    icon: DollarSign,
  },
  {
    label: "Gear",
    desc: "Equipment inventory",
    href: "/admin/gear",
    icon: Wrench,
  },
  {
    label: "Photos",
    desc: "Gallery management",
    href: "/admin/photos",
    icon: ImageIcon,
  },
  {
    label: "Videos",
    desc: "Video portfolio",
    href: "/admin/videos",
    icon: Video,
  },
  {
    label: "Audio",
    desc: "Audio samples",
    href: "/admin/audio",
    icon: Music,
  },
  {
    label: "About",
    desc: "Studio bio & story",
    href: "/admin/about",
    icon: User,
  },
  {
    label: "Settings",
    desc: "Site configuration",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function DashboardPage() {
  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          <div>
            <h2 className="headline-secondary text-sand text-lg mb-1">
              Welcome back
            </h2>
            <p className="body-text-small text-ivory/40">
              Manage your studio site content from here.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="group rounded-lg border border-sand/8 bg-charcoal/40 p-5 transition-all hover:border-sand/20 hover:bg-charcoal/60"
              >
                <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-sand/8 text-sand/60 transition-colors group-hover:bg-sand/12 group-hover:text-sand">
                  <section.icon className="size-4" />
                </div>
                <h3 className="headline-secondary text-sand text-sm mb-1">
                  {section.label}
                </h3>
                <p className="body-text-small text-ivory/40">
                  {section.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
