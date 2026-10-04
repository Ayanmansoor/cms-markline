"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  BellRingIcon,
  Truck,
  Inbox,
  LayersIcon,
  MailIcon,
  CreditCardIcon,
  WarehouseIcon,
  SettingsIcon,
} from "lucide-react"

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

  useEffect(() => {
    const tab = searchParams?.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-background">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary" />
                Store Settings
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure store parameters, shipping integrations, warehouses, and notification settings.
              </p>
            </div>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 flex flex-wrap h-auto gap-1 bg-muted/50 p-1 border rounded-lg">
              <TabsTrigger value="header-alert" className="text-xs font-medium gap-1.5">
                <BellRingIcon className="h-3.5 w-3.5" /> Header Alert
              </TabsTrigger>
              <TabsTrigger value="shipping" className="text-xs font-medium gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Shipping
              </TabsTrigger>
              <TabsTrigger value="shiprocket" className="text-xs font-medium gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Shiprocket
              </TabsTrigger>
              <TabsTrigger value="newsletter" className="text-xs font-medium gap-1.5">
                <Inbox className="h-3.5 w-3.5" /> Newsletter
              </TabsTrigger>
              <TabsTrigger value="product-groups" className="text-xs font-medium gap-1.5">
                <LayersIcon className="h-3.5 w-3.5" /> Groups
              </TabsTrigger>
              <TabsTrigger value="warehouses" className="text-xs font-medium gap-1.5">
                <WarehouseIcon className="h-3.5 w-3.5" /> Warehouses
              </TabsTrigger>
              <TabsTrigger value="email" className="text-xs font-medium gap-1.5">
                <MailIcon className="h-3.5 w-3.5" /> Email SMTP
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs font-medium gap-1.5">
                <CreditCardIcon className="h-3.5 w-3.5" /> Payments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="header-alert">
              <HeaderAlertsTab />
            </TabsContent>

            <TabsContent value="shipping">
              <ShippingSettingsTab />
            </TabsContent>

            <TabsContent value="shiprocket">
              <ShiprocketTab />
            </TabsContent>

            <TabsContent value="newsletter">
              <NewsletterTab />
            </TabsContent>

            <TabsContent value="product-groups">
              <ProductGroupsTab />
            </TabsContent>

            <TabsContent value="warehouses">
              <WarehousesTab />
            </TabsContent>

            <TabsContent value="email">
              <Card className="border">
                <CardContent className="p-8 text-center">
                  <MailIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-foreground">Email SMTP Setup</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Configure mail server integrations (SendGrid, Mailgun, Amazon SES, or custom SMTP) to automate customer notifications.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card className="border">
                <CardContent className="p-8 text-center">
                  <CreditCardIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-foreground">Payment Gateways</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Enable payment gateways and integrations (Razorpay, Stripe, or Cashfree) for order checkouts.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground text-sm">
          Loading settings...
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  )
}
