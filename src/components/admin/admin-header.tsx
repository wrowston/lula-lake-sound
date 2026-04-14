"use client";

import { Authenticated } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/admin/theme-toggle";

interface AdminHeaderProps {
  readonly title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-background px-4">
      <SidebarTrigger className="text-muted-foreground hover:bg-transparent hover:text-foreground" />
      <h1 className="headline-secondary text-foreground text-sm tracking-wider">
        {title}
      </h1>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Authenticated>
          <UserButton />
        </Authenticated>
      </div>
    </header>
  );
}
