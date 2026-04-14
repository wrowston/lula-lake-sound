"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useConvex } from "convex/react";
import {
  LayoutDashboard,
  DollarSign,
  Wrench,
  ImageIcon,
  Video,
  Music,
  User,
  Settings,
  ArrowLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  prewarmAdminNavigation,
  useRoutePrewarmIntent,
} from "@/lib/route-prewarm";

const navItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Pricing", href: "/admin/pricing", icon: DollarSign },
  { title: "Gear", href: "/admin/gear", icon: Wrench },
  { title: "Photos", href: "/admin/photos", icon: ImageIcon },
  { title: "Videos", href: "/admin/videos", icon: Video },
  { title: "Audio", href: "/admin/audio", icon: Music },
  { title: "About", href: "/admin/about", icon: User },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminNavLinkItem({
  item,
  pathname,
}: {
  item: (typeof navItems)[number];
  pathname: string;
}) {
  const convex = useConvex();
  const prewarmHandlers = useRoutePrewarmIntent(() =>
    prewarmAdminNavigation(convex, item.href),
  );

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive(item.href)}
        tooltip={item.title}
        render={<Link href={item.href} {...prewarmHandlers} />}
      >
        <item.icon className="size-4" />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <Link
          href="/admin"
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
        >
          <Image
            src="/LLS_Logo_Full_Tar.png"
            alt="Lula Lake Sound"
            width={32}
            height={32}
            className="shrink-0 dark:brightness-0 dark:invert"
            style={{ width: "auto", height: "auto" }}
          />
          <span className="headline-secondary text-sidebar-foreground text-sm tracking-wider group-data-[collapsible=icon]:hidden">
            Studio CMS
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="label-text text-muted-foreground text-[10px]">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <AdminNavLinkItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Back to site"
              render={<Link href="/" />}
            >
              <ArrowLeft className="size-4" />
              <span className="body-text-small text-sidebar-foreground">
                Back to site
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
