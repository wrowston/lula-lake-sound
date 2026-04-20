"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Editorial accordion.
 *
 * Minimal, print-like dividers between rows. No heavy borders, no rounded
 * cards, no shadows — just a thin sand rule and a measured chevron that
 * rotates slowly on open.
 */

function Accordion(props: AccordionPrimitive.Root.Props) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-sand/12 last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/acc flex flex-1 items-center justify-between gap-6 py-6 text-left text-ivory/85",
          "transition-colors outline-none",
          "hover:text-warm-white focus-visible:text-warm-white",
          "focus-visible:ring-0",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-sand/45 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[panel-open]/acc:rotate-180 group-data-[panel-open]/acc:text-sand"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionPanel({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-panel"
      className={cn(
        "overflow-hidden text-sm text-ivory/60",
        "data-[starting-style]:h-0 data-[ending-style]:h-0",
        "h-[var(--accordion-panel-height)] transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
      )}
      {...props}
    >
      <div className={cn("pb-8 pt-0 body-text leading-relaxed", className)}>
        {children}
      </div>
    </AccordionPrimitive.Panel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionPanel }
