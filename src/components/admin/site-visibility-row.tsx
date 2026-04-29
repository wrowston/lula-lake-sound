"use client"

import type { ReactNode } from "react"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export type SiteVisibilityRowProps = {
  id: string
  title: string
  /** Supporting copy; inline `<code>` picks up muted chip styling. */
  description: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

/**
 * Marketing site visibility toggle — switch + status on the left, title + helper
 * on the right.
 */
export function SiteVisibilityRow({
  id,
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: SiteVisibilityRowProps) {
  return (
    <div className="flex flex-col gap-4 py-1 sm:flex-row sm:items-center sm:gap-8 sm:py-0.5">
      <div className="flex items-center gap-3">
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
        <label
          htmlFor={id}
          className={cn(
            "cursor-pointer text-xs font-semibold tabular-nums tracking-wide",
            checked ? "text-primary" : "text-muted-foreground",
          )}
        >
          {checked ? "Visible" : "Hidden"}
        </label>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-acumin text-sm text-foreground">{title}</p>
        <div className="body-text-small text-pretty text-muted-foreground leading-relaxed [&_code]:rounded-sm [&_code]:bg-muted/70 [&_code]:px-1 [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.7rem]">
          {description}
        </div>
      </div>
    </div>
  )
}
