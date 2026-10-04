import React from "react"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CategoryFiltersProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  statusFilter: string
  onStatusChange: (val: string) => void
}

export function CategoryFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: CategoryFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search collections by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 shadow-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1  rounded-md">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Visibility:</span>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs gap-1.5">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 shadow-lg text-slate-900">
              <SelectItem value="all">All Collections</SelectItem>
              <SelectItem value="visible">Visible</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
