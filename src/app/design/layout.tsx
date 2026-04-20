import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Design Exploration — Lula Lake Sound",
  description:
    "INF-45 design exploration: three directions for About, Gallery, and Recordings, built on the refreshed Lula Lake Sound brand system.",
  robots: { index: false, follow: false },
};

/**
 * Design exploration shell.
 *
 * Kept visually distinct from the live marketing site so reviewers know
 * they are inside the sandbox: a muted top utility bar with a back link,
 * the Lula Lake Sound wordmark, and a "DESIGN · EXPLORATION" label.
 * Otherwise inherits the brand dark ground + grain overlay.
 */
export default function DesignLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="dark relative min-h-screen bg-washed-black text-ivory grain-overlay">
      <div className="sticky top-0 z-50 border-b border-sand/10 bg-washed-black/92 backdrop-blur-[2px]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-3 md:px-8">
          <Link
            href="/design"
            className="group/home flex items-center gap-3 text-sand transition-opacity hover:opacity-80"
          >
            <Image
              src="/Logos/Graphic/LLS_Logo_Graphic_Sand.png"
              alt=""
              width={64}
              height={64}
              aria-hidden
              className="h-7 w-auto opacity-85"
            />
            <span className="hidden h-5 w-px bg-sand/15 sm:block" />
            <span className="label-text hidden text-[10px] text-ivory/55 sm:inline">
              Design · Exploration
            </span>
          </Link>

          <div className="flex items-center gap-4 md:gap-6">
            <Link
              href="/design"
              className="label-text text-[10px] text-ivory/55 transition-colors duration-500 hover:text-sand"
            >
              Overview
            </Link>
            <span className="hidden h-3 w-px bg-sand/15 md:block" />
            <Link
              href="/"
              className="label-text text-[10px] text-ivory/55 transition-colors duration-500 hover:text-sand"
            >
              ← Live site
            </Link>
          </div>
        </div>
      </div>

      {children}

      <footer className="border-t border-sand/10 px-6 py-12 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 text-ivory/35 md:flex-row md:items-center">
          <p className="eyebrow text-[10px] text-sand/50">
            INF-45 · Sandbox · Not production
          </p>
          <p className="body-text-small text-xs text-ivory/35">
            Three directions for About, Gallery, Recordings on the refreshed
            brand system.
          </p>
        </div>
      </footer>
    </div>
  );
}
