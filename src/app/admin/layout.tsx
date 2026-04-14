import type { Metadata } from "next";
import { cookies } from "next/headers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  getDefaultSidebarOpenFromCookie,
  SIDEBAR_COOKIE_NAME,
} from "@/lib/sidebar-cookie";

export const metadata: Metadata = {
  title: {
    template: "%s | Studio CMS",
    default: "Studio CMS | Lula Lake Sound",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = getDefaultSidebarOpenFromCookie(
    cookieStore.get(SIDEBAR_COOKIE_NAME)?.value
  );

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AdminSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
