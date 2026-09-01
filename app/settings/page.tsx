"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BellRingIcon, Truck, Inbox, LayersIcon, StoreIcon, MailIcon, CreditCardIcon, WarehouseIcon } from "lucide-react"
import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { HeaderAlertsTab } from "./components/header-alerts-tab"
import { ShiprocketTab } from "./components/shiprocket-tab"
import { NewsletterTab } from "./components/newsletter-tab"
import { ProductGroupsTab } from "./components/product-groups-tab"
import { WarehousesTab } from "./components/warehouses-tab"
import { ShippingSettingsTab } from "./components/shipping-settings-tab"

function SettingsPageContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams?.get("tab") || "header-alert"
  const [activeTab, setActiveTab] = useState(initialTab)

  // Sync state if query parameter changes
  useEffect(() => {
    const tab = searchParams?.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-8">

          {/* Settings Tabs Container */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="py-2">
            <TabsList className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-xs mb-8 inline-flex items-center gap-1.5 flex-wrap h-auto">
              <TabsTrigger
                value="header-alert"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 text-slate-600 hover:!text-slate-900 hover:bg-slate-100/80 data-[state=active]:bg-emerald-600 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-xs"
              >
                <BellRingIcon className="h-4 w-4" /> Header Alert
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 text-slate-600 hover:!text-slate-900 hover:bg-slate-100/80 data-[state=active]:bg-emerald-600 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-xs"
              >
                <Truck className="h-4 w-4" /> Shipping Settings
              </TabsTrigger>
              <TabsTrigger
                value="shiprocket"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 text-slate-600 hover:!text-slate-900 hover:bg-slate-100/80 data-[state=active]:bg-emerald-600 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-xs"
              >
                <Truck className="h-4 w-4" /> Shiprocket
              </TabsTrigger>
              <TabsTrigger
                value="newsletter"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 text-slate-600 hover:!text-slate-900 hover:bg-slate-100/80 data-[state=active]:bg-emerald-600 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-xs"
              >
                <Inbox className="h-4 w-4" /> Newsletter
              </TabsTrigger>
              <TabsTrigger
                value="product-groups"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 text-slate-600 hover:!text-slate-900 hover:bg-slate-100/80 data-[state=active]:bg-emerald-600 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-xs"
              >
                <LayersIcon className="h-4 w-4" /> Product Groups
              </TabsTrigger>
              <TabsTrigger
                value="warehouses"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 text-slate-600 hover:!text-slate-900 hover:bg-slate-100/80 data-[state=active]:bg-emerald-600 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-xs"
              >
                <WarehouseIcon className="h-4 w-4" /> Warehouses
              </TabsTrigger>

              <TabsTrigger
                value="email"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 text-slate-600 hover:!text-slate-900 hover:bg-slate-100/80 data-[state=active]:bg-emerald-600 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-xs"
              >
                <MailIcon className="h-4 w-4" /> Email SMTP
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 text-slate-600 hover:!text-slate-900 hover:bg-slate-100/80 data-[state=active]:bg-emerald-600 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-xs"
              >
                <CreditCardIcon className="h-4 w-4" /> Payments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="header-alert" className="space-y-6">
              <HeaderAlertsTab />
            </TabsContent>

            <TabsContent value="shipping" className="space-y-6">
              <ShippingSettingsTab />
            </TabsContent>

            <TabsContent value="shiprocket" className="space-y-6">
              <ShiprocketTab />
            </TabsContent>

            <TabsContent value="newsletter" className="space-y-6">
              <NewsletterTab />
            </TabsContent>

            <TabsContent value="product-groups" className="space-y-6">
              <ProductGroupsTab />
            </TabsContent>

            <TabsContent value="warehouses" className="space-y-6">
              <WarehousesTab />
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs ">
                <MailIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-950">Email SMTP Setup</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
                  Configure mail server integrations (like SendGrid, Mailgun, Amazon SES, or custom SMTP) to automate dispatching customer notifications.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs ">
                <CreditCardIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-950">Payment Gateways</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
                  Enable dynamic payment gateways and integrations (like Razorpay, Stripe, or Cashfree) to streamline customer order checkouts.
                </p>
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f4f7fb]">
        <div className="text-slate-500 font-semibold text-sm animate-pulse">Loading settings...</div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  )
}
