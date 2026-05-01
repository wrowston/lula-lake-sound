import type { Metadata } from "next";
import { ProtectedRouteProviders } from "@/components/protected-route-providers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
  referrer: "no-referrer",
};

export default function PreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedRouteProviders>{children}</ProtectedRouteProviders>;
}
