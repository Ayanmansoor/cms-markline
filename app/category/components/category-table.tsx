import React from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, Trash2 } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { TableLoadingSkeleton } from "@/components/shared/loading-skeleton"
import { parseImageUrl } from "@/lib/utils"

interface CategoryTableProps {
  collections: any[]
  totalCount: number
  isLoading: boolean
  onDelete: (id: number, name: string) => void
  onToggleStatus: (id: number, is_show: boolean) => void
}

export function CategoryTable({
  collections,
  totalCount,
  isLoading,
  onDelete,
  onToggleStatus,
}: CategoryTableProps) {
  if (isLoading) {
    return <TableLoadingSkeleton rows={6} columns={5} />
  }

  if (!collections || collections.length === 0) {
    return (
      <EmptyState
        title="No collections found"
        description="Try adjusting your filter settings or create a new collection."
      />
    )
  }

  return (
    <Card className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-auto max-h-[calc(100vh-280px)] min-h-[350px] relative p-0">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-200/80">
              <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 px-6 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Collection</TableHead>
              <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Slug</TableHead>
              <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Assigned Products</TableHead>
              <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Store Visibility</TableHead>
              <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 text-right pr-6 border-b border-slate-200/80 shadow-2xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="">
            {collections.map((col) => {
              const imgUrl = parseImageUrl(col.image_urls || col.image_url || col.banner_image || col.banner_url || col.image || col.banner)
              const isVisible = col.is_show !== false

              return (
                <TableRow key={col.id} className="hover:bg-slate-50/60 border-b border-slate-100 transition-colors h-14 text-xs">
                  <TableCell className="p-4 px-6 font-medium">
                    <div className="flex items-center gap-3">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={col.name}
                          className="w-10 h-10 rounded border border-slate-200 bg-slate-50 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          Cat
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{col.name}</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">ID: #{col.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-[11px]">/{col.slug || col.name?.toLowerCase().replace(/\s+/g, '-')}</TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {col.productCount ?? col.products_count ?? (Array.isArray(col.products) ? col.products.length : (Array.isArray(col.product) ? col.product.length : 0))} products
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isVisible}
                        onCheckedChange={(checked) => onToggleStatus(col.id, checked)}
                      />
                      {isVisible ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[9.5px] font-bold capitalize tracking-wide rounded-full px-2.5 py-0.5">
                          Visible
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-500 border border-slate-200/80 text-[9.5px] font-bold capitalize tracking-wide rounded-full px-2.5 py-0.5">
                          Hidden
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/category/${col.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        onClick={() => onDelete(col.id, col.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>


    </Card>
  )
}
