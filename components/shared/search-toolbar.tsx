import React from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchToolbarProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  extraFilters?: React.ReactNode
}

export function SearchToolbar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  extraFilters
}: SearchToolbarProps) {
  return (
    <div className={`px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white ${className}`}>
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-8 h-8 text-xs bg-slate-50/50 border-slate-200"
        />
      </div>
      {extraFilters && <div className="flex items-center gap-3">{extraFilters}</div>}
    </div>
  )
}
