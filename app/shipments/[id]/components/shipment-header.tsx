"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Truck, Printer, FileText, Loader2 } from "lucide-react"

interface ShipmentHeaderProps {
  shp: any
  onOpenCourierSheet: () => void
}

export function ShipmentHeader({ shp, onOpenCourierSheet }: ShipmentHeaderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isScheduling, setIsScheduling] = useState(false)

  const schedulePickupMutation = useMutation({
    mutationFn: async () => {
      setIsScheduling(true)
      const res = await fetch(`/api/shipments/${shp.id}/schedule-pickup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to schedule pickup")
      }
      return res.json()
    },
    onSuccess: (data) => {
      if (data.demoMode) {
        toast.info("Pickup scheduled successfully (Simulator Mode)")
      } else {
        toast.success("Pickup scheduled successfully with Shiprocket!")
      }
      queryClient.invalidateQueries({ queryKey: ["shipmentDetail", String(shp.id)] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to schedule pickup")
    },
    onSettled: () => {
      setIsScheduling(false)
    }
  })

  const handleSchedulePickup = () => {
    schedulePickupMutation.mutate()
  }

  const showScheduleButton = !!shp.awbCode &&
    !!shp.shipmentId &&
    // !shp.pickupScheduledAt &&
    !['Pickup Scheduled', 'Picked Up', 'In Transit', 'Reached Destination Hub', 'Out For Delivery', 'Delivered', 'Cancelled'].includes(shp.shipmentStatus)


  console.log(shp, "this is order shipment");


  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center text-sm text-slate-500 mb-4 font-medium">
        <span className="hover:text-slate-900 cursor-pointer" onClick={() => router.push("/shipments")}>Shipments</span>
        <span className="mx-2">{'>'}</span>
        <span className="font-semibold text-slate-900">SHP-{shp.id}</span>
      </div>

      {/* Header Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push("/shipments")}
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 border-slate-200 text-slate-700 bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-950 flex items-center gap-2">
              Shipment Tracking SHP-{shp.id}
              <Badge className="text-[10px] font-extrabold bg-blue-100 text-blue-700 hover:bg-blue-100/90 border border-blue-200">
                {shp.shipmentType}
              </Badge>
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">
              Linked to Order <Link href={`/orders/${shp.orderId}`} className="text-blue-600 font-bold hover:underline">{shp.displayOrderId}</Link>
            </p>
          </div>
        </div>

        {/* Quick printable document downloads & Ship Now / Schedule Pickup buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!shp.awbCode && (
            <Button
              onClick={onOpenCourierSheet}
              className="text-xs font-bold bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-sm"
            >
              <Truck className="mr-1.5 h-3.5 w-3.5" /> Ship Now
            </Button>
          )}

          {showScheduleButton && (
            <Button
              onClick={handleSchedulePickup}
              disabled={isScheduling}
              className="text-xs font-bold bg-[#16a34a] hover:bg-[#15803d] text-white shadow-sm"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Truck className="mr-1.5 h-3.5 w-3.5" /> Schedule Pickup
                </>
              )}
            </Button>
          )}

          {shp.shippingLabelUrl && (
            <Button asChild variant="outline" className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50">
              <a href={shp.shippingLabelUrl} target="_blank" rel="noreferrer">
                <Printer className="mr-1.5 h-3.5 w-3.5" /> Shipping Label
              </a>
            </Button>
          )}
          {shp.manifestUrl && (
            <Button asChild variant="outline" className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50">
              <a href={shp.manifestUrl} target="_blank" rel="noreferrer">
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Manifest PDF
              </a>
            </Button>
          )}
          {shp.invoiceUrl && (
            <Button asChild variant="outline" className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50">
              <a href={shp.invoiceUrl} target="_blank" rel="noreferrer">
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Commercial Invoice
              </a>
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

