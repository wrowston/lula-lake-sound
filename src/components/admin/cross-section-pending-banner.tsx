"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight } from "lucide-react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useCmsNavGuard } from "@/components/admin/cms-workspace";
import type { PendingDraftSection } from "@/components/admin/use-pending-drafts";

export interface CrossSectionPendingBannerProps {
  readonly sections: readonly PendingDraftSection[];
}

/**
 * Row rendered above the persistent publish toolbar that surfaces draft state
 * owned by OTHER CMS sections. Each chip deep-links into the owning section
 * via the shared CMS nav guard so any unsaved local edit on the current
 * section gets a chance to autosave before navigation.
 *
 * Hidden by the parent when the list is empty (e.g. the current section is
 * the only place with pending edits).
 */
export function CrossSectionPendingBanner({
  sections,
}: CrossSectionPendingBannerProps) {
  const router = useRouter();
  const { attemptNavigate } = useCmsNavGuard();

  if (sections.length === 0) return null;

  async function handleClick(
    event: ReactMouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    const ok = await attemptNavigate();
    if (ok) router.push(href);
  }

  const label =
    sections.length === 1
      ? "Unpublished changes in another section:"
      : `Unpublished changes in ${sections.length} other sections:`;

  return (
    <div
      role="status"
      aria-live="polite"
      data-cms-pending-banner
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-amber-500/30 bg-amber-500/10 px-6 py-2 text-xs text-amber-900 dark:bg-amber-500/15 dark:text-amber-100"
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        <AlertCircle
          className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        {label}
      </span>
      <ul className="flex flex-wrap items-center gap-1.5">
        {sections.map((section) => (
          <li key={section.key}>
            <Link
              href={section.href}
              onClick={(event) => void handleClick(event, section.href)}
              className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-1 dark:text-amber-100"
            >
              {section.label}
              <ChevronRight className="size-3 opacity-70" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
