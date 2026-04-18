import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Editorial button styling for Lula Lake Sound.
 *
 * Per the brand guide: "buttons should feel minimal, premium and
 * restrained". We therefore keep radii at ~2px (near-sharp), prefer
 * thin borders over fills, and avoid gradients, glow, or elevation.
 * Hover states only affect colour, never scale.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[2px] border border-transparent bg-clip-padding text-sm font-medium uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-500 outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-sand text-washed-black hover:bg-warm-white focus-visible:ring-sand/40",
        outline:
          "border-sand/40 bg-transparent text-ivory hover:border-sand hover:text-warm-white focus-visible:ring-sand/30",
        secondary:
          "bg-charcoal text-ivory hover:bg-charcoal/70 focus-visible:ring-sand/30",
        ghost:
          "text-ivory/70 hover:text-sand",
        destructive:
          "bg-destructive/15 text-destructive hover:bg-destructive/25 focus-visible:ring-destructive/30",
        link:
          "normal-case tracking-normal text-sand underline-offset-4 hover:underline hover:text-warm-white",
      },
      size: {
        default:
          "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 px-3 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3.5 text-[0.75rem] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-7 text-[0.75rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9 px-0 tracking-normal",
        "icon-xs": "size-7 px-0 tracking-normal [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 px-0 tracking-normal",
        "icon-lg": "size-10 px-0 tracking-normal",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
