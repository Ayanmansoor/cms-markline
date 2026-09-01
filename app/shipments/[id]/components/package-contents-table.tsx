"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"

interface PackageContentsTableProps {
  shp: any
  formatCurrency: (val: number) => string
}

export function PackageContentsTable({ shp, formatCurrency }: PackageContentsTableProps) {
  const items = shp.order?.items || []

  return (
    <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider">
            Shipment Package Contents ({items.length} items)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="text-[9px] font-bold text-slate-400 tracking-wider py-3">Product Name</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 tracking-wider py-3">SKU</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 tracking-wider py-3">Variant Details</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 tracking-wider py-3 text-center">Qty</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 tracking-wider py-3 text-right">Final Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any, idx: number) => (
                <TableRow key={idx} className="hover:bg-slate-50/20 border-b border-slate-100">
                  {/* Product */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
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
                      {item.color && (
                        <Badge variant="outline" className="text-[9px] font-bold bg-slate-50 text-slate-600 border-slate-200">
                          Col: {item.color}
                        </Badge>
                      )}
                      {item.size && (
                        <Badge variant="outline" className="text-[9px] font-bold bg-slate-50 text-slate-600 border-slate-200">
                          Size: {item.size}
                        </Badge>
                      )}
                      {!item.color && !item.size && <span className="text-[10px] text-slate-400 font-semibold">Standard</span>}
                    </div>
                  </TableCell>

                  {/* Qty */}
                  <TableCell className="py-3 text-center text-xs font-extrabold text-slate-900">
                    {item.quantity}
                  </TableCell>

                  {/* Item Price */}
                  <TableCell className="py-3 text-right text-xs font-black text-slate-900">
                    {formatCurrency(item.finalPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
