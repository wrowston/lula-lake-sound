import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Editorial textarea. Sharp corners, thin border, transparent surface so it
 * reads like a letter rather than a chat box.
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-32 w-full rounded-none border border-sand/20 bg-transparent px-4 py-3 text-base text-foreground",
        "transition-colors outline-none placeholder:text-muted-foreground",
        "focus-visible:border-sand focus-visible:ring-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
