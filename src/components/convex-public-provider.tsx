"use client";

import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/convex-client";

/**
 * Public marketing routes: anonymous Convex subscriptions only.
 *
 * Avoids {@link ConvexProviderWithClerk} here: Convex's auth integration calls
 * `setState` during render when syncing Clerk loading/unauthenticated state,
 * which can hit React error #301 (render-phase update loop) on React 19.
 */
export function ConvexPublicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
