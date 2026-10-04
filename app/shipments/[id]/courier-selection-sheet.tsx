"use client"

import React, { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { shipmentService } from "@/services/shipment.service"

// ─── Radial Rating Badge Component ─────────────────────────────────────────
const RatingRadial = ({ rating }: { rating: number | string }) => {
  const num = parseFloat(String(rating || "4.5"))
  const displayVal = isNaN(num) ? "4.5" : (num % 1 === 0 ? num.toString() : (num * 10) % 1 === 0 ? num.toFixed(1) : num.toFixed(2))
  const isHigh = num >= 4.0
  const isMid = num >= 3.0 && num < 4.0

  const ringColor = isHigh ? "#10b981" : isMid ? "#f59e0b" : "#94a3b8"
  const textColor = isHigh ? "text-emerald-700" : isMid ? "text-amber-700" : "text-slate-600"
  const bgColor = isHigh ? "bg-emerald-50/40" : isMid ? "bg-amber-50/40" : "bg-slate-50"

  const radius = 13
  const strokeWidth = 2.2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(Math.max(num / 5, 0), 1)
  const strokeDashoffset = circumference - pct * circumference

  return (
    <div className={`relative h-8 w-8 rounded-full flex items-center justify-center ${bgColor} shadow-2xs`}>
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeOpacity="0.2"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`text-[10px] font-extrabold tracking-tighter ${textColor} z-10`}>
        {displayVal}
      </span>
    </div>
  )
}

interface CourierSelectionSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  shipmentId: string
  shp: any
}

