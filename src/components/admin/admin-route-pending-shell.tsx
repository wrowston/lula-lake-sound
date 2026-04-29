"use client";

import type { ComponentType } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminDashboardLoadingSkeleton } from "@/components/admin/admin-dashboard-loading-skeleton";
import { getAdminPendingLayout } from "@/lib/admin-pending-layout";
import { AboutEditorSkeleton } from "@/app/admin/about/about-editor-skeleton";
import { PhotosEditorSkeleton } from "@/app/admin/photos/photos-editor-skeleton";
import { GearEditorSkeleton } from "@/app/admin/gear/gear-editor-skeleton";
import { AudioEditorSkeleton } from "@/app/admin/audio/audio-editor-skeleton";
import { PricingEditorSkeleton } from "@/app/admin/pricing/pricing-editor-skeleton";
import { AmenitiesEditorSkeleton } from "@/app/admin/amenities-nearby/amenities-editor-skeleton";
import { FaqEditorSkeleton } from "@/app/admin/faq/faq-editor-skeleton";
import { VideosEditorSkeleton } from "@/app/admin/videos/videos-editor-skeleton";
import { SettingsEditorSkeleton } from "@/app/admin/settings/settings-editor-skeleton";

const BODY_BY_PREFIX: { prefix: string; Body: ComponentType }[] = [
  { prefix: "/admin/settings", Body: SettingsEditorSkeleton },
  { prefix: "/admin/videos", Body: VideosEditorSkeleton },
  { prefix: "/admin/faq", Body: FaqEditorSkeleton },
  { prefix: "/admin/amenities-nearby", Body: AmenitiesEditorSkeleton },
  { prefix: "/admin/pricing", Body: PricingEditorSkeleton },
  { prefix: "/admin/audio", Body: AudioEditorSkeleton },
  { prefix: "/admin/gear", Body: GearEditorSkeleton },
  { prefix: "/admin/photos", Body: PhotosEditorSkeleton },
  { prefix: "/admin/about", Body: AboutEditorSkeleton },
];

function resolveBody(path: string): ComponentType {
  const normalized = path.split("?")[0]?.split("#")[0] || "/admin";
  if (normalized === "/admin") {
    return AdminDashboardLoadingSkeleton;
  }
  for (const { prefix, Body } of BODY_BY_PREFIX) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return Body;
    }
  }
  if (normalized.startsWith("/admin")) {
    return AdminDashboardLoadingSkeleton;
  }
  return AdminDashboardLoadingSkeleton;
}

/**
 * Full-page pending UI for a target admin href: real header + page shell +
 * section-specific editor skeleton (or dashboard grid skeleton for `/admin`).
 */
export function AdminRoutePendingShell({ targetHref }: { targetHref: string }) {
  const { title, outerClassName, innerClassName } =
    getAdminPendingLayout(targetHref);
  const Body = resolveBody(targetHref.split("?")[0]?.split("#")[0] || "/admin");

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
