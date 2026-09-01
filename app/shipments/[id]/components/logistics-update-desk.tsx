"use client"

import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Save, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface UpdateShipmentFormValues {
  shipmentStatus: string
  pickupStatus: string
  courierName: string
  trackingNumber: string
  awbCode: string
  trackingUrl: string
  shippingLabelUrl: string
  manifestUrl: string
  invoiceUrl: string
  weight: string
  length: string
  breadth: string
  height: string
  remarks: string
}

interface LogisticsUpdateDeskProps {
  id: string
  shp: any
}

export function LogisticsUpdateDesk({ id, shp }: LogisticsUpdateDeskProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset } = useForm<UpdateShipmentFormValues>()

  // Initialize form fields once shipment data is available
  useEffect(() => {
    if (shp) {
      reset({
        shipmentStatus: shp.shipmentStatus || "Pending",
        pickupStatus: shp.pickupStatus || "Pending",
        courierName: shp.courierName || "",
        trackingNumber: shp.trackingNumber || "",
        awbCode: shp.awbCode || "",
        trackingUrl: shp.trackingUrl || "",
        shippingLabelUrl: shp.shippingLabelUrl || "",
        manifestUrl: shp.manifestUrl || "",
        invoiceUrl: shp.invoiceUrl || "",
        weight: shp.weight ? String(shp.weight) : "",
        length: shp.length ? String(shp.length) : "",
        breadth: shp.breadth ? String(shp.breadth) : "",
        height: shp.height ? String(shp.height) : "",
        remarks: shp.remarks || ""
      })
    }
  }, [shp, reset])

  // Update shipment mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/shipments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to update shipment")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Shipment tracking details saved successfully!")
      queryClient.invalidateQueries({ queryKey: ["shipmentDetail", id] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const handleUpdateLogistics = (data: UpdateShipmentFormValues) => {
    updateMutation.mutate({
      shipmentStatus: data.shipmentStatus,
      pickupStatus: data.pickupStatus,
      courierName: data.courierName || null,
      trackingNumber: data.trackingNumber || null,
      awbCode: data.awbCode || null,
      trackingUrl: data.trackingUrl || null,
      shippingLabelUrl: data.shippingLabelUrl || null,
      manifestUrl: data.manifestUrl || null,
      invoiceUrl: data.invoiceUrl || null,
      weight: data.weight ? parseFloat(data.weight) : null,
      length: data.length ? parseFloat(data.length) : null,
      breadth: data.breadth ? parseFloat(data.breadth) : null,
      height: data.height ? parseFloat(data.height) : null,
      remarks: data.remarks || null
    })
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
      <CardContent className="p-6">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-4">
          Logistics Update Desk
        </h3>

        <div className="space-y-4">
          {/* Status Fields */}
          <div className="grid grid-cols-1 gap-3.5">
            {shp.shipmentType === 'Forward' ? (
              <div>
                <label className="text-[9px] font-bold text-slate-400 tracking-wider mb-1 block">Shipment Status</label>
                <select
                  {...register("shipmentStatus")}
                  className="w-full h-9 px-2 text-xs font-semibold text-slate-900 border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Ready To Ship">Ready To Ship</option>
                  <option value="AWB Generated">AWB Generated</option>
                  <option value="Pickup Scheduled">Pickup Scheduled</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Reached Destination Hub">Reached Destination Hub</option>
                  <option value="Out For Delivery">Out For Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Returned To Warehouse">Returned To Warehouse</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="RTO">RTO</option>
                  <option value="Lost">Lost</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[9px] font-bold text-slate-400 tracking-wider mb-1 block">Pickup Status</label>
                <select
                  {...register("pickupStatus")}
                  className="w-full h-9 px-2 text-xs font-semibold text-slate-900 border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Pickup Requested">Pickup Requested</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered to Warehouse">Delivered to Warehouse</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            )}
          </div>

          {/* Tracking details */}
          <div className="space-y-3.5 border-t border-slate-100 pt-3.5">
            <div>
              <label className="text-[9px] font-bold text-slate-400 tracking-wider mb-1 block">Courier Partner</label>
              <Input
                {...register("courierName")}
                placeholder="e.g. Delhivery, Shiprocket"
                className="h-9 text-xs border-slate-200 !text-black shadow-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-[9px] font-bold text-slate-400 tracking-wider mb-1 block">AWB Code</label>
                <Input
                  {...register("awbCode")}
                  placeholder="AWB Code"
                  className="h-9 text-xs border-slate-200 !text-black shadow-sm"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 tracking-wider mb-1 block">Tracking Number</label>
                <Input
                  {...register("trackingNumber")}
                  placeholder="Tracking ID"
                  className="h-9 text-xs border-slate-200 !text-black shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 tracking-wider mb-1 block">Tracking URL</label>
              <Input
                {...register("trackingUrl")}
                placeholder="https://track.courier.com"
                className="h-9 text-xs border-slate-200 !text-black shadow-sm"
              />
              {shp.trackingUrl && (
                <a
                  href={shp.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1 justify-end"
                >
                  Track on Carrier site <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>

          {/* Dimensions & weight */}
          <div className="space-y-2 border-t border-slate-100 pt-3.5">
            <label className="text-[9px] font-bold text-slate-400 tracking-wider block">Dimensions & Weight</label>
            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2 border border-slate-200 rounded-lg">
              <div>
                <span className="text-[8px] font-bold text-slate-400 block mb-0.5">W (kg)</span>
                <Input
                  type="number"
                  step="0.01"
                  {...register("weight")}
                  className="h-7 text-[10px] border-slate-200 p-1 bg-white !text-black shadow-sm"
                />
              </div>
              <div>
                <span className="text-[8px] font-bold text-slate-400 block mb-0.5">L (cm)</span>
                <Input
                  type="number"
                  step="0.1"
                  {...register("length")}
                  className="h-7 text-[10px] border-slate-200 p-1 bg-white !text-black shadow-sm"
                />
              </div>
              <div>
                <span className="text-[8px] font-bold text-slate-400 block mb-0.5">B (cm)</span>
                <Input
                  type="number"
                  step="0.1"
                  {...register("breadth")}
                  className="h-7 text-[10px] border-slate-200 p-1 bg-white !text-black shadow-sm"
                />
              </div>
              <div>
                <span className="text-[8px] font-bold text-slate-400 block mb-0.5">H (cm)</span>
                <Input
                  type="number"
                  step="0.1"
                  {...register("height")}
                  className="h-7 text-[10px] border-slate-200 p-1 bg-white !text-black shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Shipping document links */}
          <div className="space-y-3.5 border-t border-slate-100 pt-3.5">
            <div>
              <label className="text-[9px] font-bold text-slate-400 tracking-wider mb-1 block">Label Document Link</label>
              <Input
                {...register("shippingLabelUrl")}
                placeholder="PDF Label URL"
                className="h-9 text-xs border-slate-200 !text-black shadow-sm"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 tracking-wider mb-1 block">Manifest Document Link</label>
              <Input
                {...register("manifestUrl")}
                placeholder="PDF Manifest URL"
                className="h-9 text-xs border-slate-200 !text-black shadow-sm"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 tracking-wider mb-1 block">Invoice Document Link</label>
              <Input
                {...register("invoiceUrl")}
                placeholder="PDF Invoice URL"
                className="h-9 text-xs border-slate-200 !text-black shadow-sm"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="border-t border-slate-100 pt-3.5">
            <label className="text-[9px] font-bold text-slate-400 tracking-wider mb-1 block">Internal Remarks</label>
            <textarea
              {...register("remarks")}
              placeholder="Logistics team notes..."
              className="w-full h-16 p-2.5 text-xs font-semibold text-slate-800 bg-slate-50/50 border border-slate-200 rounded-md outline-none resize-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <Button
            disabled={updateMutation.isPending}
            onClick={handleSubmit(handleUpdateLogistics)}
            className="w-full h-9 text-xs font-bold bg-black text-white hover:bg-black/90 shadow-sm"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Details
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
