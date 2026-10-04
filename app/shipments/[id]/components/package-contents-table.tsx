"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import { parseImageUrl } from "@/lib/utils"

interface PackageContentsTableProps {
  shp: any
  formatCurrency: (val: number) => string
}

export function PackageContentsTable({ shp, formatCurrency }: PackageContentsTableProps) {
  const items = shp.order?.items || []

  // Helper to parse variant color/size JSON string or object
  const parseVariantVal = (val: any) => {
    if (!val) return null
    if (typeof val === 'string' && val.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(val)
        return parsed
      } catch (e) {
        // ignore
      }
    }
    if (typeof val === 'object' && val !== null) {
      return val
    }
    return { name: String(val) }
  }

  const getVariantLabel = (val: any) => {
    const parsed = parseVariantVal(val)
    if (!parsed) return null
    return parsed.name || parsed.label || parsed.value || (typeof val === 'string' ? val : JSON.stringify(val))
  }

  const getProductImage = (item: any) => {
    const raw = item.productImage || item.imageUrl || item.image_url || item.image || item.product?.image_url || item.product?.image || item.product?.product_variants?.[0]?.image_url || null
    return parseImageUrl(raw)
  }

  return (
    <Card className="border-slate-200/80 bg-white shadow-2xs rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-700 tracking-wider">
            Shipment Package Contents ({items.length} items)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="text-sm font-bold text-slate-400 tracking-wider py-3">Product Name</TableHead>
                <TableHead className="text-sm font-bold text-slate-400 tracking-wider py-3">SKU</TableHead>
                <TableHead className="text-sm font-bold text-slate-400 tracking-wider py-3">Variant Details</TableHead>
                <TableHead className="text-sm font-bold text-slate-400 tracking-wider py-3 text-center">Qty</TableHead>
                <TableHead className="text-sm font-bold text-slate-400 tracking-wider py-3 text-right">Final Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any, idx: number) => {
                const colorObj = parseVariantVal(item.color)
                const colorLabel = getVariantLabel(item.color)
                const sizeLabel = getVariantLabel(item.size)
                const imgSrc = getProductImage(item)

                return (
                  <TableRow key={idx} className="hover:bg-slate-50/20 border-b border-slate-100">
                    {/* Product */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                          {imgSrc ? (
                            <img src={imgSrc} alt={item.productName} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 text-slate-300" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-900 truncate max-w-xs">{item.productName}</span>
                      </div>
                    </TableCell>

                    {/* SKU */}
                    <TableCell className="py-3 text-xs text-slate-500 font-mono">
                      {item.sku || 'N/A'}
                    </TableCell>

                    {/* Variant */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {colorLabel && (
                          <Badge variant="outline" className="text-sm font-bold bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1">
                            {colorObj?.hex && (
                              <span className="h-2 w-2 rounded-full border border-slate-300" style={{ backgroundColor: colorObj.hex }} />
                            )}
                            Col: {colorLabel}
                          </Badge>
                        )}
                        {sizeLabel && (
                          <Badge variant="outline" className="text-sm font-bold bg-slate-50 text-slate-600 border-slate-200">
                            Size: {sizeLabel}
                          </Badge>
                        )}
                        {!colorLabel && !sizeLabel && <span className="text-sm text-slate-400 font-semibold">Standard</span>}
                      </div>
                    </TableCell>

                    {/* Qty */}
                    <TableCell className="py-3 text-center text-sm font-extrabold text-slate-900">
                      {item.quantity}
                    </TableCell>

                    {/* Item Price */}
                    <TableCell className="py-3 text-right text-sm font-black text-slate-900">
                      {formatCurrency(item.finalPrice)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
