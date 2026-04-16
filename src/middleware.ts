import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isPreviewRoute = createRouteMatcher(["/preview(.*)"]);

// Next.js Link prefetch (RSC) uses the app path (e.g. /admin/pricing), not _next/static,
// so it matches this middleware. Authenticated users pass auth.protect(); unauthenticated
// prefetch gets redirected like a full navigation.

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    if (process.env.ADMIN_ENABLED !== "true") {
      return NextResponse.rewrite(new URL("/not-found", req.url), {
        status: 404,
      });
    }
    await auth.protect();
  }

  if (isPreviewRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
