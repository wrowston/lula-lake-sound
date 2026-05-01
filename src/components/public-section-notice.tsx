import { cn } from "@/lib/utils";

type PublicSectionNoticeProps = {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly className?: string;
};

/**
 * Static, non-modal notice for public marketing sections when live data is
 * unavailable (Convex outage). Keeps layout dignified without trapping focus.
 */
export function PublicSectionNotice({
  title,
  children,
  className,
}: PublicSectionNoticeProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-sm border border-sand/20 bg-washed-black/80 px-6 py-10 text-center md:px-10",
        className,
      )}
    >
      <p className="label-text text-[11px] tracking-[0.18em] text-sand/70">
        {title}
      </p>
      <p className="body-text-small mx-auto mt-4 max-w-md text-ivory/78">
        {children}
      </p>
    </div>
  );
}