export function CourierSelectionSheet({
  isOpen,
  onOpenChange,
  shipmentId,
  shp
}: CourierSelectionSheetProps) {
  const queryClient = useQueryClient()
  const [activeCourierTab, setActiveCourierTab] = useState("Recommended")
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null)

  // Helper selectors for serviceability
  const rawWarehousePincode = String(
    shp?.warehouse?.pincode ||
    shp?.warehouse?.pin_code ||
    shp?.shiprocketOrderDetails?.pickup_code ||
    ""
  ).trim()

  const rawCustomerPincode = String(
    shp?.order?.address?.pincode ||
    shp?.order?.address?.pin_code ||
    shp?.order?.address?.pinCode ||
    shp?.order?.address?.postalCode ||
    shp?.shiprocketOrderDetails?.delivery_code ||
    shp?.shiprocketOrderDetails?.customer_pincode ||
    ""
  ).trim()

  const isReverse = shp?.shipmentType === 'Reverse'

  const pickupPincode = isReverse ? rawCustomerPincode : rawWarehousePincode
  const deliveryPincode = isReverse ? rawWarehousePincode : rawCustomerPincode

  const cod = shp?.order?.paymentMethod === 'COD' ? '1' : '0'
  const isReturn = isReverse ? '1' : '0'
  const weight = shp?.weight || '0.5'
  const declaredValue = String(shp?.order?.grandTotal || shp?.shiprocketOrderDetails?.total || '100')
  const srOrderId = shp?.shiprocketOrderId || shp?.shiprocketOrderDetails?.id || ''

  // Query Shiprocket Courier Serviceability via axios shipmentService
  const { data: serviceabilityRes, isLoading: isServiceabilityLoading } = useQuery({
    queryKey: ["shipmentCourierServiceability", shipmentId, pickupPincode, deliveryPincode, weight, cod, isReturn, declaredValue, srOrderId],
    queryFn: async () => {
      if (!pickupPincode || !deliveryPincode) return null
      const paramsObj = {
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        weight,
        cod,
        is_return: isReturn,
        declared_value: declaredValue,
        order_id: srOrderId || undefined
      }
      console.log("[DEBUG CourierSelectionSheet] Fetching serviceability with params:", paramsObj)
      const res = await shipmentService.getServiceability(paramsObj)
      console.log("[DEBUG CourierSelectionSheet] Serviceability raw response from API:", res)
      return res
    },
    enabled: isOpen && !!pickupPincode && !!deliveryPincode
  })

  // Filter couriers dynamically based on tabs
  const filteredCouriers = useMemo(() => {
    const list = serviceabilityRes?.data?.data?.available_courier_companies || []
    console.log("[DEBUG CourierSelectionSheet] Available courier companies:", list)
    if (activeCourierTab === "Recommended") {
      const recommendedId = serviceabilityRes?.data?.data?.shiprocket_recommended_courier_id
      console.log("[DEBUG CourierSelectionSheet] Recommended courier ID:", recommendedId)
      return [...list].sort((a: any, b: any) => {
        if (a.courier_company_id === recommendedId) return -1
        if (b.courier_company_id === recommendedId) return 1
        return (b.rating || 0) - (a.rating || 0)
      })
    }
    if (activeCourierTab === "Surface") {
      return list.filter((c: any) => c.is_surface)
    }
    if (activeCourierTab === "Air") {
      return list.filter((c: any) => !c.is_surface)
    }
    return list
  }, [serviceabilityRes, activeCourierTab])

  // Assign courier mutation via axios shipmentService
  const assignCourierMutation = useMutation({
    mutationFn: async ({ courierId, courierName }: { courierId: string; courierName: string }) => {
      console.log("[DEBUG CourierSelectionSheet] Assigning courier:", { shipmentId, courierId, courierName })
      const res = await shipmentService.assignCourier(shipmentId, { courierId, courierName })
      console.log("[DEBUG CourierSelectionSheet] Assign courier API response:", res)
      return res
    },
    onSuccess: (data) => {
      console.log("[DEBUG CourierSelectionSheet] Assign courier onSuccess data:", data)
      toast.success("Courier assigned and AWB generated successfully!")
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ["shipmentDetail", shipmentId] })
    },
    onError: (err: any) => {
      console.error("[DEBUG CourierSelectionSheet] Assign courier onError:", err)
      toast.error(err.message || "Failed to assign courier")
    },
    onSettled: () => {
      setSelectedCourierId(null)
    }
  })

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val)
  }

  // Format cutoff time to 12-hour AM/PM format
  const formatPickupTime = (cutoffTime?: string) => {
    if (!cutoffTime) return "Tomorrow"
    const lower = String(cutoffTime).toLowerCase().trim()
    if (lower.includes("am") || lower.includes("pm")) {
      return `Before ${cutoffTime}`
    }

    const parts = String(cutoffTime).split(":")
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10)
      const minutes = parts[1]
      if (!isNaN(hours)) {
        const ampm = hours >= 12 ? "PM" : "AM"
        hours = hours % 12
        hours = hours ? hours : 12
        const minutesStr = minutes ? `:${minutes}` : ""
        return `Before ${hours}${minutesStr} ${ampm}`
      }
    }
    return `Before ${cutoffTime}`
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="data-[side=right]:!max-w-6xl !w-full sm:!w-[90vw] lg:!w-[80vw] p-0 bg-[#f8fafc] border-l border-slate-200 overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between shrink-0">
            <div>
              <SheetTitle className="text-base font-black text-slate-900">Assign Courier Partner</SheetTitle>
              <SheetDescription className="text-slate-500 text-xs mt-0.5">Select serviceability couriers for shipment SHP-{shipmentId}</SheetDescription>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
            {/* Left Pane: Order details */}
            <div className="w-full md:w-72 bg-white border-r border-slate-200 p-6 space-y-6 overflow-y-auto shrink-0">
              <div>
                <h3 className="text-xs font-black text-slate-700 tracking-wider mb-3">Order Details</h3>
                <div className="space-y-4 text-xs font-semibold text-slate-700">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold mb-0.5">Pickup From</p>
                    <p className="text-slate-900 font-extrabold">{pickupPincode || 'N/A'}</p>
                    {isReverse ? (
                      shp?.order?.address && (
                        <p className="text-slate-500 font-medium">{shp.order.address.city}, {shp.order.address.state || shp.order.address.state_name}</p>
                      )
                    ) : (
                      shp?.warehouse && (
                        <p className="text-slate-500 font-medium">{shp.warehouse.city}, {shp.warehouse.state}</p>
                      )
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold mb-0.5">Deliver To</p>
                    <p className="text-slate-900 font-extrabold">{deliveryPincode || 'N/A'}</p>
                    {isReverse ? (
                      shp?.warehouse && (
                        <p className="text-slate-500 font-medium">{shp.warehouse.city}, {shp.warehouse.state}</p>
                      )
                    ) : (
                      shp?.order?.address && (
                        <p className="text-slate-500 font-medium">
                          {shp.order.address.city}, {shp.order.address.state || shp.order.address.state_name}
                        </p>
                      )
                    )}
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[10px] text-slate-400 font-bold mb-0.5">Order Value</p>
                    <p className="text-slate-900 font-extrabold text-sm">{formatCurrency(shp?.order?.grandTotal || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold mb-0.5">Payment Mode</p>
                    <p className="text-slate-900 font-extrabold">{shp?.order?.paymentMethod || 'Prepaid'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold mb-0.5">Applicable Weight</p>
                    <p className="text-slate-900 font-extrabold">{weight} Kg</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Pane: Courier Selection */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 bg-slate-50 min-h-0">
              <Tabs value={activeCourierTab} onValueChange={setActiveCourierTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
                <TabsList className="grid w-full grid-cols-4 bg-slate-200/50 p-1 border border-slate-200 rounded-lg shadow-2xs mb-4 shrink-0 max-w-md">
                  <TabsTrigger value="Recommended" className="text-xs font-bold py-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-md">Recommended</TabsTrigger>
                  <TabsTrigger value="Surface" className="text-xs font-bold py-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-md">Surface</TabsTrigger>
                  <TabsTrigger value="Air" className="text-xs font-bold py-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-md">Air</TabsTrigger>
                  <TabsTrigger value="All" className="text-xs font-bold py-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-md">All</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
                  {isServiceabilityLoading ? (
                    <div className="py-24 text-center">
                      <Loader2 className="h-8 w-8 text-slate-700 animate-spin mx-auto mb-3" />
                      <p className="text-xs font-semibold text-slate-500">Checking serviceability for route ({pickupPincode} → {deliveryPincode})...</p>
                    </div>
                  ) : filteredCouriers.length === 0 ? (
                    <div className="py-24 text-center bg-white border border-slate-200 rounded-2xl">
                      <Truck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs font-semibold text-slate-400">No couriers available for this route.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Header Columns */}
                      <div className="grid grid-cols-12 items-center px-4 text-[10px] font-bold text-slate-400 tracking-wider mb-2 gap-2">
                        <div className="col-span-4">Courier Partner</div>
                        <div className="col-span-1 text-center">Rating</div>
                        <div className="col-span-2 text-center">Expected Pickup</div>
                        <div className="col-span-2 text-center">Estimated Delivery</div>
                        <div className="col-span-1 text-right">Charges</div>
                        <div className="col-span-2 text-right">Action</div>
                      </div>

                      {filteredCouriers.map((c: any) => {
                        const isRecommended = c.courier_company_id === serviceabilityRes?.data?.data?.shiprocket_recommended_courier_id
                        const name = c.courier_name || c.name || "Courier Partner"
                        const rate = c.rate !== undefined ? c.rate : c.freight_charge
                        const rating = c.rating
                        const edd = c.estimated_delivery_days || c.edd

                        return (
                          <div
                            key={c.courier_company_id || c.id || Math.random()}
                            className={`grid grid-cols-12 items-center bg-white p-4 rounded-xl border transition-all gap-2 ${
                              isRecommended ? 'border-slate-400 shadow-2xs bg-slate-50/50' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* Courier Partner Name */}
                            <div className="col-span-4 min-w-0 pr-2">
                              <div className="flex flex-col">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
                                  {name}
                                  {isRecommended && (
                                    <Badge className="text-[8px] font-bold tracking-wide px-1.5 py-0.5 bg-slate-900 text-white hover:bg-black shrink-0">
                                      Recommended
                                    </Badge>
                                  )}
                                </span>
                                <span className="text-[10px] font-medium text-slate-500 mt-0.5 truncate">
                                  {c.is_surface ? 'Surface' : 'Air'} | Min weight: {c.min_weight || '0.5'} kg | RTO Charges: {formatCurrency(c.rto_charges || 0)}
                                </span>
                              </div>
                            </div>

                            {/* Rating */}
                            <div className="col-span-1 flex justify-center">
                              <RatingRadial rating={rating} />
                            </div>

                            {/* Expected Pickup */}
                            <div className="col-span-2 text-center">
                              <span className="text-xs font-bold text-slate-700">
                                {formatPickupTime(c.cutoff_time || c.pickup_cutoff_time)}
                              </span>
                            </div>

                            {/* Estimated Delivery */}
                            <div className="col-span-2 text-center">
                              <span className="text-xs font-bold text-slate-900">
                                {edd ? `${edd} days` : 'N/A'}
                              </span>
                            </div>

                            {/* Charges */}
                            <div className="col-span-1 text-right">
                              <span className="text-xs font-black text-slate-900">{formatCurrency(rate || 0)}</span>
                            </div>

                            {/* Ship Now Action */}
                            <div className="col-span-2 text-right">
                              {(() => {
                                const cIdStr = String(c.courier_company_id)
                                const isThisLoading = assignCourierMutation.isPending && selectedCourierId === cIdStr
                                return (
                                  <Button
                                    disabled={assignCourierMutation.isPending}
                                    onClick={() => {
                                      setSelectedCourierId(cIdStr)
                                      assignCourierMutation.mutate({ courierId: cIdStr, courierName: name })
                                    }}
                                    className="text-xs font-bold bg-slate-900 text-white hover:bg-black px-4 py-1.5 h-8 shadow-2xs cursor-pointer"
                                  >
                                    {isThisLoading ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      "Ship Now"
                                    )}
                                  </Button>
                                )
                              })()}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Tabs>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-white px-6 py-3.5 flex justify-end shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs font-bold border-slate-200">
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
