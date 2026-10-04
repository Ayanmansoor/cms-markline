"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Bell, Plus, RefreshCcw } from "lucide-react"

interface NotificationHeaderProps {
  onRefresh: () => void
  onCreateClick: () => void
}

export function NotificationHeader({ onRefresh, onCreateClick }: NotificationHeaderProps) {
  return (
    <div className="space-y-4 mb-2">
      {/* Breadcrumbs */}


      {/* Heading */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] flex items-center gap-2">
            <Bell className="h-7 w-7 text-black" />
            Push Notifications (FCM)
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-1">
            Dispatch & manage Firebase push notifications, promotional announcements, and user message logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={onRefresh}
            variant="outline"
            className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Refresh Log
          </Button>
          <Button
            onClick={onCreateClick}
            className="text-xs font-bold bg-black text-white hover:bg-black/90 shadow-md cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Notification
          </Button>
        </div>
      </div>
    </div>
  )
}
