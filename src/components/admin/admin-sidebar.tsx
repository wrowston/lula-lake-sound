"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
import { useCmsNavGuard } from "@/components/admin/cms-workspace";
import { usePendingDraftSections } from "@/components/admin/use-pending-drafts";
import { useMemo, type MouseEvent as ReactMouseEvent } from "react";

const navItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  ...ADMIN_MANAGE_NAV_ITEMS,
];

function AdminNavLinkItem({
  item,
  pathname,
  hasPendingChanges,
}: {
  item: (typeof navItems)[number];
  pathname: string;
  hasPendingChanges: boolean;
}) {
  const convex = useConvex();
  const router = useRouter();
  const { attemptNavigate } = useCmsNavGuard();
  const { handlers: prewarmHandlers, intentRootRef } = useRoutePrewarmIntent(
    () => prewarmAdminNavigation(convex, item.href),
  );

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  async function handleClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (isActive(item.href)) return;
    // Skip the guard on modifier clicks so the user can still open the
    // destination in a new tab / window / background tab.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    const ok = await attemptNavigate();
    if (ok) router.push(item.href);
  }

  const tooltipLabel = hasPendingChanges
    ? `${item.title} · unpublished changes`
    : item.title;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive(item.href)}
        tooltip={tooltipLabel}
        render={
          <Link
            href={item.href}
            ref={intentRootRef}
            onClick={handleClick}
            {...prewarmHandlers}
          />
        }
      >
        <span className="relative inline-flex shrink-0 items-center justify-center">
          <item.icon className="size-4" />
          {hasPendingChanges ? (
            <span
              aria-hidden
              className="pointer-events-none absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-amber-500 ring-2 ring-sidebar"
            />
          ) : null}
        </span>
        <span>{item.title}</span>
        {hasPendingChanges ? (
          <span className="sr-only"> (unpublished changes)</span>
        ) : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function BackToSiteLink() {
  const router = useRouter();
  const { attemptNavigate } = useCmsNavGuard();

  async function handleClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    const ok = await attemptNavigate();
    if (ok) router.push("/");
  }

  return (
    <SidebarMenuButton
      tooltip="Back to site"
      render={<Link href="/" onClick={handleClick} />}
    >
      <ArrowLeft className="size-4" />
      <span className="body-text-small text-sidebar-foreground">
        Back to site
      </span>
    </SidebarMenuButton>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const pending = usePendingDraftSections();
  const pendingHrefs = useMemo(
    () => new Set(pending.map((section) => section.href)),
    [pending],
  );

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
                  hasPendingChanges={pendingHrefs.has(item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <BackToSiteLink />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
