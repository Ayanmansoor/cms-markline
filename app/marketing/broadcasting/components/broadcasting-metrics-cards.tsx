"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Megaphone, Mail, Eye, Users } from "lucide-react"
import { BroadcastMetrics } from "./types"

interface BroadcastingMetricsCardsProps {
  metrics: BroadcastMetrics
}

export function BroadcastingMetricsCards({ metrics }: BroadcastingMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-3">
      {/* Total Campaigns */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-700">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider">Total Campaigns</p>
            <p className="text-xl font-bold text-slate-900">{metrics.totalCampaigns}</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Emails Sent */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider">Total Emails Sent</p>
            <p className="text-xl font-bold text-slate-900">{metrics.emailReach.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Opened */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider">Total Opened</p>
            <p className="text-xl font-bold text-slate-900">{metrics.totalOpened.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Customers */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider">Total Customers</p>
            <p className="text-xl font-bold text-slate-900">{metrics.totalCustomers.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
