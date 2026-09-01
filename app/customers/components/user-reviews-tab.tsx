"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StarIcon } from "lucide-react"

interface UserReviewsTabProps {
  reviews: any[]
  renderEmptyState: () => React.ReactNode
}

export function UserReviewsTab({ reviews, renderEmptyState }: UserReviewsTabProps) {
  if (reviews.length === 0) return <>{renderEmptyState()}</>

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-[#f8fafc]">
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="h-11 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[200px]">Product</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[120px]">Rating</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Review Summary</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right px-6">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review: any) => (
            <TableRow key={review.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <TableCell className="px-6 py-4">
                <span className="text-xs font-bold text-slate-900 line-clamp-1">{review.product?.name || `Product ID: ${review.product_id}`}</span>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex">
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
