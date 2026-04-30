import type { Metadata } from "next";

import { ConvexAuthenticatedProvider } from "@/components/convex-authenticated-provider";

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
  return (
    <ConvexAuthenticatedProvider>{children}</ConvexAuthenticatedProvider>
  );
}
