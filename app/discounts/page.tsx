"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ZapIcon, CalendarIcon, TicketIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon, Trash2Icon, DownloadIcon, PlusIcon, Pencil } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"

export default function DiscountsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "upcoming" | "expired">("all")
  const queryClient = useQueryClient()

  // React Query call to get dynamic discounts list
  const { data: discountData, isLoading, error } = useQuery({
    queryKey: ["discounts", currentPage, limit, selectedStatus],
    queryFn: async () => {
      let url = `/api/discounts?page=${currentPage}&limit=${limit}`
      if (selectedStatus !== "all") {
        url += `&status=${selectedStatus}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch discounts")
      return res.json()
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  })

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // Delete mutation handler
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/discounts?id=${id}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete discount")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Discount deleted successfully! Task is complete")
      queryClient.invalidateQueries({ queryKey: ["discounts"] })
      setDeleteTargetId(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete discount")
    }
  })

  const handleDelete = (id: string) => {
    setDeleteTargetId(id)
  }

  const from = (currentPage - 1) * limit
  const to = from + limit - 1

  const discountsList = discountData?.discounts || []
  const totalCount = discountData?.totalCount || 0
  const metrics = discountData?.metrics || { activeCount: 0, upcomingCount: 0, totalUsage: 0 }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-8">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Discount Directory</h1>
              <p className="text-xs font-medium text-slate-500 mt-1">Manage and analyze your Discount</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="text-xs font-bold text-slate-700 border-slate-300 bg-white">
                <DownloadIcon className="h-3.5 w-3.5 mr-2" /> Export CSV
              </Button>
              <Button asChild className="text-xs font-bold text-white bg-black hover:bg-black/90">
                <Link href="/discounts/create">
                  <PlusIcon className="h-4 w-4 mr-1.5" /> Add Discount
                </Link>
              </Button>
            </div>
          </div>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-sm border border-slate-200 rounded-xl bg-white relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ACTIVE DISCOUNTS</p>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                    <ZapIcon className="w-4 h-4 fill-current" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <h3 className="text-3xl font-black text-slate-900">
                    {isLoading ? "..." : metrics.activeCount.toString().padStart(2, '0')}
                  </h3>
                  <span className="text-[11px] font-bold text-blue-600">Running Live</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[60%] h-full bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-slate-200 rounded-xl bg-white relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">UPCOMING CAMPAIGNS</p>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <h3 className="text-3xl font-black text-slate-900">
                    {isLoading ? "..." : metrics.upcomingCount.toString().padStart(2, '0')}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">Scheduled Ahead</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[30%] h-full bg-slate-700 rounded-full"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-slate-200 rounded-xl bg-white relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TOTAL USAGE</p>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                    <TicketIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <h3 className="text-3xl font-black text-slate-900">
                    {isLoading ? "..." : metrics.totalUsage.toLocaleString()}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">Total Redeemed</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-blue-500 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex bg-slate-200/50 p-1 rounded-lg border border-slate-200 shadow-inner">
              <button className="px-4 py-1.5 text-[11px] font-bold text-slate-900 bg-white rounded-md shadow-sm">List View</button>
              <button className="px-4 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors">Timeline View</button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Filter:</span>
                <Select
                  value={selectedStatus}
                  onValueChange={(val: any) => {
                    setSelectedStatus(val)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="border-0 bg-transparent p-0 h-6 shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="bg-white border border-slate-200 shadow-lg text-slate-900">
                    <SelectItem value="all" className="text-xs font-semibold">All Status</SelectItem>
                    <SelectItem value="active" className="text-xs font-semibold">Active</SelectItem>
                    <SelectItem value="upcoming" className="text-xs font-semibold">Upcoming</SelectItem>
                    <SelectItem value="expired" className="text-xs font-semibold">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-colors">
                <FilterIcon className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">More</span>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#f8fafc]">
                  <TableRow className="border-b border-slate-200 hover:bg-transparent">
                    <TableHead className="h-11 px-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">DISCOUNT NAME</TableHead>
                    <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">TYPE</TableHead>
                    <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">PERCENTAGE</TableHead>
                    <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">VALIDITY</TableHead>
                    <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">STATUS</TableHead>
                    <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">USAGE</TableHead>
                    <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center px-6">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-8 text-center text-xs font-semibold text-slate-400">
                        Loading discounts list data...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-8 text-center text-xs font-semibold text-red-500">
                        Error fetching discounts. Please verify database connection.
                      </TableCell>
                    </TableRow>
                  ) : discountsList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-8 text-center text-xs font-semibold text-slate-400">
                        No discounts found matching current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    discountsList.map((discount: any) => (
                      <TableRow key={discount.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-900 mb-0.5">{discount.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-wider">{discount.code}</p>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className="text-[9px] font-bold text-slate-500 bg-slate-100 border-slate-200 rounded-md tracking-wider">
                            {discount.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-xs font-bold text-slate-900">{discount.percentage}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <p className="text-xs font-semibold text-slate-700 mb-0.5">{discount.validityMain}</p>
                          <p className={`text-[10px] font-bold ${discount.validityColor}`}>{discount.validitySub}</p>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${discount.statusDot}`}></div>
                            <span className={`text-[11px] font-bold ${discount.statusColor}`}>{discount.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <p className="text-[11px] font-bold text-slate-700 mb-1.5">{discount.usage}</p>
                          <div className="w-12 h-0.5 bg-slate-100 rounded-full overflow-hidden">
                            {discount.progress > 0 ? (
                              <div className={`h-full ${discount.progressColor}`} style={{ width: `${discount.progress}%` }}></div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/discounts/${discount.id}`)}
                              className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deleteMutation.isPending}
                              onClick={() => handleDelete(discount.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-[#f8fafc] px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">
                Showing {from + 1}-{Math.min(to + 1, totalCount)} of {totalCount} discounts
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

      <DeleteConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
        title="Delete Discount"
        description="Are you sure you want to delete this discount campaign? This action cannot be undone."
        isPending={deleteMutation.isPending}
      />
    </div>
  </SidebarInset>
</SidebarProvider>
)
}
