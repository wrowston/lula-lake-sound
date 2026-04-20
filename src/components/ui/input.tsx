import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * Editorial text input. No rounding, no filled background — just a thin
 * bottom rule that tightens to sand on focus. Keeps forms feeling like
 * printed correspondence rather than a SaaS dashboard.
 */
const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <InputPrimitive
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 border-0 border-b border-sand/25 bg-transparent px-0 py-2 text-base text-ivory",
        "transition-colors outline-none placeholder:text-ivory/30",
        "focus-visible:border-sand focus-visible:ring-0",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:text-destructive",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
