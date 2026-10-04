import React from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, TrashIcon } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { TableLoadingSkeleton } from "@/components/shared/loading-skeleton"
import { parseImageUrl } from "@/lib/utils"

interface BrandTableProps {
  brands: any[]
  totalCount: number
  currentPage: number
  limit: number
  onPageChange: (page: number) => void
  isLoading: boolean
  onDelete: (id: string, name: string) => void
}

export function BrandTable({
  brands,
  totalCount,
  currentPage,
  limit,
  onPageChange,
  isLoading,
  onDelete,
}: BrandTableProps) {
  if (isLoading) {
    return <TableLoadingSkeleton rows={6} columns={6} />
  }

  if (!brands || brands.length === 0) {
    return (
      <EmptyState
        title="No brands found"
        description="Try clearing filters or adding a new brand to the directory."
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
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Brand</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Est.</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Segment</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Products</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Discount</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Status</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 text-right pr-6 border-b border-slate-200/80 shadow-2xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => {
                const imgUrl = parseImageUrl(
                  brand.image_url ||
                  brand.image ||
                  brand.logo ||
                  brand.logo_url ||
                  brand.image_urls ||
                  brand.banner_image ||
                  brand.banner_url ||
                  brand.image_path ||
                  brand.thumbnail
                )
                const estYear = brand.since_year ? new Date(brand.since_year).getFullYear() : "N/A"
                const isActive = brand.isActive ?? brand.is_active ?? (brand.productsCount > 0)
                const discountName = brand.discounts?.name
                  ? `${brand.discounts.name} (${brand.discounts.discount_persent}%)`
                  : "No Discount"

                return (
                  <TableRow key={brand.id} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-medium py-3">
                      <div className="flex items-center gap-3">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={brand.name}
                            className="w-9 h-9 rounded-md object-cover border bg-slate-50 flex-shrink-0"
                            onError={(e) => {
                              // Fallback to placeholder box if image load fails
                              const target = e.currentTarget
                              target.style.display = 'none'
                              if (target.nextElementSibling) {
                                (target.nextElementSibling as HTMLElement).style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-9 h-9 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-semibold border flex-shrink-0 ${
                            imgUrl ? "hidden" : "flex"
                          }`}
                        >
                          Brand
                        </div>
                        <div>
                          <p className="font-semibold text-foreground capitalize">{brand.name}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {brand.description?.slice(0, 50) || "No description"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{estYear}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {brand.gender || "Unisex"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{brand.productsCount || 0}</TableCell>
                    <TableCell className="text-primary font-medium">{discountName}</TableCell>
                    <TableCell>
                      <Badge variant={isActive ? "default" : "secondary"} className="text-[10px]">
                        {isActive ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/brands/${brand.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:text-destructive"
                          onClick={() => onDelete(brand.id, brand.name)}
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
      </CardContent>
    </Card>
  )
}
