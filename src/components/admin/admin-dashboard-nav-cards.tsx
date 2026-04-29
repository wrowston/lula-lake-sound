"use client";

import Link from "next/link";
import { useConvex } from "convex/react";
import { useRouter } from "next/navigation";
import { ADMIN_MANAGE_NAV_ITEMS } from "@/lib/admin-nav";
import {
  useCmsNavGuard,
  useCmsAdminNavigation,
} from "@/components/admin/cms-workspace";
import {
  prewarmAdminNavigation,
  useRoutePrewarmIntent,
} from "@/lib/route-prewarm";
import type { MouseEvent as ReactMouseEvent } from "react";

function DashboardNavCard({
  item,
  activeHref,
}: {
  item: (typeof ADMIN_MANAGE_NAV_ITEMS)[number];
  activeHref: string;
}) {
  const convex = useConvex();
  const router = useRouter();
  const { attemptNavigate } = useCmsNavGuard();
  const { navigateWithinCms } = useCmsAdminNavigation();
  const { handlers: prewarmHandlers, intentRootRef } = useRoutePrewarmIntent(
    () => {
      router.prefetch(item.href);
      prewarmAdminNavigation(convex, item.href);
    },
  );

  function isActive(href: string) {
    return activeHref.startsWith(href);
  }

  async function handleClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (isActive(item.href)) return;
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
    if (ok) navigateWithinCms(item.href);
  }

  return (
    <Link
      ref={intentRootRef}
      href={item.href}
      onClick={handleClick}
      {...prewarmHandlers}
      className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-border hover:bg-muted/60"
    >
      <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-foreground">
        <item.icon className="size-4" />
      </div>
      <h3 className="headline-secondary text-foreground text-sm mb-1">
        {item.title}
      </h3>
      <p className="body-text-small text-muted-foreground">{item.description}</p>
    </Link>
  );
}

export function AdminDashboardNavCards() {
  const { activeAdminHref } = useCmsAdminNavigation();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ADMIN_MANAGE_NAV_ITEMS.map((item) => (
        <DashboardNavCard
          key={item.href}
          item={item}
          activeHref={activeAdminHref}
        />
      ))}
    </div>
  );
}
