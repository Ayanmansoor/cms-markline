import React from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, Package } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { TableLoadingSkeleton } from "@/components/shared/loading-skeleton"
import { getFulfillmentStatusBadge, parseImageUrl } from "@/lib/utils"

interface OrderTableProps {
  orders: any[]
  totalCount: number
  currentPage: number
  limit: number
  onPageChange: (page: number) => void
  isLoading: boolean
}

export function OrderTable({
  orders,
  totalCount,
  currentPage,
  limit,
  onPageChange,
  isLoading,
}: OrderTableProps) {
  if (isLoading) {
    return <TableLoadingSkeleton rows={6} columns={6} />
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        title="No orders found"
        description="Try adjusting your date range or filter options."
      />
    )
  }

  const totalPages = Math.ceil(totalCount / limit) || 1

  return (
    <Card className="border border-slate-200/80 h-full shadow-2xs rounded-2xl overflow-hidden bg-white">
      <CardContent className="p-0 h-full">
        <div className="overflow-x-auto h-full">
          <Table >
            <TableHeader>
              <TableRow className="bg-slate-50/60 border-b border-slate-100">
                <TableHead className="text-xs font-bold text-slate-400 capitalize tracking-wider max-w-[280px]">Product / Order</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 capitalize tracking-wider">Customer</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 capitalize tracking-wider">Total Amount</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 capitalize tracking-wider">Payment Status</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 capitalize tracking-wider">Fulfillment</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 capitalize tracking-wider">Date</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 capitalize tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const customerName = order.customer_name || order.customerName || order.customer?.name || "Guest"
                const customerEmail = order.customer_email || order.customerEmail || order.customer?.email || ""
                const isPaid = order.payment_status?.toUpperCase() === "PAID" || order.paymentStatus?.toUpperCase() === "PAID"
                const ffBadge = getFulfillmentStatusBadge(order.fulfillment_status || order.fulfillmentStatus)

                const productName = order.productName || order.product_name || "Markline Product"
                const rawImg = order.image_url || order.imageUrl || order.productImage || order.product?.image_url
                const imgSrc = parseImageUrl(rawImg)
                const itemsCount = order.items_count || order.itemsCount || 1

                const amountRaw = order.grand_total ?? order.total_amount ?? order.grandTotal ?? order.total
                const amountFormatted = typeof amountRaw === 'number'
                  ? `₹${amountRaw.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : (order.total || (amountRaw ? `₹${amountRaw}` : '₹0.00'))

                return (
                  <TableRow key={order.id} className="hover:bg-slate-50/40 border-b border-slate-100 text-xs">
                    {/* Product & Order Info */}
                    <TableCell className="p-3 max-w-[280px] sm:max-w-[340px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          {imgSrc ? (
                            <img src={imgSrc} alt={productName} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/orders/${order.id}`} className="font-bold text-slate-900 hover:text-blue-600 truncate block leading-snug">
                            {productName}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mt-0.5">
                            <span className="font-mono text-slate-500">#{order.displayId || order.id}</span>
                            {itemsCount > 1 && (
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                                +{itemsCount - 1} item{itemsCount > 2 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-900">{customerName}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{customerEmail}</p>
                      </div>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="font-black text-slate-900">
                      {amountFormatted}
                    </TableCell>

                    {/* Payment Status */}
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-bold ${
                        isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {order.payment_status || order.paymentStatus || "PENDING"}
                      </Badge>
                    </TableCell>

                    {/* Fulfillment Status */}
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${ffBadge.className}`}>
                        {ffBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
          <p>
            Page {currentPage} of {totalPages} ({totalCount} total orders)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-7 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="h-7 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
