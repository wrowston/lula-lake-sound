"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { revealDelay } from "@/lib/reveal-delay";
import { cn } from "@/lib/utils";

/**
 * Shared editorial banner used at the top of every inner marketing page
 * (About, Recordings, Gallery, …).
 *
 * Style direction (client direction, 2026-04-27):
 *  - Flat washed-black ground, no hero imagery.
 *  - Small uppercase eyebrow at top.
 *  - Massive Acumin Wide Semibold title, left-aligned, balanced wrap.
 *  - Bottom rule (short divider) + uppercase meta line.
 *  - Optional breadcrumb back link above the eyebrow.
 *  - Optional aside slot (e.g. gallery filter pills) anchored to the
 *    bottom-right next to the meta line on desktop.
 *
 * The component is intentionally flat — no background image, no overlay —
 * so it reads like a printed cover page rather than a marketing hero.
 */

interface PageHeaderProps {
  /** Small eyebrow line, e.g. "About the studio". Rendered uppercase. */
  readonly eyebrow: string;
  /** Display title, e.g. "Lula Lake Sound". Wraps freely. */
  readonly title: string;
  /**
   * Bottom-rule meta line, e.g. "Lookout Mountain, TN — Est. 2019". Rendered
   * uppercase. Omit to skip the divider row.
   */
  readonly meta?: string;
  /** Optional breadcrumb-style back link href. */
  readonly backHref?: string;
  /** Label for the back link. Defaults to "← Lula Lake Sound". */
  readonly backLabel?: string;
  /**
   * Optional aside content rendered next to the meta line on desktop and
   * stacked above it on mobile. Used by the gallery to host its filter
   * pills.
   */
  readonly aside?: ReactNode;
  /** Stable id used by `aria-labelledby` on the surrounding section. */
  readonly titleId?: string;
  /**
   * `hero` — largest cover title. `about` / `standard` — tuned for longer hero
   * titles on inner marketing pages (Gallery uses `about` + compact density).
   */
  readonly titleSize?: "hero" | "about" | "standard";
  /**
   * `compact` — tighter vertical padding and spacing so below-the-fold content
   * (e.g. gallery grids) lands sooner.
   */
  readonly density?: "default" | "compact";
}

const TITLE_FONT_SIZE: Record<NonNullable<PageHeaderProps["titleSize"]>, string> =
  {
    hero: "clamp(3rem, 11vw, 8.5rem)",
    about: "clamp(2.5rem, 6vw, 5.5rem)",
    standard: "clamp(2rem, 4.5vw, 4rem)",
  };

export function PageHeader({
  eyebrow,
  title,
  meta,
  backHref,
  backLabel = "← Lula Lake Sound",
  aside,
  titleId = "page-header-title",
  titleSize = "hero",
  density = "default",
}: PageHeaderProps) {
  const compact = density === "compact";

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-washed-black px-6 md:px-16",
        compact
          ? "pb-10 pt-20 md:pb-14 md:pt-24"
          : "pb-16 pt-32 md:pb-24 md:pt-44",
      )}
      aria-labelledby={titleId}
    >
      <div className="relative mx-auto w-full max-w-7xl">
        {backHref ? (
          <nav aria-label="Breadcrumb" className={revealDelay(0)}>
            <Link
              href={backHref}
              className="label-text text-[11px] tracking-[0.2em] text-sand/60 transition-colors hover:text-sand"
            >
              {backLabel}
            </Link>
          </nav>
        ) : null}
        <p
          className={cn(
            revealDelay(1),
            "label-text text-[11px] tracking-[0.3em] text-sand/55",
            backHref &&
              (compact ? "mt-6 md:mt-8" : "mt-12 md:mt-16"),
          )}
        >
          {eyebrow}
        </p>
        <h1
          id={titleId}
          className={cn(
            revealDelay(2),
            "headline-primary text-balance leading-[0.95] text-warm-white",
            compact ? "mt-5 md:mt-7" : "mt-8 md:mt-10",
          )}
          style={{ fontSize: TITLE_FONT_SIZE[titleSize] }}
        >
          {title}
        </h1>

        {meta || aside ? (
          <div
            className={cn(
              revealDelay(3),
              "flex flex-col md:flex-row md:items-end md:justify-between",
              compact
                ? "mt-8 gap-6 md:mt-10 md:gap-10"
                : "mt-12 gap-8 md:mt-16 md:gap-12",
            )}
          >
            {meta ? (
              <div className="flex items-center gap-6">
                <span
                  aria-hidden
                  className="block h-px w-16 bg-sand/35 md:w-24"
                />
                <p className="label-text text-[11px] tracking-[0.25em] text-sand/55">
                  {meta}
                </p>
              </div>
            ) : (
              <span aria-hidden />
            )}
            {aside ? <div className="md:flex-shrink-0">{aside}</div> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
