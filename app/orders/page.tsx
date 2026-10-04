"use client"

import React, { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { OrderHeader } from "./components/order-header"
import { OrderFilters } from "./components/order-filters"
import { OrderTable } from "./components/order-table"
import { CreateOrderModal } from "./components/create-order-modal"
import { useOrders } from "./hooks/use-orders"

function OrdersPageContent() {
  const {
    currentPage,
    setCurrentPage,
    limit,
    paymentStatus,
    setPaymentStatus,
    fulfillmentStatus,
    setFulfillmentStatus,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    isCreateOrderOpen,
    setIsCreateOrderOpen,
    orders,
    totalCount,
    isLoading,
    isFetching,
    refetch,
  } = useOrders()

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-2 p-4 md:p-6 bg-background">
          {/* Header */}
          <OrderHeader
            onRefresh={refetch}
            onCreateOpen={() => setIsCreateOrderOpen(true)}
            isFetching={isFetching}
          />

          {/* Filters */}
          <OrderFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            paymentStatus={paymentStatus}
            onPaymentStatusChange={setPaymentStatus}
            fulfillmentStatus={fulfillmentStatus}
            onFulfillmentStatusChange={setFulfillmentStatus}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          {/* Table */}
          <OrderTable
            orders={orders}
            totalCount={totalCount}
            currentPage={currentPage}
            limit={limit}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />

          {/* Create Order Modal */}
          <CreateOrderModal
            open={isCreateOrderOpen}
            onClose={() => setIsCreateOrderOpen(false)}
            onSuccess={refetch}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground text-sm">
          Loading orders...
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  )
}
