import React from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, TrashIcon } from "lucide-react"
import { Product } from "../types/product-types"
import { EmptyState } from "@/components/shared/empty-state"
import { TableLoadingSkeleton } from "@/components/shared/loading-skeleton"

import { parseImageUrl } from "@/lib/utils"

interface ProductTableProps {
  products: Product[]
  totalCount: number
  currentPage: number
  limit: number
  onPageChange: (page: number) => void
  isLoading: boolean
  onDelete: (id: string | number) => void
  onToggleActive: (id: string | number, currentStatus: boolean) => void
  groups?: { id: number; name: string }[]
  onUpdateGroup?: (id: string | number, grouptype: number | null) => void
}

export function ProductTable({
  products,
  totalCount,
  currentPage,
  limit,
  onPageChange,
  isLoading,
  onDelete,
  onToggleActive,
  groups = [],
  onUpdateGroup,
}: ProductTableProps) {
  if (isLoading) {
    return <TableLoadingSkeleton rows={6} columns={6} />
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Try adjusting your filters or search terms."
      />
    )
  }

  const totalPages = Math.ceil(totalCount / limit) || 1

  return (
    <Card className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200/80">
                <TableHead className="h-11 px-4 text-xs font-semibold text-slate-600 max-w-[320px]">Product</TableHead>
                <TableHead className="h-11 text-xs font-semibold text-slate-600">Brand</TableHead>
                <TableHead className="h-11 text-xs font-semibold text-slate-600">Variants</TableHead>
                <TableHead className="h-11 text-xs font-semibold text-slate-600">Total Stock</TableHead>
                <TableHead className="h-11 text-xs font-semibold text-slate-600">Status</TableHead>
                <TableHead className="h-11 text-xs font-semibold text-slate-600">Group Name</TableHead>
                <TableHead className="h-11 text-xs font-semibold text-slate-600 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const variants = product.product_variants || []
                const firstVar = variants[0]
                const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
                const imgUrl = parseImageUrl(firstVar?.image_url)
                const brandName = product.brands?.name || product.brand?.name || product.brand_key || "Markline"
                const groupName = product.group?.heading || (product as any).grouptypes?.heading || (product as any).grouptypes?.name || product.grouptype_name || "—"
                const currentGroupId = product.group?.id ?? (product.grouptype ? Number(product.grouptype) : null)
                const isActive = product.is_active !== false

                return (
                  <TableRow key={product.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors h-14 text-xs">
                    <TableCell className="p-4 px-4 font-medium max-w-[260px] sm:max-w-[320px]">
                      <div className="flex items-center gap-3 min-w-0">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded border border-slate-200 bg-slate-50 object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                            No Img
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate" title={product.name}>{product.name}</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">ID: #{product.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">{brandName}</TableCell>
                    <TableCell className="text-slate-700 font-semibold">{variants.length} variant(s)</TableCell>
                    <TableCell className="font-bold text-slate-900">{totalStock}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => onToggleActive(product.id, isActive)}
                        className={`text-[9.5px] font-bold capitalize tracking-wide rounded-full px-2.5 py-0.5 border transition-all cursor-pointer ${isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                          : "bg-slate-50 text-slate-500 border-slate-200/80"
                          }`}
                      >
                        {isActive ? "Active" : "Draft"}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {groups && groups.length > 0 && onUpdateGroup ? (
                        <Select
                          value={currentGroupId ? String(currentGroupId) : "none"}
                          onValueChange={(val) => {
                            const newGroup = val === "none" ? null : parseInt(val)
                            onUpdateGroup(product.id, newGroup)
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 focus:ring-1 focus:ring-slate-300 font-medium px-2.5 max-w-[170px]">
                            <SelectValue placeholder="No Group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-xs text-slate-500">
                              No Group
                            </SelectItem>
                            {groups.map((g) => (
                              <SelectItem key={g.id} value={String(g.id)} className="text-xs font-medium">
                                {g.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="font-bold text-slate-900">{groupName}</span>
                      )}
                    </TableCell>


                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/products/${product.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          onClick={() => onDelete(product.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
          <p>
            Page {currentPage} of {totalPages} ({totalCount} total items)
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
