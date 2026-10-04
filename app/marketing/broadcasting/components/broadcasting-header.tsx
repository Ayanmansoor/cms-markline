"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Radio, Plus, RefreshCcw } from "lucide-react"

interface BroadcastingHeaderProps {
  onRefresh: () => void
  onCreateClick: () => void
}

export function BroadcastingHeader({ onRefresh, onCreateClick }: BroadcastingHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3 flex-wrap gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] flex items-center gap-2">
          <Radio className="h-7 w-7 text-black" />
          Email Campaigns (Nodemailer)
        </h1>
        <p className="text-slate-500 text-xs font-semibold mt-1">
          Dispatch HTML email marketing campaigns, coupons, and announcements via Nodemailer SMTP.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={onRefresh}
          variant="outline"
          className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Refresh Data
        </Button>
        <Button
          onClick={onCreateClick}
          className="text-xs font-bold bg-black text-white hover:bg-black/90 shadow-md cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Email Campaign
        </Button>
      </div>
    </div>
  )
}
