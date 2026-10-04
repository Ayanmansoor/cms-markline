"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FilterIcon, ChevronLeftIcon, ChevronRightIcon, RotateCcwIcon, SearchIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export function CustomersTable() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all")

  // Advanced Filters State
  const [searchQuery, setSearchQuery] = useState("")
  const [hasOrders, setHasOrders] = useState<"all" | "yes" | "no">("all")
  const [hasCart, setHasCart] = useState<"all" | "yes" | "no">("all")
  const [hasWishlist, setHasWishlist] = useState<"all" | "yes" | "no">("all")
  const [hasReviews, setHasReviews] = useState<"all" | "yes" | "no">("all")
  const [hasAddress, setHasAddress] = useState<"all" | "yes" | "no">("all")
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Active filter count
  const activeFilterCount = [
    searchQuery.trim() !== "",
    hasOrders !== "all",
    hasCart !== "all",
    hasWishlist !== "all",
    hasReviews !== "all",
    hasAddress !== "all"
  ].filter(Boolean).length

  const resetFilters = () => {
    setSearchQuery("")
    setHasOrders("all")
    setHasCart("all")
    setHasWishlist("all")
    setHasReviews("all")
    setHasAddress("all")
    setCurrentPage(1)
  }

  // React Query call to get dynamic customers list
  const { data: customerData, isLoading, error } = useQuery({
    queryKey: [
      "customers",
      currentPage,
      limit,
      selectedStatus,
      searchQuery,
      hasOrders,
      hasCart,
      hasWishlist,
      hasReviews,
      hasAddress
    ],
    queryFn: async () => {
      let url = `/api/customers?page=${currentPage}&limit=${limit}`
      if (selectedStatus !== "all") url += `&status=${selectedStatus}`
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`
      if (hasOrders !== "all") url += `&hasOrders=${hasOrders}`
      if (hasCart !== "all") url += `&hasCart=${hasCart}`
      if (hasWishlist !== "all") url += `&hasWishlist=${hasWishlist}`
      if (hasReviews !== "all") url += `&hasReviews=${hasReviews}`
      if (hasAddress !== "all") url += `&hasAddress=${hasAddress}`

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
      return { label: "Platinum VIP", classes: "bg-blue-100 text-blue-700 border-blue-200" }
    } else if (ltv >= 2500) {
      return { label: "Gold VIP", classes: "bg-amber-100 text-amber-700 border-amber-200" }
    } else if (ltv > 0) {
      return { label: "Standard", classes: "bg-slate-100 text-slate-600 border-slate-200" }
    } else {
      return { label: "Inactive", classes: "bg-red-50 text-red-600 border-red-200" }
    }
  }

  return (
    <div className="space-y-4">
      {isFallback && (
        <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl text-xs font-semibold text-amber-700">
          ⚠️ Running in Fallback Mode. Please configure `SUPABASE_SERVICE_ROLE_KEY` in your environment to fetch metadata from the secure identity schema.
        </div>
      )}

      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 px-6 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {/* Popover for Advanced Filters */}
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer">
                  <FilterIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span>Advanced Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 bg-slate-900 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 sm:w-96 p-4 shadow-xl border border-slate-200 rounded-xl bg-white space-y-4 z-50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FilterIcon className="h-4 w-4 text-slate-600" />
                    <h4 className="text-xs font-bold text-slate-900">Advanced Customer Filters</h4>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <RotateCcwIcon className="h-3 w-3" />
                      <span>Reset ({activeFilterCount})</span>
                    </button>
                  )}
                </div>

                {/* Search Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600">Search Customer</label>
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search name or email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="pl-8 text-xs h-8"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("")
                          setCurrentPage(1)
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Relational Filter Options */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Shopping Cart */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Active Cart</label>
                    <select
                      value={hasCart}
                      onChange={(e) => {
                        setHasCart(e.target.value as any)
                        setCurrentPage(1)
                      }}
                      className="w-full h-8 text-xs rounded-lg border border-slate-200 bg-white px-2 font-medium text-slate-700 outline-none focus:border-slate-400 cursor-pointer"
                    >
                      <option value="all">All</option>
                      <option value="yes">In Cart (Yes)</option>
                      <option value="no">Empty Cart (No)</option>
                    </select>
                  </div>

                  {/* Order History */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Order History</label>
                    <select
                      value={hasOrders}
                      onChange={(e) => {
                        setHasOrders(e.target.value as any)
                        setCurrentPage(1)
                      }}
                      className="w-full h-8 text-xs rounded-lg border border-slate-200 bg-white px-2 font-medium text-slate-700 outline-none focus:border-slate-400 cursor-pointer"
                    >
                      <option value="all">All</option>
                      <option value="yes">Has Orders (Yes)</option>
                      <option value="no">No Orders (No)</option>
                    </select>
                  </div>

                  {/* Wishlist */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Wishlist</label>
                    <select
                      value={hasWishlist}
                      onChange={(e) => {
                        setHasWishlist(e.target.value as any)
                        setCurrentPage(1)
                      }}
                      className="w-full h-8 text-xs rounded-lg border border-slate-200 bg-white px-2 font-medium text-slate-700 outline-none focus:border-slate-400 cursor-pointer"
                    >
                      <option value="all">All</option>
                      <option value="yes">Has Wishlist (Yes)</option>
                      <option value="no">No Wishlist (No)</option>
                    </select>
                  </div>

                  {/* Reviews */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Reviews</label>
                    <select
                      value={hasReviews}
                      onChange={(e) => {
                        setHasReviews(e.target.value as any)
                        setCurrentPage(1)
                      }}
                      className="w-full h-8 text-xs rounded-lg border border-slate-200 bg-white px-2 font-medium text-slate-700 outline-none focus:border-slate-400 cursor-pointer"
                    >
                      <option value="all">All</option>
                      <option value="yes">Has Reviews (Yes)</option>
                      <option value="no">No Reviews (No)</option>
                    </select>
                  </div>

                  {/* Saved Address */}
                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600">Saved Address</label>
                    <select
                      value={hasAddress}
                      onChange={(e) => {
                        setHasAddress(e.target.value as any)
                        setCurrentPage(1)
                      }}
                      className="w-full h-8 text-xs rounded-lg border border-slate-200 bg-white px-2 font-medium text-slate-700 outline-none focus:border-slate-400 cursor-pointer"
                    >
                      <option value="all">All</option>
                      <option value="yes">Has Saved Address (Yes)</option>
                      <option value="no">No Saved Address (No)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">
                    {totalCount} matching customer(s)
                  </span>
                  <button
                    onClick={() => setPopoverOpen(false)}
                    className="px-3 py-1 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Quick Filter Clear link */}
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors underline underline-offset-2 cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] font-semibold text-slate-500">
              Showing {totalCount > 0 ? from + 1 : 0}-{Math.min(to + 1, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2 py-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 border-r border-slate-200 disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage * limit >= totalCount || isLoading}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-2 py-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-auto max-h-[calc(100vh-320px)] min-h-[350px] relative">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200/80 hover:bg-transparent">
                <TableHead className="sticky top-0 z-20 bg-slate-50 w-12 text-center px-4 border-b border-slate-200/80 shadow-2xs">
                  <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Customer</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Contact</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 text-center border-b border-slate-200/80 shadow-2xs">Orders</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 text-center border-b border-slate-200/80 shadow-2xs">Wishlist</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 text-center border-b border-slate-200/80 shadow-2xs">Reviews</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Active Promo</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">LTV</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Joined</TableHead>
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
                            <Badge variant="outline" className={`text-[9px] font-bold rounded px-1.5 py-0 ${badgeInfo.classes}`}>
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
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold capitalize tracking-wider rounded px-2 py-0.5 whitespace-nowrap">
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

