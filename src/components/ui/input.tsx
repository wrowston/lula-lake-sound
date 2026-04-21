import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const inputVariants = {
  default: [
    "h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-base text-foreground",
    "shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm",
  ].join(" "),
  /** Marketing / contact — bottom rule only, no horizontal padding. */
  editorial: [
    "h-11 w-full min-w-0 border-0 border-b border-sand/25 bg-transparent px-0 py-2 text-base text-foreground",
    "transition-colors outline-none placeholder:text-muted-foreground",
    "focus-visible:border-sand focus-visible:ring-0",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:text-destructive",
    "md:text-sm",
  ].join(" "),
} as const

export type InputProps = React.ComponentProps<typeof InputPrimitive> & {
  variant?: keyof typeof inputVariants
}

/**
 * Shared text field. Default matches conventional CMS/dashboard forms;
 * `variant="editorial"` is the thin bottom-rule treatment for marketing.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <InputPrimitive
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(inputVariants[variant], className)}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
