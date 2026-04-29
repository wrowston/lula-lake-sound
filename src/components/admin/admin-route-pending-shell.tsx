"use client";

import { AdminHeader } from "@/components/admin/admin-header";
import {
  getAdminPendingBody,
  getAdminPendingLayout,
} from "@/lib/admin-pending-layout";

/**
 * Full-page pending UI for a target admin href: real header + page shell +
 * section-specific editor skeleton (or dashboard grid skeleton for `/admin`).
 */
export function AdminRoutePendingShell({ targetHref }: { targetHref: string }) {
  const { title, outerClassName, innerClassName } =
    getAdminPendingLayout(targetHref);
  const Body = getAdminPendingBody(
    targetHref.split("?")[0]?.split("#")[0] || "/admin",
  );

  return (
    <>
      <AdminHeader title={title} />
      <div className={outerClassName}>
        <div className={innerClassName}>
          <Body />
        </div>
      </div>
    </>
  );
}
