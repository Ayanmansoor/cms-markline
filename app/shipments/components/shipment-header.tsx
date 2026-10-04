import React from "react"
import { Button } from "@/components/ui/button"
import { Truck, Plus, RefreshCcw } from "lucide-react"

interface ShipmentHeaderProps {
  onRefresh: () => void
  onCreateOpen: () => void
  isFetching?: boolean
}

export function ShipmentHeader({ onRefresh, onCreateOpen, isFetching }: ShipmentHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          Shipments & Fulfillment
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage package dispatch, courier tracking, and warehouse fulfillment operations.
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
          <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button size="sm" onClick={onCreateOpen} className="h-8 text-xs font-medium">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Create Shipment
        </Button>
      </div>
    </div>
  )
}
