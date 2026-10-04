import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusIcon, RefreshCw, TicketIcon } from "lucide-react"

interface CouponHeaderProps {
  onRefresh: () => void
  isFetching?: boolean
}

export function CouponHeader({ onRefresh, isFetching }: CouponHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] flex items-center gap-2">
          <TicketIcon className="w-6 h-6 text-slate-900" />
          Coupons & Promotional Codes
        </h1>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Manage promotional discount codes, validity windows, and usage limits.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isFetching}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs h-9 px-3.5 rounded-md cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-slate-500 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Link href="/coupon/create">
          <Button className="bg-slate-900 hover:bg-black text-white font-bold text-xs h-9 px-4 rounded-md shadow-xs cursor-pointer">
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Create Coupon
          </Button>
        </Link>
      </div>
    </div>
  )
}
