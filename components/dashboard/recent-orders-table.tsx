"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ShoppingBag } from "lucide-react"

export interface OrderItem {
  id: string
  rawId?: string
  name: string
  productName?: string
  amount: string
  status: string
  initials: string
  avatarBg: string
  avatarText: string
  imgUrl?: string | null
}

interface RecentOrdersTableProps {
  orders: OrderItem[]
  onViewAllClick?: () => void
}

export function RecentOrdersTable({ orders, onViewAllClick }: RecentOrdersTableProps) {
  const router = useRouter()
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  const handleRowClick = (rawId?: string) => {
    if (rawId) {
      router.push(`/orders/${rawId}`)
    } else {
      router.push("/orders")
    }
  }

  const handleImageError = (orderId: string) => {
    setFailedImages((prev) => ({ ...prev, [orderId]: true }))
  }

  return (
    <Card className="md:col-span-5 shadow-xs border border-slate-200/80 rounded-2xl bg-white">
      <CardHeader className="flex flex-row items-center justify-between py-6 px-6">
        <CardTitle className="text-lg font-bold text-[#0f172a]">Recent Orders</CardTitle>
        <Button variant="link" onClick={onViewAllClick} className="text-emerald-600 hover:text-emerald-700 p-0 h-auto font-bold text-sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f8fafc] border-y border-slate-100">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5 pl-6">Order ID</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5">Product</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5 text-right">Total</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5 text-center">Status</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5 text-center pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-xs font-semibold text-slate-400">
                    No recent orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const hasImage = order.imgUrl && !failedImages[order.id]
                  const displayName = order.productName || order.name || "Markline Item"

                  return (
                    <TableRow
                      key={order.id}
                      onClick={() => handleRowClick(order.rawId)}
                      className="border-b border-slate-100 last:border-0 hover:bg-emerald-50/40 transition-colors cursor-pointer"
                    >
                      <TableCell className="font-semibold text-emerald-700 hover:underline py-4 pl-6 text-sm">
                        {order.id}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 shadow-xs shrink-0 overflow-hidden flex items-center justify-center">
                            {hasImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={order.imgUrl!}
                                alt={displayName}
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(order.id)}
                              />
                            ) : (
                              <ShoppingBag className="h-4 w-4 text-emerald-600" />
                            )}
                          </div>
                          <span className="font-semibold text-[#0f172a] text-sm">
                            {displayName.length > 22 ? `${displayName.substring(0, 22)}...` : displayName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-[#0f172a] py-4 text-right text-sm">{order.amount}</TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge variant="outline" className={`
                          ${order.status === 'Paid' || order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                          ${order.status === 'Fulfilled' || order.status === 'Delivered' ? 'bg-slate-100 text-slate-700 border-slate-200' : ''}
                          ${order.status === 'Pending' || order.status === 'PENDING' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                          ${order.status === 'Canceled' || order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-200' : ''}
                          font-bold shadow-none rounded-md px-2.5 py-0.5 text-xs
                        `}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-center pr-6" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
