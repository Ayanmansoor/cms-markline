import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LayersIcon } from "lucide-react"

interface ProductStatsProps {
  trendData: { name: string; count: number }[]
  stockAvailability: number
}

const chartConfig = {
  availability: {
    label: "Availability (%)",
    color: "#0f172a",
  },
}

export function ProductStats({ trendData, stockAvailability }: ProductStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <Card className="border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Stock Availability</p>
            <p className="text-2xl font-bold mt-1 text-slate-900">{stockAvailability}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active items in stock</p>
          </div>
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl">
            <LayersIcon className="w-6 h-6 text-slate-900" />
          </div>
        </CardContent>
      </Card>

      <Card className="border md:col-span-2">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-muted-foreground font-medium">Stock Distribution</p>
          </div>
          {trendData && trendData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-20 w-full">
              <BarChart data={trendData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  tickFormatter={(val) => (typeof val === "string" && val.length > 10 ? `${val.slice(0, 10)}...` : val)}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-availability)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
              No trend data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
