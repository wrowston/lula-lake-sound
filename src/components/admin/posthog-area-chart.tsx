"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { PostHogAnalyticsSeries } from "@/lib/posthog-server";

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

type TooltipPayload = {
  readonly value?: number | string;
};

function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

function PostHogChartTooltip({
  active,
  payload,
  label,
}: {
  readonly active?: boolean;
  readonly payload?: readonly TooltipPayload[];
  readonly label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  const value = Number(payload[0]?.value ?? 0);

  return (
    <div className="min-w-28 rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-popover-foreground">{formatDate(label)}</p>
      <p className="text-muted-foreground">
        {numberFormatter.format(Number.isFinite(value) ? value : 0)}
      </p>
    </div>
  );
}

export function PostHogAreaChart({
  series,
  color,
}: {
  readonly series: PostHogAnalyticsSeries;
  readonly color: string;
}) {
  const total = series.data.reduce((sum, point) => sum + point.value, 0);
  const chartConfig = {
    value: {
      label: series.label,
      color,
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="headline-secondary text-sm text-foreground">
          {series.label}
        </CardTitle>
        <CardDescription>{series.description}</CardDescription>
        <p className="headline-primary text-3xl text-foreground">
          {numberFormatter.format(total)}
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer
          aria-label={`${series.label} by day, ${series.description}`}
          className="aspect-auto h-56 w-full"
          config={chartConfig}
          role="img"
        >
          <AreaChart accessibilityLayer data={series.data}>
            <defs>
              <linearGradient
                id={`fill-${series.label.replace(/\W+/g, "-").toLowerCase()}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.45}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              minTickGap={24}
              tickFormatter={formatDate}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip content={<PostHogChartTooltip />} cursor={false} />
            <Area
              dataKey="value"
              fill={`url(#fill-${series.label.replace(/\W+/g, "-").toLowerCase()})`}
              fillOpacity={1}
              name={series.label}
              stroke="var(--color-value)"
              strokeWidth={2}
              type="linear"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
