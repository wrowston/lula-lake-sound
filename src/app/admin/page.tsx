import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ADMIN_MANAGE_NAV_ITEMS } from "@/lib/admin-nav";

export const revalidate = 300;

export default function DashboardPage() {
  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          <div>
            <h2 className="headline-secondary text-foreground text-lg mb-1">
              Welcome back
            </h2>
            <p className="body-text-small text-muted-foreground">
              Manage your studio site content from here.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADMIN_MANAGE_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-border hover:bg-muted/60"
              >
                <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-foreground">
                  <item.icon className="size-4" />
                </div>
                <h3 className="headline-secondary text-foreground text-sm mb-1">
                  {item.title}
                </h3>
                <p className="body-text-small text-muted-foreground">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
