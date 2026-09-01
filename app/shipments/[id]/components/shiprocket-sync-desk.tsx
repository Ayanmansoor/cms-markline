"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Truck } from "lucide-react"

interface ShiprocketSyncDeskProps {
  shp: any
  formatCurrency: (val: number) => string
}

export function ShiprocketSyncDesk({ shp, formatCurrency }: ShiprocketSyncDeskProps) {
  // if (!shp.shiprocketOrderDetails) return null

  const sr = shp.shiprocketOrderDetails
  const srShipment = Array.isArray(sr.shipments) ? sr.shipments[0] : sr.shipments
  const awbCode = srShipment?.awb || sr.awb_data?.awb || null
  const courier = srShipment?.courier || null
  const shipStatus = srShipment?.status || null

  console.log('srShipment', sr);

  return (
    <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
      <CardContent className="p-6">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-4 flex items-center gap-2">
          <Truck className="h-4 w-4 text-blue-600" />
          Shiprocket Sync Desk (Live API)
        </h3>

        <div className="space-y-4">
          {/* Status Highlights */}
          <div className="grid grid-cols-2 gap-3.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
            <div>
              <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Order Status</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {sr.status}
              </span>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Shipment Status</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {shipStatus || 'PENDING'}
              </span>
            </div>
          </div>

          {/* Order info details */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 tracking-wider mb-2 border-b border-slate-100 pb-1">Order Details</h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold">
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Shiprocket Order ID</p>
                <p className="text-slate-900 font-extrabold">#{sr.id}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Channel Order Ref</p>
                <p className="text-slate-800 font-bold">{sr.channel_order_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Payment Method</p>
                <p className="text-slate-800 font-bold">{sr.payment_method || 'Prepaid'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Live Total Value</p>
                <p className="text-emerald-700 font-extrabold">{formatCurrency(parseFloat(sr.total) || 0)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Source Channel</p>
                <p className="text-slate-700 font-bold">{sr.channel_name || 'MANUAL'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Sync Created Date</p>
                <p className="text-slate-600 font-medium">{sr.created_at || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Logistics details */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 tracking-wider mb-2 border-b border-slate-100 pb-1">Logistics Info</h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold">
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Shipment ID</p>
                <p className="text-slate-800 font-bold">{srShipment?.id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Assigned AWB</p>
                <p className="text-slate-900 font-mono font-bold">{awbCode || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Courier Carrier</p>
                <p className="text-slate-800 font-bold">{courier || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Package Dimensions</p>
                <p className="text-slate-600 font-medium">
                  {srShipment?.dimensions || sr.others?.dimensions || 'N/A'} (cm)
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Volumetric Weight</p>
                <p className="text-slate-600 font-medium">
                  {srShipment?.volumetric_weight || 'N/A'} kg
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">Exchange / Return</p>
                <p className="text-slate-600 font-medium">{sr.is_return ? 'Yes (Reverse)' : 'No (Forward)'}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
