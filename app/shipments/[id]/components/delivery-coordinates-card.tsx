"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"

interface DeliveryCoordinatesCardProps {
  shp: any
}

export function DeliveryCoordinatesCard({ shp }: DeliveryCoordinatesCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
      <CardContent className="p-6">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-4">
          Delivery Coordinates
        </h3>
        <div className="space-y-3.5 text-xs font-semibold">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">Customer</p>
            <p className="text-slate-900 font-extrabold">{shp.customerName}</p>
            <p className="text-slate-500 font-medium">{shp.customerEmail}</p>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400" /> Shipping Destination
            </p>
            <p className="text-slate-800 text-xs font-bold leading-normal">{shp.shippingAddress}</p>
            <p className="text-slate-500 font-medium mt-1">Phone: {shp.recipientPhone}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
