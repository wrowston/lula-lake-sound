"use client";

import Link from "next/link";

interface PreviewBannerProps {
  readonly hasDraftChanges: boolean;
}

/**
 * Floating banner shown on `/preview` pages to indicate the owner
 * is viewing draft (unpublished) content.
 */
export function PreviewBanner({ hasDraftChanges }: PreviewBannerProps) {
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full border border-amber-500/30 bg-amber-950/90 px-5 py-2.5 text-sm text-amber-200 shadow-lg backdrop-blur-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
        </span>
        <span className="font-medium">
          Preview Mode
          {hasDraftChanges ? " — viewing draft changes" : " — no unpublished changes"}
        </span>
        <Link
          href="/"
          className="ml-1 rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-medium text-amber-100 transition hover:bg-amber-500/30"
        >
          Exit Preview
        </Link>
      </div>
    </div>
  );
}
