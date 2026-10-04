"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StarIcon } from "lucide-react"

export function ReviewsTable() {
  const { data: reviewsData, isLoading, error } = useQuery({
    queryKey: ["global-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/customers/reviews")
      if (!res.ok) throw new Error("Failed to fetch reviews")
      return res.json()
    }
  })

  const reviews = reviewsData?.reviews || []

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
      <p className="text-slate-400 font-bold text-xs tracking-wider capitalize">Data is not present</p>
    </div>
  )

  if (isLoading) {
    return <div className="text-center py-8 text-xs font-semibold text-slate-400">Loading reviews...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-xs font-semibold text-red-500">Failed to load reviews.</div>
  }

  if (reviews.length === 0) {
    return renderEmptyState()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-[#f8fafc]">
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="h-11 px-6 text-xs font-semibold text-slate-600 w-[160px]">Customer</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600 w-[180px]">Product</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600 w-[120px] text-center">Rating</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600">Review Details</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600 text-right px-6">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review: any) => (
            <TableRow key={review.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <TableCell className="px-6 py-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">{review.customerName}</span>
                  <span className="text-[10px] font-semibold text-slate-400 block">{review.customerEmail}</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <span className="text-xs font-bold text-slate-900 line-clamp-1">{review.product?.name || `Product ID: ${review.product_id}`}</span>
              </TableCell>
              <TableCell className="py-4 text-center">
                <div className="flex justify-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className={`h-3.5 w-3.5 ${i < (review.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-50'}`} />
                  ))}
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="space-y-0.5">
                  {review.title && <span className="text-xs font-bold text-slate-900 block">{review.title}</span>}
                  {review.comment && <span className="text-xs font-medium text-slate-700 block">"{review.comment}"</span>}
                </div>
              </TableCell>
              <TableCell className="py-4 px-6 text-right">
                <span className="text-xs font-semibold text-slate-500">
                  {new Date(review.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit'
                  })}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
