"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Sticky two-column scroll section.
 *
 * On `lg+` the left column pins to the top of the viewport while the
 * right column scrolls past — a classic editorial / luxury landing
 * pattern (Aesop, Apple Pro, Linear). On smaller breakpoints the layout
 * collapses to a normal stacked section so mobile readers don't get a
 * forced scroll-jacked experience.
 *
 * The pinned column also receives a parallax `y` offset that scrubs
 * against the section's scroll progress, plus a sand progress rail on
 * the left edge that fills as the user advances through the section.
 */
interface StickySectionProps {
  readonly id?: string;
  readonly className?: string;
  /** Background utility class(es) for the outer `<section>`. */
  readonly sectionClassName?: string;
  /** Optional decorative layers rendered absolutely behind content. */
  readonly background?: ReactNode;
  /** The pinned column. Renders inside an inner sticky container. */
  readonly aside: ReactNode;
  /** The scrolling column. Children stack vertically with their own spacing. */
  readonly children: ReactNode;
  /** Above and below the columns (full-width). */
  readonly footer?: ReactNode;
  /**
   * Vertical sticky top offset on lg+, in pixels. Default 96 (matches the
   * header height plus a little breathing room).
   */
  readonly stickyTop?: number;
  /** When true, the aside is on the right; default false (aside left). */
  readonly asideOnRight?: boolean;
}

export function StickySection({
  id,
  className,
  sectionClassName,
  background,
  aside,
  children,
  footer,
  stickyTop = 96,
  asideOnRight = false,
}: StickySectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Pinned column drifts a touch against scroll for parallax depth.
  const asideY = useTransform(scrollYProgress, [0, 1], ["-3%", "3%"]);
  // Progress rail on the section edge.
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className={cn("relative overflow-hidden", sectionClassName)}
    >
      {background}

      {/* Sand progress rail — pinned to the left edge of the section,
       * fills as the section scrolls past. Hidden on mobile so it
       * doesn't crowd the narrow viewport. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-[3] hidden h-full w-px origin-top bg-sand/35 lg:block"
        style={{ scaleY: railScale }}
      />

      <div
        className={cn(
          "relative z-10 mx-auto grid max-w-7xl gap-y-16 px-6 py-28 md:py-40 lg:grid-cols-12 lg:gap-x-16 lg:px-12",
          className,
        )}
      >
        <motion.div
          className={cn(
            "lg:col-span-5",
            asideOnRight ? "lg:order-2" : "lg:order-1",
          )}
          style={{ y: asideY }}
        >
          <div
            className="lg:sticky"
            style={{ top: `${stickyTop}px` }}
          >
            {aside}
          </div>
        </motion.div>

        <div
          className={cn(
            "lg:col-span-7",
            asideOnRight ? "lg:order-1" : "lg:order-2",
          )}
        >
          {children}
        </div>
      </div>

      {footer ? (
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 md:pb-28 lg:px-12">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
