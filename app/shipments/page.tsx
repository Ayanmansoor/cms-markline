"use client"

import React, { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ShipmentHeader } from "./components/shipment-header"
import { ShipmentFilters } from "./components/shipment-filters"
import { ShipmentTable } from "./components/shipment-table"
import { ShipmentCreateDialog } from "./components/shipment-create-dialog"
import { useShipments } from "./hooks/use-shipments"

function ShipmentsPageContent() {
  const {
    currentPage,
    setCurrentPage,
    limit,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    isCreateModalOpen,
    setIsCreateModalOpen,
    shipmentsData,
    isLoading,
    isFetching,
    refetch,
    warehouses,
    unshippedOrders,
    createMutation,
    syncTrackingMutation,
  } = useShipments()

  const shipments = shipmentsData?.shipments || []
  const totalCount = shipmentsData?.totalCount || 0

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col  p-4 md:p-6 bg-background">
          {/* Header */}
          <ShipmentHeader
            onRefresh={refetch}
            onCreateOpen={() => setIsCreateModalOpen(true)}
            isFetching={isFetching}
          />

          {/* Filters */}
          <ShipmentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
          />

          {/* Table */}
          <ShipmentTable
            shipments={shipments}
            totalCount={totalCount}
            currentPage={currentPage}
            limit={limit}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            onSyncTracking={(id) => syncTrackingMutation.mutate(id)}
          />

          {/* Create Dialog */}
          <ShipmentCreateDialog
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={(vals) => createMutation.mutate(vals)}
            warehouses={warehouses}
            unshippedOrders={unshippedOrders}
            isPending={createMutation.isPending}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function ShipmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground text-sm">
          Loading shipments...
        </div>
      }
    >
      <ShipmentsPageContent />
    </Suspense>
  )
}
