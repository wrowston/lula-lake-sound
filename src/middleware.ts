import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isPreviewRoute = createRouteMatcher(["/preview(.*)"]);

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
  matcher: ["/admin/:path*", "/preview/:path*"],
};
