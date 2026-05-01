"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";
import { type ComponentType, type CSSProperties, type ReactNode } from "react";

/**
 * Editorial motion-driven reveal primitive.
 *
 * A thin wrapper over `motion.<tag>` that ships the project's
 * editorial easing + a small set of hand-tuned reveal variants. Keep this
 * component intentionally small — for one-off scroll scrubs, use
 * `motion/react`'s `useScroll` / `useTransform` directly inside the
 * component that owns the geometry.
 *
 * Designed to be used with `whileInView` so reveals fire as users scroll
 * sections into the viewport, not just at first paint.
 */

const EDITORIAL_EASE = [0.16, 1, 0.3, 1] as const;

type RevealVariant =
  | "rise"
  | "rise-blur"
  | "fade"
  | "rule"
  | "scale-in"
  | "letter";

const VARIANTS: Record<RevealVariant, Variants> = {
  rise: {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0 },
  },
  "rise-blur": {
    hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  rule: {
    hidden: { opacity: 0, scaleX: 0 },
    visible: { opacity: 1, scaleX: 1 },
  },
  "scale-in": {
    hidden: { opacity: 0, scale: 0.94, y: 24 },
    visible: { opacity: 1, scale: 1, y: 0 },
  },
  letter: {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
  },
};

interface MotionRevealProps {
  readonly children: ReactNode;
  readonly variant?: RevealVariant;
  /** Tag to render. Defaults to `div`. */
  readonly as?: "div" | "section" | "p" | "h2" | "h3" | "li" | "span";
  readonly className?: string;
  readonly style?: CSSProperties;
  /** Delay (seconds) before the reveal begins. */
  readonly delay?: number;
  /** Duration override (seconds). Defaults to 0.95s. */
  readonly duration?: number;
  /** Re-trigger every time the element enters the viewport. Default: false (once). */
  readonly repeat?: boolean;
  /**
   * When true, omit viewport-driven props so this node follows a parent
   * `MotionRevealGroup` stagger instead of animating on its own in-view.
   */
  readonly inheritFromParent?: boolean;
  /** Viewport amount required before triggering. Default: 0.25. */
  readonly amount?: number;
  /** Optional extra props (e.g. `id`, `role`, `aria-*`). */
  readonly motionProps?: Omit<HTMLMotionProps<"div">, "children" | "style">;
}

export function MotionReveal({
  children,
  variant = "rise",
  as = "div",
  className,
  style,
  delay = 0,
  duration = 0.95,
  repeat = false,
  inheritFromParent = false,
  amount = 0.25,
  motionProps,
}: MotionRevealProps) {
  const variants = VARIANTS[variant];
  const isRule = variant === "rule";
  const Tag = motion[as] as ComponentType<HTMLMotionProps<"div">>;
  return (
    <Tag
      className={className}
      style={{
        ...(isRule ? { transformOrigin: "left center" } : null),
        ...style,
      }}
      variants={variants}
      {...(inheritFromParent
        ? {}
        : {
            initial: "hidden" as const,
            whileInView: "visible" as const,
            viewport: {
              once: !repeat,
              amount,
              margin: "0px 0px -10% 0px",
            },
          })}
      transition={{ duration, ease: EDITORIAL_EASE, delay }}
      {...motionProps}
    >
      {children}
    </Tag>
  );
}

/**
 * Container that applies a stagger between direct `MotionReveal` children
 * (or any children using the same `hidden` / `visible` variant names).
 */
interface MotionRevealGroupProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
  /** Stagger between children (seconds). Default: 0.08. */
  readonly stagger?: number;
  /** Delay before the first child reveals (seconds). Default: 0. */
  readonly delay?: number;
  readonly amount?: number;
  readonly as?: "div" | "section" | "ul" | "ol";
}

export function MotionRevealGroup({
  children,
  className,
  style,
  stagger = 0.08,
  delay = 0,
  amount = 0.2,
  as = "div",
}: MotionRevealGroupProps) {
  const Tag = motion[as] as ComponentType<HTMLMotionProps<"div">>;
  return (
    <Tag
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount, margin: "0px 0px -10% 0px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
    >
      {children}
    </Tag>
  );
}

export const REVEAL_EASE = EDITORIAL_EASE;
