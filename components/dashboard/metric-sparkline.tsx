"use client"

import React from "react"
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts"
import { ChartContainer, ChartConfig } from "@/components/ui/chart"

interface MetricSparklineProps {
  data?: number[]
  color?: string
  isFill?: boolean
}

export function MetricSparkline({
  data = [10, 18, 14, 25, 32, 20, 45],
  color = "#10b981",
  isFill = true,
}: MetricSparklineProps) {
  const chartData = data.map((val, i) => ({ index: i, val }))
  const gradId = `spark-grad-${color.replace(/[^a-zA-Z0-9]/g, "")}`

  const config: ChartConfig = {
    val: {
      label: "Value",
      color: color,
    },
  }

  return (
    <div className="w-full h-full">
      <ChartContainer config={config} className="w-full h-full aspect-auto [&_.recharts-surface]:overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <YAxis domain={["dataMin - (dataMax - dataMin) * 0.1", "dataMax + (dataMax - dataMin) * 0.1"]} hide />
            <Area
              type="monotone"
              dataKey="val"
              stroke={color}
              strokeWidth={3}
              fill={isFill ? `url(#${gradId})` : "none"}
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
