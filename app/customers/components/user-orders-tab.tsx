"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface UserOrdersTabProps {
  orders: any[]
  formatCurrency: (val: number) => string
  renderEmptyState: () => React.ReactNode
}

export function UserOrdersTab({ orders, formatCurrency, renderEmptyState }: UserOrdersTabProps) {
  const router = useRouter()

  if (orders.length === 0) return <>{renderEmptyState()}</>

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-[#f8fafc]">
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="h-11 text-xs font-semibold text-slate-600 pl-6">Order ID</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600">Date</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600">Product Details</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600 text-center">Delivery</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600 text-center">Payment</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600 text-center">Items Qty</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600 text-right px-6">Total Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order: any) => {
            const items = order.order_items || []
            const totalQty = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
            const firstItem = items[0]

            return (
              <TableRow
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer"
              >
                <TableCell className="px-6 py-4">
                  <span className="text-xs font-mono font-bold text-slate-700 block line-clamp-1 w-20">{order.id}</span>
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-xs font-semibold text-slate-600">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit'
                    })}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    {firstItem?.product?.image_url && (
                      <div className="h-9 w-9 border border-slate-200 rounded-md overflow-hidden bg-slate-50 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={firstItem.product.image_url} alt={firstItem.product?.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 block">
                        {firstItem?.product?.name || `Product ID: ${firstItem?.product_id}`}
                        {items.length > 1 && (
                          <span className="text-slate-400 font-normal"> +{items.length - 1} more</span>
                        )}
                      </span>
                      {(firstItem?.color || firstItem?.size) && (
                        <span className="text-[10px] font-semibold text-slate-400 block capitalize">
                          {firstItem.color}
                          {firstItem.size && ` • Size ${firstItem.size}`}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-center">
                  <Badge variant="outline" className={`text-[9px] font-bold tracking-wide rounded-md px-2 py-0.5 ${
                    order.fulfillment_status === 'DELIVERED' 
                      ? 'bg-green-50 text-green-600 border-green-200' 
                      : order.fulfillment_status === 'SHIPPED'
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : order.fulfillment_status === 'CANCELLED'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {order.fulfillment_status || 'PENDING'}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-center">
                  <Badge variant="outline" className={`text-[9px] font-bold tracking-wide rounded-md px-2 py-0.5 ${
                    order.payment_status === 'PAID' || order.payment_status === 'SUCCESS' || order.payment_status === 'COMPLETED'
                      ? 'bg-green-50 text-green-600 border-green-200' 
                      : order.payment_status === 'FAILED'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {order.payment_status || 'PENDING'}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-center">
                  <span className="text-xs font-semibold text-slate-700">{totalQty}</span>
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <span className="text-xs font-black text-slate-900">{formatCurrency(parseFloat(order.grand_total || '0'))}</span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
