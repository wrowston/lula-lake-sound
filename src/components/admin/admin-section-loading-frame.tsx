import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";

export function AdminSectionLoadingFrame({
  title,
  outerClassName,
  innerClassName,
  children,
}: {
  readonly title: string;
  readonly outerClassName: string;
  readonly innerClassName: string;
  readonly children: ReactNode;
}) {
  return (
    <>
      <AdminHeader title={title} />
      <div className={outerClassName}>
        <div className={innerClassName}>{children}</div>
      </div>
    </>
  );
}
