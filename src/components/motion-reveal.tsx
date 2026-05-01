import {
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Editorial CSS-driven reveal primitive.
 *
 * The page-level `useScrollAndReveal` observer toggles `.in-view` for these
 * classes, avoiding a JS animation runtime while preserving the existing API.
 */

const EDITORIAL_EASE = "cubic-bezier(0.16, 1, 0.3, 1)" as const;

type RevealVariant =
  | "rise"
  | "rise-blur"
  | "fade"
  | "rule"
  | "scale-in"
  | "letter";

const REVEAL_CLASS_BY_VARIANT: Record<RevealVariant, string> = {
  rise: "reveal",
  "rise-blur": "reveal-blur",
  fade: "reveal",
  rule: "reveal-rule",
  "scale-in": "reveal-blur",
  letter: "reveal-axis",
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
  readonly motionProps?: Omit<HTMLAttributes<HTMLElement>, "children" | "style">;
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
  const isRule = variant === "rule";
  const Tag = as as ElementType;
  const revealStyle: CSSProperties = {
    ...(isRule ? { transformOrigin: "left center" } : null),
    ...(delay ? { animationDelay: `${delay}s` } : null),
    ...(duration ? { animationDuration: `${duration}s` } : null),
    ...style,
  };

  return (
    <Tag
      className={cn(REVEAL_CLASS_BY_VARIANT[variant], className)}
      style={revealStyle}
      data-repeat-reveal={repeat ? "" : undefined}
      data-inherit-reveal={inheritFromParent ? "" : undefined}
      data-reveal-amount={amount}
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
  const Tag = as as ElementType;
  return (
    <Tag
      className={className}
      style={style}
      data-reveal-stagger={stagger}
      data-reveal-delay={delay}
      data-reveal-amount={amount}
    >
      {children}
    </Tag>
  );
}

export const REVEAL_EASE = EDITORIAL_EASE;
