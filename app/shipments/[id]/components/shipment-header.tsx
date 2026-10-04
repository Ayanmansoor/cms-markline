"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Truck, Printer, FileText, Loader2, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ShipmentHeaderProps {
  shp: any
  onOpenCourierSheet: () => void
}

export function ShipmentHeader({ shp, onOpenCourierSheet }: ShipmentHeaderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isScheduling, setIsScheduling] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

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

  const cancelOrderMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/orders/${shp.orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelReason: reason })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to cancel order")
      return data
    },
    onSuccess: (data) => {
      toast.success(data.message || "Order and shipment successfully cancelled.")
      setIsCancelOpen(false)
      queryClient.invalidateQueries({ queryKey: ["shipmentDetail", String(shp.id)] })
      queryClient.invalidateQueries({ queryKey: ["order-shipments", String(shp.orderId)] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
    onError: (err: any) => toast.error(err.message || "Failed to cancel order")
  })

  const handleSchedulePickup = () => {
    schedulePickupMutation.mutate()
  }

  const isCancelled = shp.shipmentStatus === 'Cancelled'
  const isHandedOver = ['Picked Up', 'In Transit', 'Reached Destination Hub', 'Out For Delivery', 'Delivered'].includes(shp.shipmentStatus)
  const canCancel = !isCancelled && !isHandedOver

  const showScheduleButton = !!shp.awbCode &&
    !!shp.shipmentId &&
    !['Pickup Scheduled', 'Picked Up', 'In Transit', 'Reached Destination Hub', 'Out For Delivery', 'Delivered', 'Cancelled'].includes(shp.shipmentStatus)

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
              {isCancelled && (
                <Badge className="text-[10px] font-extrabold bg-red-100 text-red-700 hover:bg-red-100/90 border border-red-200">
                  Cancelled
                </Badge>
              )}
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">
              Linked to Order <Link href={`/orders/${shp.orderId}`} className="text-blue-600 font-bold hover:underline">{shp.displayOrderId}</Link>
            </p>
          </div>
        </div>

        {/* Quick printable document downloads & Ship Now / Schedule Pickup buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!shp.awbCode && !isCancelled && (
            <Button
              onClick={onOpenCourierSheet}
              className="h-8 text-xs font-bold bg-slate-900 hover:bg-black text-white shadow-2xs"
            >
              <Truck className="mr-1.5 h-3.5 w-3.5" /> Ship Now
            </Button>
          )}

          {showScheduleButton && (
            <Button
              onClick={handleSchedulePickup}
              disabled={isScheduling}
              className="h-8 text-xs font-bold bg-slate-900 hover:bg-black text-white shadow-2xs"
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

          {canCancel && (
            <Button
              onClick={() => setIsCancelOpen(true)}
              variant="outline"
              className="h-8 text-xs font-bold text-red-600 border-red-200 bg-red-50 hover:bg-red-100 shadow-2xs gap-1.5 cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel Order & Shipment
            </Button>
          )}

          {shp.shippingLabelUrl && (
            <Button asChild variant="outline" className="h-8 text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50">
              <a href={shp.shippingLabelUrl} target="_blank" rel="noreferrer">
                <Printer className="mr-1.5 h-3.5 w-3.5" /> Shipping Label
              </a>
            </Button>
          )}
          {shp.manifestUrl && (
            <Button asChild variant="outline" className="h-8 text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50">
              <a href={shp.manifestUrl} target="_blank" rel="noreferrer">
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Manifest PDF
              </a>
            </Button>
          )}
          {shp.invoiceUrl && (
            <Button asChild variant="outline" className="h-8 text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50">
              <a href={shp.invoiceUrl} target="_blank" rel="noreferrer">
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Commercial Invoice
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[440px] bg-white border border-slate-200 text-slate-900 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Cancel Order & Shipment?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">
              This package has not been handed over to the courier yet. Cancelling will cancel the order in Shiprocket, cancel the AWB, and update the order & shipment status to Cancelled.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Cancellation Reason (Optional)</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation before courier pickup..."
              className="w-full h-20 p-3 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-red-300 focus:border-red-400 resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCancelOpen(false)}
              className="text-xs font-bold border-slate-200 text-slate-700 rounded-xl cursor-pointer"
            >
              Keep Shipment
            </Button>
            <Button
              onClick={() => cancelOrderMutation.mutate(cancelReason || "Cancelled by admin from shipment details")}
              disabled={cancelOrderMutation.isPending}
              className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5 rounded-xl cursor-pointer"
            >
              {cancelOrderMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

