import React from "react"
import { Button } from "@/components/ui/button"
import { ShoppingBag, PlusIcon, RefreshCw } from "lucide-react"

interface OrderHeaderProps {
  onRefresh: () => void
  onCreateOpen: () => void
  isFetching?: boolean
}

export function OrderHeader({ onRefresh, onCreateOpen, isFetching }: OrderHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          Orders & Transactions
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View customer orders, payment statuses, and fulfillment dispatches.
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
        <Button size="sm" onClick={onCreateOpen} className="h-8 text-xs font-medium">
          <PlusIcon className="w-3.5 h-3.5 mr-1.5" />
          Create Order
        </Button>
      </div>
    </div>
  )
}
