"use client";

/**
 * Public entry for the About rich text surface. Tiptap and `@tiptap/*` live in
 * `rich-text-editor-core.tsx` and are loaded via `next/dynamic` with
 * `ssr: false` so they ship as a separate async chunk (INF-106).
 */

import dynamic from "next/dynamic";

export type { RichTextEditorHandle } from "./rich-text-editor-core";

function RichTextEditorLoadSkeleton() {
  return (
    <div className="dark overflow-hidden rounded-lg border border-border bg-washed-black">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 translate-z-0 bg-texture-stone opacity-[0.22]"
          aria-hidden
        />
        <div className="relative z-10">
          <div className="flex h-10 flex-wrap items-center gap-0.5 border-b border-sand/15 bg-black/35 px-1 py-1" />
          <div className="min-h-[18rem] [contain:paint] px-5 py-6 md:px-8 md:py-8" />
        </div>
      </div>
    </div>
  );
}

export const RichTextEditor = dynamic(
  () =>
    import("./rich-text-editor-core").then((m) => ({
      default: m.RichTextEditorCore,
    })),
  { ssr: false, loading: RichTextEditorLoadSkeleton },
);
