import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: string | number
  trend: string
  trendType: "up" | "down"
  chart?: React.ReactNode
}

export function MetricCard({ title, value, trend, trendType, chart }: MetricCardProps) {
  const isUp = trendType === "up"
  return (
    <Card className="shadow-xs border border-slate-200/80 rounded-[20px] bg-white overflow-hidden flex flex-col group hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-6 px-6">
        <CardTitle className="text-[14px] font-semibold text-slate-500 tracking-tight">{title}</CardTitle>
        <span className={`text-[11px] font-bold ${isUp ? 'text-emerald-700 bg-emerald-50/80 border border-emerald-200/60' : 'text-rose-600 bg-rose-50/80 border border-rose-200/60'} px-2.5 py-0.5 rounded-full shadow-xs`}>
          {trend}
        </span>
      </CardHeader>
      <CardContent className="px-6 pb-0 flex-1 flex flex-col justify-end">
        <div className="text-[32px] font-extrabold text-[#0f172a] tracking-tight mb-2 leading-none">{value}</div>
      </CardContent>
      {chart && (
        <div className="w-full h-[60px] mt-1 pointer-events-none">
          {chart}
        </div>
      )}
    </Card>
  )
}
