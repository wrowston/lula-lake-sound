import type { Metadata } from "next";
import { ProtectedRouteProviders } from "@/components/protected-route-providers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    template: "%s | Inference Partners",
    default: "Dashboard | Inference Partners",
  },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedRouteProviders>{children}</ProtectedRouteProviders>;
}
