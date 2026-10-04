import React from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, RefreshCw } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { TableLoadingSkeleton } from "@/components/shared/loading-skeleton"

interface ShipmentTableProps {
  shipments: any[]
  totalCount: number
  currentPage: number
  limit: number
  onPageChange: (page: number) => void
  isLoading: boolean
  onSyncTracking: (id: string | number) => void
}

export function ShipmentTable({
  shipments,
  totalCount,
  currentPage,
  limit,
  onPageChange,
  isLoading,
  onSyncTracking,
}: ShipmentTableProps) {
  if (isLoading) {
    return <TableLoadingSkeleton rows={6} columns={6} />
  }

  if (!shipments || shipments.length === 0) {
    return (
      <EmptyState
        title="No shipments found"
        description="There are no shipment records matching your current filter settings."
      />
    )
  }

  const totalPages = Math.ceil(totalCount / limit) || 1

  return (
    <Card className="border h-full" >
      <CardContent className="p-0 h-full">
        <div className="overflow-x-auto h-full">
          <Table className="h-full relative">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">AWB / Tracking</TableHead>
                <TableHead className="text-xs font-semibold">Order ID</TableHead>
                <TableHead className="text-xs font-semibold">Courier</TableHead>
                <TableHead className="text-xs font-semibold">Destination</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="h-full relative">
              {shipments.map((shipment) => {
                const status = shipment.status || "MANIFESTED"
                let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary"
                if (status === "DELIVERED") badgeVariant = "default"
                if (status === "CANCELLED" || status === "RTO") badgeVariant = "destructive"

                return (
                  <TableRow key={shipment.id} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-medium py-3">
                      <div>
                        <p className="font-semibold text-foreground">{shipment.awb_number || "Pending AWB"}</p>
                        <p className="text-[11px] text-muted-foreground">Type: {shipment.type || "FORWARD"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/orders/${shipment.order_id}`} className="hover:underline font-medium">
                        #{shipment.order_id}
                      </Link>
                    </TableCell>
                    <TableCell>{shipment.courier_name || "Shiprocket"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {shipment.destination_city ? `${shipment.destination_city}, ${shipment.destination_pincode}` : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant} className="text-[10px]">
                        {status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onSyncTracking(shipment.id)}
                          title="Sync tracking status"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        {shipment.tracking_url && (
                          <a href={shipment.tracking_url} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          </a>
                        )}
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
            Page {currentPage} of {totalPages} ({totalCount} total shipments)
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
