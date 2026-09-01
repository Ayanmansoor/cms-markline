"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Clock } from "lucide-react"

interface PackageJourneyTrackerProps {
  shp: any
}

export function PackageJourneyTracker({ shp }: PackageJourneyTrackerProps) {
  const isForward = shp.shipmentType === "Forward"

  const forwardSteps = [
    { label: "Ordered", dateKey: shp.created_at, status: "Pending" },
    { label: "AWB Generated", dateKey: shp.awbCode ? shp.created_at : null, status: "AWB Generated" },
    { label: "Pickup Scheduled", dateKey: shp.pickupScheduledAt, status: "Pickup Scheduled" },
    { label: "Picked Up", dateKey: shp.pickedUpAt, status: "Picked Up" },
    { label: "In Transit", dateKey: shp.inTransitAt, status: "In Transit" },
    { label: "Out For Delivery", dateKey: shp.outForDeliveryAt, status: "Out For Delivery" },
    { label: "Delivered", dateKey: shp.deliveredAt, status: "Delivered" }
  ]

  const reverseSteps = [
    { label: "Requested", dateKey: shp.created_at, status: "Pending" },
    { label: "Scheduled", dateKey: shp.pickupScheduledAt, status: "Scheduled" },
    { label: "Pickup Requested", dateKey: shp.pickupRequestedAt, status: "Pickup Requested" },
    { label: "Picked Up", dateKey: shp.pickedUpAt, status: "Picked Up" },
    { label: "In Transit", dateKey: shp.inTransitAt, status: "In Transit" },
    { label: "Delivered to WH", dateKey: shp.deliveredAt, status: "Delivered to Warehouse" }
  ]

  const timelineSteps = isForward ? forwardSteps : reverseSteps

  const forwardPrecedence = [
    "Pending",
    "Ready To Ship",
    "AWB Generated",
    "Pickup Scheduled",
    "Picked Up",
    "In Transit",
    "Reached Destination Hub",
    "Out For Delivery",
    "Delivered"
  ]

  const reversePrecedence = [
    "Pending",
    "Scheduled",
    "Pickup Requested",
    "Picked Up",
    "In Transit",
    "Delivered to Warehouse"
  ]

  const statusPrecedence = isForward ? forwardPrecedence : reversePrecedence
  const currentStatus = isForward ? shp.shipmentStatus : shp.pickupStatus
  const currentStatusIndex = statusPrecedence.indexOf(currentStatus)

  return (
    <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
      <CardContent className="p-6">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-6">
          Package Journey Tracker
        </h3>

        {/* Desktop Horizontal Stepper */}
        <div className="hidden sm:flex justify-between items-center relative pr-4">
          <div className="absolute top-4 left-6 right-10 h-0.5 bg-slate-100 z-0">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, (currentStatusIndex / (statusPrecedence.length - 2)) * 100))}%`
              }}
            />
          </div>

          {timelineSteps.map((step, idx) => {
            const stepPrecedence = statusPrecedence.indexOf(step.status)
            const isCompleted = stepPrecedence <= currentStatusIndex && stepPrecedence !== -1
            const isCurrent = step.status === currentStatus

            const formattedDate = step.dateKey ? new Date(step.dateKey).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }) : null

            return (
              <div key={idx} className="flex flex-col items-center text-center relative z-10 w-24">
                <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                    : isCurrent
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-slate-200 text-slate-400"
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <span className={`text-[10px] font-bold mt-2 leading-tight ${isCurrent ? "text-blue-600 font-extrabold" : "text-slate-700"}`}>
                  {step.label}
                </span>
                {formattedDate && (
                  <span className="text-[8px] font-semibold text-slate-400 mt-0.5 whitespace-nowrap">
                    {formattedDate}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile Vertical Timeline */}
        <div className="flex sm:hidden flex-col gap-6 relative pl-4">
          <div className="absolute top-2 bottom-2 left-7 w-0.5 bg-slate-100" />
          {timelineSteps.map((step, idx) => {
            const stepPrecedence = statusPrecedence.indexOf(step.status)
            const isCompleted = stepPrecedence <= currentStatusIndex && stepPrecedence !== -1

            const formattedDate = step.dateKey ? new Date(step.dateKey).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }) : null

            return (
              <div key={idx} className="flex items-start gap-4 relative z-10">
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-400"
                }`}>
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{step.label}</p>
                  {formattedDate && <p className="text-[9px] text-slate-400 mt-0.5">{formattedDate}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
