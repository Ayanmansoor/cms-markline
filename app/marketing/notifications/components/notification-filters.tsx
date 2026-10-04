"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface NotificationFiltersProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  statusFilter: string
  onStatusChange: (val: string) => void
  typeFilter: string
  onTypeChange: (val: string) => void
  onClearFilters: () => void
}

export function NotificationFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  onClearFilters
}: NotificationFiltersProps) {
  const isFiltered = searchQuery !== "" || statusFilter !== "ALL" || typeFilter !== "ALL"

  return (
    <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white mb-2">
      <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notifications by title or message content..."
              className="pl-9 text-xs border-slate-200 bg-slate-50/50 !text-black h-9"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-36 h-9 text-xs font-semibold bg-white border-slate-200 text-slate-900 cursor-pointer">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="ALL" className="text-xs font-semibold">All Statuses</SelectItem>
              <SelectItem value="SENT" className="text-xs font-semibold">Sent</SelectItem>
              <SelectItem value="SCHEDULED" className="text-xs font-semibold">Scheduled</SelectItem>
              <SelectItem value="DRAFT" className="text-xs font-semibold">Draft</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger className="w-40 h-9 text-xs font-semibold bg-white border-slate-200 text-slate-900 cursor-pointer">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="ALL" className="text-xs font-semibold">All Types</SelectItem>
              <SelectItem value="PUSH" className="text-xs font-semibold">Push</SelectItem>
              <SelectItem value="PROMOTIONAL" className="text-xs font-semibold">Promotional</SelectItem>
              <SelectItem value="ORDER_UPDATE" className="text-xs font-semibold">Order Update</SelectItem>
              <SelectItem value="ANNOUNCEMENT" className="text-xs font-semibold">Announcement</SelectItem>
              <SelectItem value="SYSTEM" className="text-xs font-semibold">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isFiltered && (
          <Button
            onClick={onClearFilters}
            variant="ghost"
            className="text-xs font-bold text-red-600 hover:text-red-700 h-9 cursor-pointer"
          >
            Clear Filters
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
