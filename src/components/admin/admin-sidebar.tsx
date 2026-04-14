"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

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
            className="shrink-0 brightness-0 invert"
            style={{ width: "auto", height: "auto" }}
          />
          <span className="headline-secondary text-sand text-sm tracking-wider group-data-[collapsible=icon]:hidden">
            Studio CMS
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="label-text text-ivory/40 text-[10px]">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
              <span className="body-text-small">Back to site</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
