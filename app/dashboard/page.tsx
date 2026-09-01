"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { DownloadIcon, PlusIcon, Calendar } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { MetricSparkline } from "@/components/dashboard/metric-sparkline"
import { RecentOrdersTable } from "@/components/dashboard/recent-orders-table"
import { TopSellingProducts } from "@/components/dashboard/top-selling-products"

export default function DashboardPage() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M" | "1Y">("1M")

  // 1. Fetch Overview Analytics by Time Range
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["analytics-overview", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/overview?range=${timeRange}`)
      if (!res.ok) throw new Error("Failed to fetch analytics")
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  // 2. Fetch Real Recent Orders from Supabase
  const { data: ordersData } = useQuery({
    queryKey: ["dashboard-recent-orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders?page=1&limit=5")
      if (!res.ok) throw new Error("Failed to fetch recent orders")
      return res.json()
    },
  })

  // 3. Fetch Real Top Selling Products from order_items aggregation
  const { data: topProductsData } = useQuery({
    queryKey: ["dashboard-top-selling-products"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/top-products")
      if (!res.ok) throw new Error("Failed to fetch top selling products")
      return res.json()
    },
  })

  const metrics = analyticsData?.metrics || {
    totalRevenue: { value: "₹0.00", trend: "0.0%", trendType: "up", sparkline: [] },
    activeOrders: { value: "0", trend: "0.0%", trendType: "up", sparkline: [] },
    conversionRate: { value: "0.00%", trend: "0.0%", trendType: "up", sparkline: [] },
    avgOrderValue: { value: "₹0.00", trend: "0.0%", trendType: "up", sparkline: [] },
  }

  // Format real recent orders for display with product title, Rupee symbol, product images, and rawId redirect link
  const rawOrders = ordersData?.orders || []
  const formattedOrders = rawOrders.map((o: any) => {
    return {
      id: o.order_number || `ORD-${o.id.toString().slice(0, 6)}`,
      rawId: o.id,
      name: o.customer_name || "Storefront Guest",
      productName: o.product_name || o.productName || "Markline Product",
      amount: `₹${Number(o.grand_total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: o.fulfillment_status || o.payment_status || "Pending",
      initials: o.customer_initials || "PR",
      avatarBg: o.avatar_bg || "bg-slate-100",
      avatarText: o.avatar_text || "text-slate-700",
      imgUrl: o.image_url || null,
    }
  })

  // Format real top selling products from API response
  const formattedProducts = topProductsData?.products || []

  const timeRanges = [
    { label: "1 Month", value: "1M" },
    { label: "3 Months", value: "3M" },
    { label: "6 Months", value: "6M" },
    { label: "1 Year", value: "1Y" },
  ] as const

  const headerActions = (
    <div className="flex items-center gap-3">
      <Button variant="outline" className="text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs rounded-xl h-9">
        <DownloadIcon className="mr-1.5 h-3.5 w-3.5" /> Export CSV
      </Button>
      <Button asChild className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs rounded-xl h-9">
        <Link href="/products/create">
          <PlusIcon className="mr-1.5 h-3.5 w-3.5" /> Add Product
        </Link>
      </Button>
    </div>
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb]">
        <SiteHeader />
        <div className="flex flex-1 flex-col p-8 pt-6">
          <div className="flex items-center text-sm text-slate-500 mb-4 font-medium">
            <span className="hover:text-slate-900 cursor-pointer">Admin</span>
            <span className="mx-2">{'>'}</span>
            <span className="font-semibold text-slate-900">Dashboard</span>
          </div>

          <PageHeader
            title="Performance Overview"
            description="Core operational performance graphs and analytical reports."
            actions={headerActions}
          />

          {/* Time Range Selector Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6 bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xs flex-wrap">
            <div className="flex items-center gap-2 px-3 text-xs font-bold text-slate-700">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span>Analytical Period:</span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
              {timeRanges.map((range) => {
                const isActive = timeRange === range.value
                return (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-600 !text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                    }`}
                  >
                    {range.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <MetricCard
              title="Total Revenue"
              value={isAnalyticsLoading ? "..." : metrics.totalRevenue.value}
              trend={metrics.totalRevenue.trend}
              trendType={metrics.totalRevenue.trendType as "up" | "down"}
              chart={
                <MetricSparkline
                  data={metrics.totalRevenue.sparkline}
                  color="#10b981"
                  isFill={true}
                />
              }
            />

            <MetricCard
              title="Active Orders"
              value={isAnalyticsLoading ? "..." : metrics.activeOrders.value}
              trend={metrics.activeOrders.trend}
              trendType={metrics.activeOrders.trendType as "up" | "down"}
              chart={
                <MetricSparkline
                  data={metrics.activeOrders.sparkline}
                  color="#10b981"
                  isFill={false}
                />
              }
            />

            <MetricCard
              title="Conversion Rate"
              value={isAnalyticsLoading ? "..." : metrics.conversionRate.value}
              trend={metrics.conversionRate.trend}
              trendType={metrics.conversionRate.trendType as "up" | "down"}
              chart={
                <MetricSparkline
                  data={metrics.conversionRate.sparkline}
                  color={metrics.conversionRate.trendType === "down" ? "#f43f5e" : "#10b981"}
                  isFill={false}
                />
              }
            />

            <MetricCard
              title="Avg. Order Value"
              value={isAnalyticsLoading ? "..." : metrics.avgOrderValue.value}
              trend={metrics.avgOrderValue.trend}
              trendType={metrics.avgOrderValue.trendType as "up" | "down"}
              chart={
                <MetricSparkline
                  data={metrics.avgOrderValue.sparkline}
                  color="#10b981"
                  isFill={false}
                />
              }
            />
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            <RecentOrdersTable
              orders={formattedOrders}
              onViewAllClick={() => router.push("/orders")}
            />

            <TopSellingProducts
              products={formattedProducts}
              onReportClick={() => router.push("/products")}
            />
          </div>

          <div className="mt-auto pt-8 flex items-center justify-between text-xs text-slate-500 font-medium">
            <p>© 2024 Markline Enterprise Management. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Documentation</a>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
