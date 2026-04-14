import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

function parseAdminUserIds(): string[] {
  const raw = process.env.CLERK_ADMIN_USER_IDS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default clerkMiddleware(async (auth, req) => {
  if (!isAdminRoute(req)) {
    return;
  }

  const { userId } = await auth.protect();

  const allowed = parseAdminUserIds();
  if (allowed.length === 0) {
    console.error("CLERK_ADMIN_USER_IDS is not set; refusing /admin access.");
    return new NextResponse("Admin access is not configured.", { status: 503 });
  }

  if (!userId || !allowed.includes(userId)) {
    return new NextResponse("You do not have access to this area.", { status: 403 });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
