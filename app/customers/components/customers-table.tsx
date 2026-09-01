"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FilterIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export function CustomersTable() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all")

  // React Query call to get dynamic customers list
  const { data: customerData, isLoading, error } = useQuery({
    queryKey: ["customers", currentPage, limit, selectedStatus],
    queryFn: async () => {
      let url = `/api/customers?page=${currentPage}&limit=${limit}`
      if (selectedStatus !== "all") {
        url += `&status=${selectedStatus}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch customers")
      return res.json()
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  })

  const from = (currentPage - 1) * limit
  const to = from + limit - 1

  const customersList = customerData?.customers || []
  const totalCount = customerData?.totalCount || 0
  const isFallback = customerData?.isFallback || false

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val)
  }

  // Get customer badge classification based on LTV
  const getCustomerBadge = (ltv: number) => {
    if (ltv >= 10000) {
      return { label: "PLATINUM VIP", classes: "bg-blue-100 text-blue-700 border-blue-200" }
    } else if (ltv >= 2500) {
      return { label: "GOLD VIP", classes: "bg-amber-100 text-amber-700 border-amber-200" }
    } else if (ltv > 0) {
      return { label: "STANDARD", classes: "bg-slate-100 text-slate-600 border-slate-200" }
    } else {
      return { label: "INACTIVE", classes: "bg-red-50 text-red-600 border-red-200" }
    }
  }

  return (
    <div className="space-y-4">
      {isFallback && (
        <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl text-xs font-semibold text-amber-700">
          ⚠️ Running in Fallback Mode. Please configure `SUPABASE_SERVICE_ROLE_KEY` in your environment to fetch metadata from the secure identity schema.
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center bg-slate-50 rounded-md border border-slate-200 p-0.5">
              <button
                onClick={() => { setSelectedStatus("all"); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${selectedStatus === "all" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              >
                All
              </button>
              <button
                onClick={() => { setSelectedStatus("active"); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${selectedStatus === "active" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              >
                Active
              </button>
              <button
                onClick={() => { setSelectedStatus("inactive"); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${selectedStatus === "inactive" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              >
                Inactive
              </button>
            </div>
            <div className="flex items-center gap-2 cursor-pointer group">
              <FilterIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700" />
              <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700">Advanced Filters</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] font-semibold text-slate-500">
              Showing {from + 1}-{Math.min(to + 1, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2 py-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 border-r border-slate-200 disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage * limit >= totalCount || isLoading}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-2 py-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f8fafc]">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="w-12 text-center px-4">
                  <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
                </TableHead>
                <TableHead className="h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest">Customer</TableHead>
                <TableHead className="h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest">Contact</TableHead>
                <TableHead className="h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Orders</TableHead>
                <TableHead className="h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Wishlist</TableHead>
                <TableHead className="h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Reviews</TableHead>
                <TableHead className="h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Promo</TableHead>
                <TableHead className="h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest">LTV</TableHead>
                <TableHead className="h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-8 text-center text-xs font-semibold text-slate-400">
                    Loading customer directory data...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-8 text-center text-xs font-semibold text-red-500">
                    Error fetching customer list. Please check database connection.
                  </TableCell>
                </TableRow>
              ) : customersList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-8 text-center text-xs font-semibold text-slate-400">
                    No customers found matching current filters.
                  </TableCell>
                </TableRow>
              ) : (
                customersList.map((c: any) => {
                  const badgeInfo = getCustomerBadge(c.ltv)
                  return (
                    <TableRow
                      key={c.id}
                      onClick={() => router.push(`/customers/${c.id}`)}
                      className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer"
                    >
                      <TableCell className="w-12 text-center px-4" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-300 shadow-sm relative overflow-hidden flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${c.name}`} alt={c.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 mb-0.5">{c.name}</p>
                            <Badge variant="outline" className={`text-[8px] font-bold uppercase tracking-wider rounded px-1.5 py-0 ${badgeInfo.classes}`}>
                              {badgeInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <p className="text-xs font-semibold text-slate-900 mb-0.5">{c.email}</p>
                        <p className="text-[10px] font-medium text-slate-500">{c.phone}</p>
                      </TableCell>
                      <TableCell className="p-3 text-center text-xs font-bold text-slate-700">{c.orders}</TableCell>
                      <TableCell className="p-3 text-center text-xs font-bold text-slate-700">{c.wishlist}</TableCell>
                      <TableCell className="p-3 text-center text-xs font-bold text-slate-700">{c.reviews}</TableCell>
                      <TableCell className="p-3">
                        {c.discount ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold uppercase tracking-wider rounded px-2 py-0.5 whitespace-nowrap">
                            {c.discount.name} ({c.discount.discount_persent}%)
                          </Badge>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">None</span>
                        )}
                      </TableCell>
                      <TableCell className="p-3 text-xs font-bold text-slate-900">{formatCurrency(c.ltv)}</TableCell>
                      <TableCell className="p-3">
                        <p className="text-xs font-medium text-slate-600 whitespace-pre-wrap w-24">
                          {c.joined === "N/A" ? "N/A" : c.joined.replace(', ', ',\n')}
                        </p>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
