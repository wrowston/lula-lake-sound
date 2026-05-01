import { AdminHeader } from "@/components/admin/admin-header";
import { AdminDashboardNavCards } from "@/components/admin/admin-dashboard-nav-cards";
import { InquiriesDashboardPreview } from "@/components/admin/inquiries-dashboard-preview";
import { PostHogAnalyticsSection } from "@/components/admin/posthog-analytics-section";
import {
  ADMIN_DASHBOARD_INNER_CLASS,
  ADMIN_PAGE_OUTER_CLASS,
} from "@/lib/admin-pending-layout";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className={ADMIN_PAGE_OUTER_CLASS}>
        <div className={ADMIN_DASHBOARD_INNER_CLASS}>
          <div>
            <h2 className="headline-secondary text-foreground text-lg mb-1">
              Welcome back
            </h2>
            <p className="body-text-small text-muted-foreground">
              Manage your studio site content from here.
            </p>
          </div>

          <PostHogAnalyticsSection />

          <InquiriesDashboardPreview />

          <AdminDashboardNavCards />
        </div>
      </div>
    </>
  );
}
