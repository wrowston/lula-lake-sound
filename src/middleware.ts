import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isPreviewRoute = createRouteMatcher(["/preview(.*)"]);
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isDashboardAccessDeniedRoute = createRouteMatcher([
  "/dashboard/access-denied",
]);

function parseCommaSeparatedEnvIds(raw: string | undefined): string[] | null {
  if (raw === undefined || raw.trim() === "") {
    return null;
  }
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return ids.length > 0 ? ids : null;
}

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

  if (isDashboardRoute(req)) {
    if (process.env.DASHBOARD_ENABLED !== "true") {
      return NextResponse.rewrite(new URL("/not-found", req.url), {
        status: 404,
      });
    }
    if (!isDashboardAccessDeniedRoute(req)) {
      await auth.protect();

      const requiredOrg = process.env.INFERENCE_PARTNERS_ORG_ID?.trim();
      if (requiredOrg) {
        const { orgId } = await auth();
        if (orgId !== requiredOrg) {
          return NextResponse.redirect(
            new URL("/dashboard/access-denied", req.url),
          );
        }
      }

      const allowedUserIds = parseCommaSeparatedEnvIds(
        process.env.INFERENCE_PARTNERS_USER_IDS,
      );
      if (allowedUserIds) {
        const { userId } = await auth();
        if (!userId || !allowedUserIds.includes(userId)) {
          return NextResponse.redirect(
            new URL("/dashboard/access-denied", req.url),
          );
        }
      }
    }
  }
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/preview/:path*",
    "/dashboard/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
  ],
};
