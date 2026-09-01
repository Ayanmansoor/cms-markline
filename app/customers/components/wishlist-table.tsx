"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HeartIcon } from "lucide-react"

export function WishlistTable() {
  const { data: wishlistsData, isLoading, error } = useQuery({
    queryKey: ["global-wishlists"],
    queryFn: async () => {
      const res = await fetch("/api/customers/wishlists")
      if (!res.ok) throw new Error("Failed to fetch wishlists")
      return res.json()
    }
  })

  const wishlists = wishlistsData?.wishlists || []

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val)
  }

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
      <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">data is not present</p>
    </div>
  )

  if (isLoading) {
    return <div className="text-center py-8 text-xs font-semibold text-slate-400">Loading wishlist items...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-xs font-semibold text-red-500">Failed to load wishlist items.</div>
  }

  if (wishlists.length === 0) {
    return renderEmptyState()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-[#f8fafc]">
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="h-11 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Details</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Added On</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right px-6">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wishlists.map((item: any) => (
            <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <TableCell className="px-6 py-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">{item.customerName}</span>
                  <span className="text-[10px] font-semibold text-slate-400 block">{item.customerEmail}</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-3">
                  <HeartIcon className="h-3.5 w-3.5 text-rose-455 fill-rose-50 flex-shrink-0" />
                  {item.image_url && (
                    <div className="h-9 w-9 border border-slate-200 rounded-md overflow-hidden bg-slate-50 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[300px]">{item.name || `Product: ${item.product_id}`}</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <span className="text-xs font-semibold text-slate-650">
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
