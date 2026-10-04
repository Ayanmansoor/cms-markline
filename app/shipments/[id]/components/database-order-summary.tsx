"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import { getFulfillmentStatusBadge } from "@/lib/utils"

interface DatabaseOrderSummaryProps {
  shp: any
  formatCurrency: (val: number) => string
}

export function DatabaseOrderSummary({ shp, formatCurrency }: DatabaseOrderSummaryProps) {
  if (!shp.order) return null

  const ffBadge = getFulfillmentStatusBadge(shp.order.fulfillmentStatus)

  return (
    <Card className="border-slate-200/80 bg-white shadow-2xs rounded-2xl">
      <CardContent className="p-6">
        <h3 className="text-xs font-bold text-slate-700 tracking-wider mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-600" />
          Order & Payment Details (Database)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold mb-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-0.5">Payment Status</p>
            <Badge variant="outline" className={`text-[10px] font-extrabold ${
              shp.order.paymentStatus === 'PAID'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {shp.order.paymentStatus || 'PENDING'}
            </Badge>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-0.5">Fulfillment Status</p>
            <Badge variant="outline" className={`text-[10px] ${ffBadge.className}`}>
              {ffBadge.label}
            </Badge>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-0.5">Payment Method</p>
            <p className="text-slate-800 font-bold">{shp.order.paymentMethod || 'COD'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-0.5">Grand Total</p>
            <p className="text-slate-900 font-extrabold text-sm">{formatCurrency(shp.order.grandTotal || 0)}</p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2 text-xs font-semibold text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-slate-800">{formatCurrency(shp.order.subtotal || 0)}</span>
          </div>
          {shp.order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>-{formatCurrency(shp.order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping Charge</span>
            <span className="text-slate-800">{formatCurrency(shp.order.shippingCharge || 0)}</span>
          </div>
          {shp.order.taxAmount > 0 && (
            <div className="flex justify-between">
              <span>Tax Amount</span>
              <span className="text-slate-800">{formatCurrency(shp.order.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-slate-900">
            <span>Grand Total</span>
            <span>{formatCurrency(shp.order.grandTotal || 0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
