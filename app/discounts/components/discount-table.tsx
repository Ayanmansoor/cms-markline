import React from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, TrashIcon } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { TableLoadingSkeleton } from "@/components/shared/loading-skeleton"

interface DiscountTableProps {
  discounts: any[]
  totalCount: number
  currentPage: number
  limit: number
  onPageChange: (page: number) => void
  isLoading: boolean
  onDelete: (id: string) => void
}

export function DiscountTable({
  discounts,
  totalCount,
  currentPage,
  limit,
  onPageChange,
  isLoading,
  onDelete,
}: DiscountTableProps) {
  if (isLoading) {
    return <TableLoadingSkeleton rows={6} columns={5} />
  }

  if (!discounts || discounts.length === 0) {
    return (
      <EmptyState
        title="No discount rules found"
        description="Try adjusting your filter settings or create a new discount offer."
      />
    )
  }

  const totalPages = Math.ceil(totalCount / limit) || 1

  return (
    <Card className="border">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">Discount Name</TableHead>
                <TableHead className="text-xs font-semibold">Percentage</TableHead>
                <TableHead className="text-xs font-semibold">Validity Window</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((discount) => {
                const now = new Date()
                const rawStart = discount.discount_start || discount.starts_at || discount.start_date
                const rawEnd = discount.discount_end || discount.expires_at || discount.end_date

                const startDate = rawStart ? new Date(rawStart) : null
                const endDate = rawEnd ? new Date(rawEnd) : null

                let status = discount.status || "Active"
                let badgeVariant: "default" | "secondary" | "destructive" = "default"

                if (endDate && now > endDate) {
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

                return (
                  <TableRow key={discount.id || discount.discount_id} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-medium py-3">
                      <div>
                        <p className="font-bold text-foreground">{discount.name}</p>
                        <p className="text-[11px] text-muted-foreground">ID: #{discount.id || discount.discount_id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-primary text-sm">
                      {discount.discount_persent || discount.percentage || 0}% OFF
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {validityWindow}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant} className="text-[10px]">
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/discounts/${discount.id || discount.discount_id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:text-destructive"
                          onClick={() => onDelete(discount.id || discount.discount_id)}
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
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
          <p>
            Page {currentPage} of {totalPages} ({totalCount} total discount rules)
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
