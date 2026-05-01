"use client"

import * as React from "react"
import { ResponsiveContainer } from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    color?: string
  }
>

function ChartContainer({
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  readonly config: ChartConfig
  readonly children: React.ReactElement
}) {
  const chartId = React.useId()

  return (
    <div
      data-chart={chartId}
      data-slot="chart"
      className={cn(
        "flex aspect-video justify-center text-xs text-muted-foreground",
        "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
        "[&_.recharts-cartesian-grid_line]:stroke-border/60",
        "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
        "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
        "[&_.recharts-layer]:outline-none",
        "[&_.recharts-sector]:outline-none",
        "[&_.recharts-surface]:outline-none",
        className,
      )}
      style={Object.fromEntries(
        Object.entries(config).flatMap(([key, value]) =>
          value.color ? [[`--color-${key}`, value.color]] : [],
        ),
      )}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

export { ChartContainer }
