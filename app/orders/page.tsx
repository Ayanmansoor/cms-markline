"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DownloadIcon, PlusIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { CreateOrderModal } from "./components/create-order-modal"

export default function OrdersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)
  const [paymentStatus, setPaymentStatus] = useState<string>("all")
  const [fulfillmentStatus, setFulfillmentStatus] = useState<string>("all")
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)

  // React Query call to get dynamic orders list
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ["orders", currentPage, limit, paymentStatus, fulfillmentStatus],
    queryFn: async () => {
      let url = `/api/orders?page=${currentPage}&limit=${limit}`
      if (paymentStatus !== "all") {
        url += `&payment_status=${paymentStatus}`
      }
      if (fulfillmentStatus !== "all") {
        url += `&fulfillment_status=${fulfillmentStatus}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch orders")
      return res.json()
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  })

  const ordersList = ordersData?.orders || []
  const totalCount = ordersData?.totalCount || 0

  const handleClearFilters = () => {
    setPaymentStatus("all")
    setFulfillmentStatus("all")
    setCurrentPage(1)
  }

  const from = (currentPage - 1) * limit
  const to = from + limit - 1

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb]">
        <SiteHeader />
        <div className="flex flex-1 flex-col p-8 pt-6">
          <div className="flex items-center text-sm text-slate-500 mb-4 font-medium">
            <span className="hover:text-slate-900 cursor-pointer">Sales</span>
            <span className="mx-2">{'>'}</span>
            <span className="font-semibold text-slate-900">Orders</span>
          </div>

          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">Customer Orders</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="text-sm font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-lg">
                <DownloadIcon className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button onClick={() => setIsCreateOrderOpen(true)} className="text-sm font-semibold bg-black text-white hover:bg-black/90 shadow-sm rounded-lg">
                <PlusIcon className="mr-2 h-4 w-4" /> Create Order
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white mb-6">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 cursor-pointer group px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                  <CalendarIcon className="h-4 w-4 text-slate-500 group-hover:text-slate-900 transition-colors" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Last 30 Days</span>
                </div>
                
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment:</span>
                  <Select value={paymentStatus} onValueChange={(val: any) => { setPaymentStatus(val); setCurrentPage(1); }}>
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs gap-1.5">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-md">
                      <SelectItem value="all" className="text-xs font-semibold">All Statuses</SelectItem>
                      <SelectItem value="paid" className="text-xs font-semibold">Paid</SelectItem>
                      <SelectItem value="pending" className="text-xs font-semibold">Pending</SelectItem>
                      <SelectItem value="failed" className="text-xs font-semibold">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fulfillment:</span>
                  <Select value={fulfillmentStatus} onValueChange={(val: any) => { setFulfillmentStatus(val); setCurrentPage(1); }}>
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs gap-1.5">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-md">
                      <SelectItem value="all" className="text-xs font-semibold">All Statuses</SelectItem>
                      <SelectItem value="pending" className="text-xs font-semibold">Pending</SelectItem>
                      <SelectItem value="confirmed" className="text-xs font-semibold">Confirmed</SelectItem>
                      <SelectItem value="packed" className="text-xs font-semibold">Packed</SelectItem>
                      <SelectItem value="ready_to_ship" className="text-xs font-semibold">Ready To Ship</SelectItem>
                      <SelectItem value="shipped" className="text-xs font-semibold">Shipped</SelectItem>
                      <SelectItem value="delivered" className="text-xs font-semibold">Delivered</SelectItem>
                      <SelectItem value="completed" className="text-xs font-semibold">Completed</SelectItem>
                      <SelectItem value="cancelled" className="text-xs font-semibold">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {(paymentStatus !== "all" || fulfillmentStatus !== "all") && (
                <Button variant="link" onClick={handleClearFilters} className="text-blue-600 font-bold text-xs p-0 h-auto">Clear Filters</Button>
              )}
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card className="shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200 rounded-2xl bg-white overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#f8fafc] border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 pl-6 py-4">
                      <Checkbox className="rounded bg-white border-slate-300" />
                    </TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Order ID</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Customer</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Date</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Total</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4 text-center">Payment Status</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4 text-center">Fulfillment</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4 pr-6">Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="p-8 text-center text-xs font-semibold text-slate-400">
                        Loading orders data...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={8} className="p-8 text-center text-xs font-semibold text-red-500">
                        Error fetching orders list. Please verify database connection.
                      </TableCell>
                    </TableRow>
                  ) : ordersList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="p-8 text-center text-xs font-semibold text-slate-400">
                        No orders found matching current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ordersList.map((order: any) => (
                      <TableRow key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <TableCell className="pl-6 py-5">
                          <Checkbox className="rounded bg-white border-slate-300" />
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 py-5 text-sm">
                          <Link href={`/orders/${order.id}`} className="hover:text-blue-600 hover:underline">
                            {order.displayId}
                          </Link>
                        </TableCell>
                        <TableCell className="py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${order.avatarBg} flex items-center justify-center text-xs font-bold ${order.avatarText}`}>
                              {order.initials}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-none mb-1">{order.customerName}</p>
                              <p className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">{order.customerEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <p className="text-sm font-semibold text-slate-900 leading-none mb-1">
                            {order.date ? order.date.split(',')[0] : 'N/A'}
                          </p>
                          <p className="text-xs font-semibold text-slate-500">
                            {order.date ? order.date.split(',')[1]?.trim() || '' : ''}
                          </p>
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 text-sm py-5">{order.total}</TableCell>
                        <TableCell className="py-5 text-center">
                          <Badge variant="outline" className={`
                            ${order.paymentColor === 'emerald' ? 'bg-emerald-50/80 text-emerald-600 border-emerald-200/50' : ''}
                            ${order.paymentColor === 'amber' ? 'bg-amber-50/80 text-amber-600 border-amber-200/50' : ''}
                            ${order.paymentColor === 'red' ? 'bg-red-50/80 text-red-600 border-red-200/50' : ''}
                            font-bold shadow-none rounded-md px-2.5 py-0.5 text-[11px] uppercase tracking-wide
                          `}>
                            {order.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-5 text-center">
                          <div className="flex flex-col items-center gap-1.5 justify-center">
                            <Badge variant="outline" className={`
                              ${order.fulfillmentColor === 'blue' ? 'bg-blue-50/80 text-blue-600 border-blue-200/50' : ''}
                              ${order.fulfillmentColor === 'emerald' ? 'bg-emerald-50/80 text-emerald-600 border-emerald-200/50' : ''}
                              ${order.fulfillmentColor === 'slate' ? 'bg-slate-100 text-slate-600 border-slate-200/50' : ''}
                              ${order.fulfillmentColor === 'red' ? 'bg-red-50/80 text-red-600 border-red-200/50' : ''}
                              font-bold shadow-none rounded-md px-2.5 py-0.5 text-[11px] uppercase tracking-wide
                            `}>
                              {order.fulfillmentStatus}
                            </Badge>
                            {order.returnStatus && order.returnStatus !== 'None' && (
                              <Badge variant="outline" className={`
                                ${order.returnColor === 'emerald' ? 'bg-emerald-50/80 text-emerald-600 border-emerald-200/50' : ''}
                                ${order.returnColor === 'blue' ? 'bg-blue-50/80 text-blue-600 border-blue-200/50' : ''}
                                ${order.returnColor === 'red' ? 'bg-red-50/80 text-red-600 border-red-200/50' : ''}
                                ${order.returnColor === 'amber' ? 'bg-amber-50/80 text-amber-600 border-amber-200/50' : ''}
                                ${order.returnColor === 'slate' ? 'bg-slate-100 text-slate-600 border-slate-200/50' : ''}
                                font-bold shadow-none rounded-md px-2 py-0.5 text-[9px] uppercase tracking-wide
                              `}>
                                Ret: {order.returnStatus}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-5 pr-6">
                          <div className="w-24 text-xs font-semibold text-slate-600 leading-tight">
                            {order.method}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <CardFooter className="flex items-center justify-between p-4 border-t border-slate-100 bg-white flex-wrap gap-4">
              <p className="text-xs font-bold text-slate-500">
                Showing {from + 1}-{Math.min(to + 1, totalCount)} of {totalCount} orders
              </p>
              <div className="flex items-center gap-1">
                <Button
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-slate-600 border-slate-200 shadow-sm"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                
                {(() => {
                  const totalPages = Math.ceil(totalCount / limit) || 1
                  const pages: (number | string)[] = []
                  const range = 1
                  
                  for (let i = 1; i <= totalPages; i++) {
                    if (
                      i === 1 ||
                      i === totalPages ||
                      (i >= currentPage - range && i <= currentPage + range)
                    ) {
                      pages.push(i)
                    } else if (
                      i === currentPage - range - 1 ||
                      i === currentPage + range + 1
                    ) {
                      pages.push('...')
                    }
                  }
                  
                  const filteredPages = pages.filter((item, index, self) => {
                    return item !== '...' || self[index - 1] !== '...'
                  })

                  return filteredPages.map((page, idx) => {
                    if (page === '...') {
                      return (
                        <span key={idx} className="text-xs font-bold text-slate-400 mx-1">
                          ...
                        </span>
                      )
                    }
                    
                    const isCurrent = page === currentPage
                    return (
                      <Button
                        key={idx}
                        onClick={() => setCurrentPage(page as number)}
                        variant={isCurrent ? "outline" : "ghost"}
                        size="sm"
                        className={`h-8 w-8 p-0 text-xs font-bold ${
                          isCurrent 
                            ? "bg-black text-white hover:bg-black/90 border-0 shadow-sm" 
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {page}
                      </Button>
                    )
                  })
                })()}

                <Button
                  disabled={currentPage * limit >= totalCount || isLoading}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-slate-600 border-slate-200 shadow-sm"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </SidebarInset>
      <CreateOrderModal open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen} />
    </SidebarProvider>
  )
}
