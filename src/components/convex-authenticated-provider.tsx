"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { convex } from "@/lib/convex-client";

/**
 * Admin + owner preview: Clerk JWT wiring for Convex mutations and
 * {@link Authenticated} gates. Scoped to these subtrees so public pages never
 * hit ConvexProviderWithAuth's render-phase state sync (React #301).
 */
export function ConvexAuthenticatedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
