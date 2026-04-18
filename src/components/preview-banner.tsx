"use client";

import Link from "next/link";

interface PreviewBannerProps {
  readonly hasDraftChanges: boolean;
}

/**
 * Floating banner shown on `/preview` pages to indicate the owner
 * is viewing draft (unpublished) content. Styled with brand tokens
 * (gold + washed-black) so it blends with the surrounding site.
 */
export function PreviewBanner({ hasDraftChanges }: PreviewBannerProps) {
  return (
    <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2">
      <div className="flex items-center gap-3 border border-gold/30 bg-washed-black/90 px-5 py-2.5 text-xs text-ivory/90 shadow-lg backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
        </span>
        <span
          className="label-text text-gold/90"
          style={{ letterSpacing: "0.25em" }}
        >
          Preview
          {hasDraftChanges
            ? " · viewing draft"
            : " · no unpublished changes"}
        </span>
        <Link
          href="/"
          className="label-text border border-gold/30 px-3 py-1 text-gold transition-colors duration-300 hover:border-gold hover:text-warm-white"
        >
          Exit
        </Link>
      </div>
    </div>
  );
}
