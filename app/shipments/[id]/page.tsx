"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle } from "lucide-react"

import { CourierSelectionSheet } from "./courier-selection-sheet"
import { ShipmentHeader } from "./components/shipment-header"
import { PackageJourneyTracker } from "./components/package-journey-tracker"
import { PackageContentsTable } from "./components/package-contents-table"
import { ShiprocketSyncDesk } from "./components/shiprocket-sync-desk"
import { DatabaseOrderSummary } from "./components/database-order-summary"
import { DeliveryCoordinatesCard } from "./components/delivery-coordinates-card"
import { LogisticsUpdateDesk } from "./components/logistics-update-desk"

export default function ShipmentDetailPage() {
  const { id } = useParams()
  const [isCourierSheetOpen, setIsCourierSheetOpen] = useState(false)

  // Fetch single shipment details
  const { data: sData, isLoading, error } = useQuery({
    queryKey: ["shipmentDetail", id],
    queryFn: async () => {
      const res = await fetch(`/api/shipments/${id}`)
      if (!res.ok) throw new Error("Failed to fetch shipment details")
      return res.json()
    }
  })

  const shp = sData?.shipment

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#f4f7fb]">
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-500">Loading package details...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error || !shp) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#f4f7fb]">
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-900 mb-2">Shipment Details Error</p>
              <p className="text-xs text-slate-500 mb-4">{error?.message || "Shipment record could not be loaded."}</p>
              <Button asChild variant="outline" className="text-xs font-bold border-slate-200">
                <Link href="/shipments">Back to Shipments</Link>
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb]">
        <SiteHeader />
        <div className="flex flex-1 flex-col p-8 pt-6">

          {/* Header Action Row */}
          <ShipmentHeader
            shp={shp}
            onOpenCourierSheet={() => setIsCourierSheetOpen(true)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <PackageJourneyTracker shp={shp} />
              <PackageContentsTable shp={shp} formatCurrency={formatCurrency} />
              <ShiprocketSyncDesk shp={shp} formatCurrency={formatCurrency} />
              <DatabaseOrderSummary shp={shp} formatCurrency={formatCurrency} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <DeliveryCoordinatesCard shp={shp} />
              <LogisticsUpdateDesk id={String(id)} shp={shp} />
            </div>
          </div>
        </div>

        {/* Courier Partner Selection Sheet */}
        <CourierSelectionSheet
          isOpen={isCourierSheetOpen}
          onOpenChange={setIsCourierSheetOpen}
          shipmentId={String(shp.id)}
          shp={shp}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
