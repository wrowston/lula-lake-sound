"use client";

import { Authenticated } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AdminHeaderProps {
  readonly title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 px-4">
      <SidebarTrigger className="text-ivory/40 hover:text-sand hover:bg-transparent" />
      <h1 className="headline-secondary text-sand text-sm tracking-wider">
        {title}
      </h1>
      <div className="ml-auto">
        <Authenticated>
          <UserButton />
        </Authenticated>
      </div>
    </header>
  );
}
