import React from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, TrashIcon } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { TableLoadingSkeleton } from "@/components/shared/loading-skeleton"

interface CouponTableProps {
  coupons: any[]
  totalCount: number
  currentPage: number
  limit: number
  onPageChange: (page: number) => void
  isLoading: boolean
  onDelete: (id: string) => void
}

export function CouponTable({
  coupons,
  totalCount,
  currentPage,
  limit,
  onPageChange,
  isLoading,
  onDelete,
}: CouponTableProps) {
  if (isLoading) {
    return <TableLoadingSkeleton rows={6} columns={6} />
  }

  if (!coupons || coupons.length === 0) {
    return (
      <EmptyState
        title="No coupons found"
        description="Try adjusting your filter settings or create a new coupon code."
      />
    )
  }

  const totalPages = Math.ceil(totalCount / limit) || 1

  return (
    <Card className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[calc(100vh-280px)] min-h-[350px] relative">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200/80">
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Code / Title</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Discount</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Usage Limit</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Validity Window</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Status</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 text-right pr-6 border-b border-slate-200/80 shadow-2xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => {
                const now = new Date()
                const rawStart = coupon.starts_at || coupon.start_date || coupon.discount_start
                const rawEnd = coupon.expires_at || coupon.end_date || coupon.discount_end

                const startDate = rawStart ? new Date(rawStart) : null
                const endDate = rawEnd ? new Date(rawEnd) : null

                let status = coupon.status || "Active"
                let badgeVariant: "default" | "secondary" | "destructive" = "default"

                if (coupon.is_active === false) {
                  status = "Expired"
                  badgeVariant = "destructive"
                } else if (endDate && now > endDate) {
                  status = "Expired"
                  badgeVariant = "destructive"
                } else if (startDate && now < startDate) {
                  status = "Upcoming"
                  badgeVariant = "secondary"
                } else {
                  status = "Active"
                  badgeVariant = "default"
                }

                const formatFormattedDate = (d: Date | null) => {
                  if (!d) return ""
                  return d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })
                }

                const validityWindow =
                  startDate && endDate
                    ? `${formatFormattedDate(startDate)} - ${formatFormattedDate(endDate)}`
                    : endDate
                    ? `Expires ${formatFormattedDate(endDate)}`
                    : startDate
                    ? `Starts ${formatFormattedDate(startDate)}`
                    : "No expiry"

                const isPercent =
                  coupon.discount_type === "Percentage" ||
                  coupon.discount_type === "PERCENTAGE" ||
                  coupon.discount_type === "PERCENT"
                const discountText =
                  coupon.discount_type === "Free Shipping"
                    ? "Free Shipping"
                    : isPercent
                    ? `${coupon.discount_value}% OFF`
                    : `₹${coupon.discount_value} OFF`

                const usageLimit = coupon.usage_limit || coupon.max_uses || "∞"
                const usedCount = coupon.used_count || coupon.usage_count || 0

                return (
                  <TableRow key={coupon.id || coupon.coupon_id} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-medium py-3">
                      <div>
                        <p className="font-bold text-foreground tracking-wide font-mono text-sm">{coupon.code}</p>
                        <p className="text-[11px] text-muted-foreground">{coupon.title || "No description"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{discountText}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {usedCount} / {usageLimit}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {validityWindow}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant} className="text-[10px]">
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/coupon/${coupon.id || coupon.coupon_id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:text-destructive"
                          onClick={() => onDelete(coupon.id || coupon.coupon_id)}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground bg-white">
          <p>
            Page {currentPage} of {totalPages} ({totalCount} total coupons)
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
