"use client"

import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "@tanstack/react-query"
import { CustomersTable } from "./components/customers-table"
import { CartsTable } from "./components/carts-table"
import { ReviewsTable } from "./components/reviews-table"
import { WishlistTable } from "./components/wishlist-table"
import { AddressesTable } from "./components/addresses-table"

export default function CustomersPage() {
  // Query to resolve general metrics for directory dashboard header
  const { data: metricsResponse, isLoading } = useQuery({
    queryKey: ["customers-metrics"],
    queryFn: async () => {
      const res = await fetch("/api/customers?page=1&limit=1")
      if (!res.ok) throw new Error("Failed to fetch general customer metrics")
      return res.json()
    }
  })

  const metrics = metricsResponse?.metrics || {
    totalCustomers: 0,
    activeUsers: 0,
    totalSales: 0,
    abandonedCartsCount: 0,
    abandonedCartsAmount: 0
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val)
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-8">

          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Customer Directory</h1>
              <p className="text-xs font-medium text-slate-500 mt-1">Manage and analyze your high-end clientele database.</p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
              <CardContent className="p-5">
                <p className="text-[9px] font-bold text-slate-500 capitalize tracking-wider mb-3">Active Users</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-900">
                    {isLoading ? "..." : (metrics.activeUsers ?? 0).toLocaleString()}
                  </h3>
                  <span className="text-[11px] font-bold text-blue-600">
                    {isLoading ? "" : `out of ${(metrics.totalCustomers || 0).toLocaleString()}`}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
              <CardContent className="p-5">
                <p className="text-[9px] font-bold text-slate-500 capitalize tracking-wider mb-3">Total Sales</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-900">
                    {isLoading ? "..." : formatCurrency(metrics.totalSales || 0)}
                  </h3>
                  <span className="text-[11px] font-bold text-blue-600">Revenue</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
              <CardContent className="p-5">
                <p className="text-[9px] font-bold text-slate-500 capitalize tracking-wider mb-3">Abandoned Cart</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-900">
                    {isLoading ? "..." : formatCurrency(metrics.abandonedCartsAmount || 0)}
                  </h3>
                  <span className="text-[11px] font-bold text-blue-600">
                    {isLoading ? "" : `${metrics.abandonedCartsCount || 0} Carts`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab system trigger grid */}
          <Tabs defaultValue="customers" className="w-full">
            <div className="border-b border-slate-200 mb-6">
              <TabsList className="bg-transparent border-0 h-auto p-0 gap-8 justify-start rounded-none">
                <TabsTrigger value="customers" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Customers</TabsTrigger>
                <TabsTrigger value="carts" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Carts</TabsTrigger>
                <TabsTrigger value="reviews" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Reviews</TabsTrigger>
                <TabsTrigger value="wishlists" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Wishlists</TabsTrigger>
                <TabsTrigger value="addresses" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Addresses</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="customers" className="mt-0 outline-none">
              <CustomersTable />
            </TabsContent>

            <TabsContent value="carts" className="mt-0 outline-none">
              <CartsTable />
            </TabsContent>

            <TabsContent value="reviews" className="mt-0 outline-none">
              <ReviewsTable />
            </TabsContent>

            <TabsContent value="wishlists" className="mt-0 outline-none">
              <WishlistTable />
            </TabsContent>

            <TabsContent value="addresses" className="mt-0 outline-none">
              <AddressesTable />
            </TabsContent>
          </Tabs>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
