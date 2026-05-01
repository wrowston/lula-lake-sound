"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Fixed editorial section rail anchored to the right edge of the viewport.
 *
 * - A vertical sand hairline whose `scaleY` tracks document scroll
 *   progress (`useScroll`).
 * - A row of micro labels for each homepage section. The active label
 *   warms to sand and stretches its leading rule when its target
 *   section's `<section>` is closest to the viewport center.
 *
 * Implementation rules:
 * - `useEffect` is forbidden by project convention. Active-section state
 *   is set inside an `IntersectionObserver` mounted via a ref callback.
 * - Hidden below `lg` so narrow viewports stay uncluttered.
 */
const SECTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "hero", label: "Refuge" },
  { id: "the-space", label: "Space" },
  { id: "equipment-specs", label: "Gear" },
  { id: "services-pricing", label: "Rates" },
  { id: "local-favorites", label: "Nearby" },
  { id: "faq", label: "FAQ" },
  { id: "artist-inquiries", label: "Contact" },
];

export function SectionRail() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeIdRef = useRef<string>(SECTIONS[0].id);
  const { scrollYProgress } = useScroll();
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  activeIdRef.current = activeId;

  const observeSections = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (!node) return;

    const targets = SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) {
      return;
    }

    let observer: IntersectionObserver | null = null;
    const visibility = new Map<string, number>();

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(
            entry.target.id,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        }
        const currentActive = activeIdRef.current;
        let bestId = currentActive;
        let bestRatio = -1;
        visibility.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });
        if (bestRatio > 0 && bestId !== currentActive) {
          setActiveId(bestId);
        }
      },
      {
        rootMargin: "-30% 0px -50% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );
    for (const target of targets) {
      observer.observe(target);
    }

    return () => observer?.disconnect();
  }, []);

  function handleJump(id: string) {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div
      ref={observeSections}
      aria-hidden
      className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
    >
      <div className="relative flex flex-col items-end gap-5 pl-12">
        <span
          aria-hidden
          className="absolute right-[5px] top-0 h-full w-px bg-sand/12"
        />
        <motion.span
          aria-hidden
          className="absolute right-[5px] top-0 h-full w-px origin-top bg-sand/65"
          style={{ scaleY: railScale }}
        />
        {SECTIONS.map((section) => {
          const isActive = section.id === activeId;
          const ruleStyle: CSSProperties = {
            width: isActive ? 28 : 12,
            backgroundColor: isActive
              ? "rgba(198,189,160,0.85)"
              : "rgba(198,189,160,0.25)",
          };
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => handleJump(section.id)}
              className={cn(
                "pointer-events-auto group flex items-center gap-3 text-right transition-colors duration-500",
                isActive ? "text-sand" : "text-ivory/40 hover:text-sand",
              )}
            >
              <span
                className={cn(
                  "label-text text-[9px] tracking-[0.28em] transition-opacity duration-500",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
              >
                {section.label}
              </span>
              <span
                aria-hidden
                style={ruleStyle}
                className="block h-px transition-[width,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
              <span
                aria-hidden
                className={cn(
                  "block size-[7px] rounded-full border transition-all duration-500",
                  isActive
                    ? "border-sand bg-sand"
                    : "border-sand/35 bg-transparent group-hover:border-sand",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
