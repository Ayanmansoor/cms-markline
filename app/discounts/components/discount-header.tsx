import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusIcon, RefreshCw, ZapIcon } from "lucide-react"

interface DiscountHeaderProps {
  onRefresh: () => void
  isFetching?: boolean
}

export function DiscountHeader({ onRefresh, isFetching }: DiscountHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ZapIcon className="w-5 h-5 text-primary" />
          Discount Rules & Offers
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage automated discount percentages, sale campaigns, and validity windows.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
          className="h-8 text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Link href="/discounts/create">
          <Button size="sm" className="h-8 text-xs font-medium">
            <PlusIcon className="w-3.5 h-3.5 mr-1.5" />
            Create Discount
          </Button>
        </Link>
      </div>
    </div>
  )
}
