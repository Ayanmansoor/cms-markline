"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, TrendingUpIcon } from "lucide-react"
import React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

import { UserOrdersTab } from "../components/user-orders-tab"
import { UserCartsTab } from "../components/user-carts-tab"
import { UserAddressesTab } from "../components/user-addresses-tab"
import { UserWishlistTab } from "../components/user-wishlist-tab"
import { UserReviewsTab } from "../components/user-reviews-tab"

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  // Fetch detailed customer profile
  const { data: detailsResponse, isLoading, error } = useQuery({
    queryKey: ["customer-details", id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}`)
      if (!res.ok) throw new Error("Failed to fetch customer profile details")
      return res.json()
    },
    enabled: !!id
  })

  const customer = detailsResponse?.customer || {}
  const metrics = detailsResponse?.metrics || { totalSpent: 0, totalOrdersCount: 0, aov: 0 }
  const orders = detailsResponse?.orders || []
  const carts = detailsResponse?.carts || []
  const addresses = detailsResponse?.addresses || []
  const wishlist = detailsResponse?.wishlist || []
  const reviews = detailsResponse?.reviews || []

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

  const badgeInfo = getCustomerBadge(metrics.totalSpent)

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
      <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">data is not present</p>
    </div>
  )

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen justify-center items-center">
          <div className="text-slate-500 font-semibold text-sm animate-pulse">Loading Customer Profile...</div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen justify-center items-center">
          <div className="text-red-500 font-semibold text-sm">Failed to load customer profile directory details.</div>
          <Button variant="outline" onClick={() => router.push("/customers")} className="mt-4 text-xs font-bold bg-white">
            Back to Directory
          </Button>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-8">

          {/* Page Header (Go Back link) */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/customers")}
              className="h-8 w-8 text-slate-500 hover:text-slate-800 border-slate-200 bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Profile</span>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Customer Directory Details</h1>
            </div>
          </div>

          {/* Top Profile Card */}
          <Card className="shadow-sm border border-slate-200 rounded-xl bg-white mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

                {/* Left Profile Section */}
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border border-slate-200 shadow-sm overflow-hidden bg-slate-100 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${customer.name || 'default'}`} alt={customer.name} className="w-full h-full object-cover" />
                    </div>
                    {metrics.totalSpent > 0 && (
                      <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
                      <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0 ${badgeInfo.classes}`}>
                        {badgeInfo.label}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-500">
                      {customer.email} <span className="mx-1">•</span> Phone: {customer.phone || "N/A"}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">
                      Joined: {customer.joined ? new Date(customer.joined).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Right Stats Section */}
                <div className="flex gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 min-w-[140px]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">TOTAL SPENT</p>
                    <h3 className="text-lg font-black text-slate-900 mb-1">{formatCurrency(metrics.totalSpent)}</h3>
                    <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 leading-none">
                      <TrendingUpIcon className="h-3 w-3" /> Lifetime LTV
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 min-w-[140px]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">TOTAL ORDERS</p>
                    <h3 className="text-lg font-black text-slate-900 mb-1">{metrics.totalOrdersCount}</h3>
                    <p className="text-[10px] font-semibold text-slate-500 leading-none">
                      Placed items
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 min-w-[140px]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">AOV</p>
                    <h3 className="text-lg font-black text-slate-900 mb-1">{formatCurrency(metrics.aov)}</h3>
                    <p className="text-[10px] font-semibold text-slate-500 leading-none">
                      Avg. order value
                    </p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="orders" className="w-full">
            <div className="border-b border-slate-200 mb-6">
              <TabsList className="bg-transparent border-0 h-auto p-0 gap-8 justify-start rounded-none">
                <TabsTrigger value="orders" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Orders</TabsTrigger>
                <TabsTrigger value="carts" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Carts</TabsTrigger>
                <TabsTrigger value="addresses" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Addresses</TabsTrigger>
                <TabsTrigger value="wishlist" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Wishlist</TabsTrigger>
                <TabsTrigger value="reviews" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Reviews</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="orders" className="mt-0 outline-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
              </div>
              <UserOrdersTab orders={orders} formatCurrency={formatCurrency} renderEmptyState={renderEmptyState} />
            </TabsContent>

            <TabsContent value="carts" className="mt-0 outline-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Active Cart Items</h3>
              </div>
              <UserCartsTab carts={carts} formatCurrency={formatCurrency} renderEmptyState={renderEmptyState} />
            </TabsContent>

            <TabsContent value="addresses" className="mt-0 outline-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Saved Addresses</h3>
              </div>
              <UserAddressesTab addresses={addresses} renderEmptyState={renderEmptyState} />
            </TabsContent>

            <TabsContent value="wishlist" className="mt-0 outline-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Wishlist Items</h3>
              </div>
              <UserWishlistTab wishlist={wishlist} formatCurrency={formatCurrency} renderEmptyState={renderEmptyState} />
            </TabsContent>

            <TabsContent value="reviews" className="mt-0 outline-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Product Reviews</h3>
              </div>
              <UserReviewsTab reviews={reviews} renderEmptyState={renderEmptyState} />
            </TabsContent>

          </Tabs>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
