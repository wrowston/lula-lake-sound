import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Lula Lake Sound Button.
 *
 * Editorial, near-square corners and generous horizontal padding to read more
 * like a printed card than a SaaS CTA. Default stays sand-on-washed-black
 * for the marketing shell. Outline / ghost use shadcn semantic tokens so the
 * Studio CMS light theme keeps readable contrast (sand-on-cream was failing
 * WCAG for controls).
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center",
    "rounded-none border bg-clip-padding text-xs font-semibold uppercase",
    "tracking-[0.22em] whitespace-nowrap transition-colors duration-500",
    "outline-none select-none ease-[cubic-bezier(0.16,1,0.3,1)]",
    "focus-visible:ring-2 focus-visible:ring-offset-0",
    "focus-visible:ring-[color-mix(in_oklab,var(--color-gold)_70%,transparent)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Solid sand on washed-black — primary CTA. */
        default:
          "border-transparent bg-sand text-washed-black hover:bg-warm-white",
        /** Theme-aware stroke; sand on dark site, rust on light CMS. */
        outline:
          "border-primary/55 bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        /** Rust ink on sand — used when you need richer brand tone. */
        secondary:
          "border-transparent bg-rust text-warm-white hover:bg-maroon",
        /** Type-only, with a thin underline reveal on hover. */
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-[6px]",
        /**
         * Gold-on-washed-black emphasis. Reserved for single moments of
         * recommendation/selection per brand guide §3.2 (Gold is an accent
         * for emphasis only). Used on the "Recommended" pricing CTA.
         */
        "accent-gold":
          "border-transparent bg-gold text-washed-black hover:bg-warm-white",
        /** Hard accent — use sparingly per brand guidance. */
        destructive:
          "border-transparent bg-fire/90 text-warm-white hover:bg-fire",
        link:
          "border-transparent h-auto px-0 text-primary underline underline-offset-[6px] decoration-primary/40 hover:decoration-primary",
      },
      size: {
        default: "h-10 px-6 py-2 gap-2",
        xs: "h-7 px-3 text-[10px] tracking-[0.24em] gap-1.5",
        sm: "h-9 px-5 text-[11px] tracking-[0.22em] gap-1.5",
        lg: "h-11 px-8 gap-2",
        xl: "h-12 px-10 text-[13px] tracking-[0.22em] gap-2",
        icon: "size-9",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
