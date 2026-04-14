import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { Skeleton } from "@/components/ui/skeleton";

function SettingsEditorSkeleton() {
  return (
    <div className="space-y-8">
      <fieldset className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
    </div>
  );
}

const SettingsEditor = dynamic(
  () =>
    import("./settings-editor").then((m) => ({ default: m.SettingsEditor })),
  { loading: () => <SettingsEditorSkeleton /> },
);

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <>
      <AdminHeader title="Settings" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <SettingsEditor />
        </div>
      </div>
    </>
  );
}
