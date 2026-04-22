"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useConvex } from "convex/react";
import { LayoutDashboard, ArrowLeft } from "lucide-react";
import { ADMIN_MANAGE_NAV_ITEMS } from "@/lib/admin-nav";
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
  ...ADMIN_MANAGE_NAV_ITEMS,
];

function AdminNavLinkItem({
  item,
  pathname,
}: {
  item: (typeof navItems)[number];
  pathname: string;
}) {
  const convex = useConvex();
  const { handlers: prewarmHandlers, intentRootRef } = useRoutePrewarmIntent(
    () => prewarmAdminNavigation(convex, item.href),
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
        render={
          <Link href={item.href} ref={intentRootRef} {...prewarmHandlers} />
        }
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
    <Sidebar
      collapsible="icon"
      showResizeHandle
      className="group-data-[side=left]:border-r-0"
    >
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <Link
          href="/admin"
          className="flex w-full min-w-0 flex-col items-stretch gap-1.5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
        >
          <Image
            src="/Logos/Wordmark/LLS_Logo_Text_Sand.png"
            alt="Lula Lake Sound"
            width={1024}
            height={135}
            className="h-6 w-auto max-w-full shrink-0 object-contain object-left group-data-[collapsible=icon]:hidden"
          />
          <Image
            src="/Logos/Primary/LLS_Logo_Full_Concrete1.png"
            alt="Lula Lake Sound"
            width={800}
            height={260}
            className="hidden h-8 w-auto max-w-[calc(var(--sidebar-width-icon)-0.5rem)] shrink-0 object-contain object-center group-data-[collapsible=icon]:block"
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
