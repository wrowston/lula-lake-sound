"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeProvider } from "@/components/theme-provider";

export function ProtectedRouteProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ClerkProvider>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}
