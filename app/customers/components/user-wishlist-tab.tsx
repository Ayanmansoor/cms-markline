"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HeartIcon } from "lucide-react"

interface UserWishlistTabProps {
  wishlist: any[]
  formatCurrency: (val: number) => string
  renderEmptyState: () => React.ReactNode
}

export function UserWishlistTab({ wishlist, formatCurrency, renderEmptyState }: UserWishlistTabProps) {
  if (wishlist.length === 0) return <>{renderEmptyState()}</>

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-[#f8fafc]">
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="h-11 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Added On</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right px-6">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wishlist.map((item: any) => (
            <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <TableCell className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <HeartIcon className="h-3.5 w-3.5 text-rose-400 fill-rose-50 flex-shrink-0" />
                  {item.image_url && (
                    <div className="h-9 w-9 border border-slate-200 rounded-md overflow-hidden bg-slate-50 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[300px]">{item.name || `Product ID: ${item.product_id}`}</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <span className="text-xs font-semibold text-slate-600">
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit'
                  })}
                </span>
              </TableCell>
              <TableCell className="py-4 px-6 text-right">
                <span className="text-xs font-black text-slate-900">{formatCurrency(item.price || 0)}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
