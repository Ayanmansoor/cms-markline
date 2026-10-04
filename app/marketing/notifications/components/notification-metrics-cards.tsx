"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, Users, CheckCircle2, Eye } from "lucide-react"
import { NotificationMetrics } from "./types"

interface NotificationMetricsCardsProps {
  metrics: NotificationMetrics
}

export function NotificationMetricsCards({ metrics }: NotificationMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-2">
      {/* Total Dispatched */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Dispatched</p>
            <p className="text-xl font-bold text-slate-900">{metrics.totalCount}</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Reach */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Reach</p>
            <p className="text-xl font-bold text-slate-900">{metrics.totalReach.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Rate */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Delivery Rate</p>
            <p className="text-xl font-bold text-slate-900">{metrics.deliveryRate}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Read Rate */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Read Rate</p>
            <p className="text-xl font-bold text-slate-900">{metrics.readRate}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
