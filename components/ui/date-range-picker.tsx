"use client"

import * as React from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export interface DateRangeValue {
  from?: Date
  to?: Date
  preset?: string
}

interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  className?: string
}

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7days", label: "Last 7 Days" },
  { id: "30days", label: "Last 30 Days" },
  { id: "90days", label: "Last 90 Days" },
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "all", label: "All Time" },
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [viewDate, setViewDate] = React.useState<Date>(() => value.from || new Date())
  const [tempFrom, setTempFrom] = React.useState<Date | undefined>(value.from)
  const [tempTo, setTempTo] = React.useState<Date | undefined>(value.to)
  const [activePreset, setActivePreset] = React.useState<string>(value.preset || "30days")
  const [hoverDate, setHoverDate] = React.useState<Date | undefined>(undefined)

  // Sync internal state when popover opens or prop changes
  React.useEffect(() => {
    setTempFrom(value.from)
    setTempTo(value.to)
    setActivePreset(value.preset || "30days")
    if (value.from) setViewDate(value.from)
  }, [value, open])

  // Compute preset dates
  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId)
    const now = new Date()
    let from: Date | undefined
    let to: Date | undefined = new Date()

    if (presetId === "today") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    } else if (presetId === "yesterday") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
    } else if (presetId === "7days") {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (presetId === "30days") {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (presetId === "90days") {
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    } else if (presetId === "this_month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else if (presetId === "last_month") {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    } else if (presetId === "all") {
      from = undefined
      to = undefined
    }

    setTempFrom(from)
    setTempTo(to)
    if (from) setViewDate(from)

    onChange({ from, to, preset: presetId })
    setOpen(false)
  }

  // Calendar logic
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonthDays = new Date(year, month, 0).getDate()

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleDateClick = (dayDate: Date) => {
    setActivePreset("custom")
    if (!tempFrom || (tempFrom && tempTo)) {
      setTempFrom(dayDate)
      setTempTo(undefined)
    } else if (tempFrom && !tempTo) {
      if (dayDate < tempFrom) {
        setTempFrom(dayDate)
        setTempTo(undefined)
      } else {
        const endOfDay = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999)
        setTempTo(endOfDay)
      }
    }
  }

  const isSameDay = (d1?: Date, d2?: Date) => {
    if (!d1 || !d2) return false
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
  }

  const isInRange = (date: Date) => {
    if (tempFrom && tempTo) {
      return date >= tempFrom && date <= tempTo
    }
    if (tempFrom && hoverDate && !tempTo) {
      const start = tempFrom < hoverDate ? tempFrom : hoverDate
      const end = tempFrom < hoverDate ? hoverDate : tempFrom
      return date >= start && date <= end
    }
    return false
  }

  const handleApplyCustom = () => {
    onChange({ from: tempFrom, to: tempTo, preset: "custom" })
    setOpen(false)
  }

  // Label formatting for trigger button
  const getTriggerLabel = () => {
    if (activePreset && activePreset !== "custom") {
      const match = PRESETS.find((p) => p.id === activePreset)
      if (match) return match.label
    }

    if (tempFrom && tempTo) {
      const format = (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      return `${format(tempFrom)} - ${format(tempTo)}`
    }

    if (tempFrom) {
      return `From ${tempFrom.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    }

    return "Select Date Range"
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Build grid days
  const calendarCells = []

  // Padding days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i
    const date = new Date(year, month - 1, dayNum)
    calendarCells.push({ date, isCurrentMonth: false, dayNum })
  }

  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    calendarCells.push({ date, isCurrentMonth: true, dayNum: i })
  }

  // Fill remaining trailing days to make 6 rows (42 cells)
  const remainingCells = 42 - calendarCells.length
  for (let i = 1; i <= remainingCells; i++) {
    const date = new Date(year, month + 1, i)
    calendarCells.push({ date, isCurrentMonth: false, dayNum: i })
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer group px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors select-none">
            <CalendarIcon className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-900 transition-colors" />
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
              {getTriggerLabel()}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[540px] p-0 shadow-xl border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="flex divide-x divide-slate-100">
            {/* Presets Sidebar */}
            <div className="w-40 p-3 bg-slate-50/70 space-y-0.5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 capitalize tracking-wider px-2 mb-2">Presets</p>
                {PRESETS.map((preset) => {
                  const isActive = activePreset === preset.id
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-between transition-colors ${isActive
                          ? "bg-blue-50 text-blue-600 font-bold"
                          : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                        }`}
                    >
                      <span>{preset.label}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                  )
                })}
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <button
                  onClick={() => handlePresetSelect("all")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-between transition-colors ${activePreset === "all"
                      ? "bg-blue-50 text-blue-600 font-bold"
                      : "text-slate-500 hover:bg-slate-200/60 hover:text-slate-900"
                    }`}
                >
                  <span>Clear Filter</span>
                </button>
              </div>
            </div>

            {/* Interactive Calendar Grid */}
            <div className="flex-1 p-4 space-y-4">
              {/* Calendar Header Navigation */}
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-bold text-slate-900">
                  {monthNames[month]} {year}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Day of Week Labels */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="text-[11px] font-bold text-slate-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => {
                  const isStart = isSameDay(cell.date, tempFrom)
                  const isEnd = isSameDay(cell.date, tempTo)
                  const isSelected = isStart || isEnd
                  const inRange = isInRange(cell.date)

                  return (
                    <button
                      key={idx}
                      onClick={() => handleDateClick(cell.date)}
                      onMouseEnter={() => setHoverDate(cell.date)}
                      onMouseLeave={() => setHoverDate(undefined)}
                      className={`h-8 w-full rounded-md text-xs font-semibold transition-all relative flex items-center justify-center ${!cell.isCurrentMonth ? "text-slate-300" : "text-slate-700 hover:bg-slate-100"
                        } ${inRange && !isSelected ? "bg-blue-50 text-blue-700 rounded-none" : ""
                        } ${isSelected
                          ? "bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-xs z-10"
                          : ""
                        } ${isStart && tempTo ? "rounded-r-none" : ""
                        } ${isEnd && tempFrom ? "rounded-l-none" : ""
                        }`}
                    >
                      {cell.dayNum}
                    </button>
                  )
                })}
              </div>

              {/* Range Info & Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] font-semibold text-slate-500">
                  {tempFrom ? (
                    <span>
                      {tempFrom.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {tempTo ? ` - ${tempTo.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : " (Select End Date)"}
                    </span>
                  ) : (
                    <span>Select start date</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="h-7 text-xs font-semibold text-slate-600 border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyCustom}
                    className="h-7 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
