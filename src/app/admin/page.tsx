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
            <h2 className="headline-secondary text-foreground text-lg mb-1">
              Welcome back
            </h2>
            <p className="body-text-small text-muted-foreground">
              Manage your studio site content from here.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-border hover:bg-muted/60"
              >
                <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-foreground">
                  <section.icon className="size-4" />
                </div>
                <h3 className="headline-secondary text-foreground text-sm mb-1">
                  {section.label}
                </h3>
                <p className="body-text-small text-muted-foreground">
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
