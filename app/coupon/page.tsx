"use client"

import React, { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { CouponHeader } from "./components/coupon-header"
import { CouponFilters } from "./components/coupon-filters"
import { CouponTable } from "./components/coupon-table"
import { useCoupons } from "./hooks/use-coupons"

function CouponsPageContent() {
  const {
    currentPage,
    setCurrentPage,
    limit,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    coupons,
    totalCount,
    isLoading,
    isFetching,
    refetch,
    deleteTargetId,
    setDeleteTargetId,
    deleteMutation,
  } = useCoupons()

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white flex flex-col h-screen overflow-hidden">
        <SiteHeader />
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 p-4 md:p-6 bg-background">
          {/* Header */}
          <CouponHeader onRefresh={refetch} isFetching={isFetching} />

          {/* Filters */}
          <CouponFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />

          {/* Data Table */}
          <CouponTable
            coupons={coupons}
            totalCount={totalCount}
            currentPage={currentPage}
            limit={limit}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            onDelete={(id) => setDeleteTargetId(id)}
          />

          {/* Delete Dialog */}
          <DeleteConfirmDialog
            isOpen={!!deleteTargetId}
            onClose={() => setDeleteTargetId(null)}
            onConfirm={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
            itemName={`Coupon #${deleteTargetId}`}
            isPending={deleteMutation.isPending}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function CouponsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground text-sm">
          Loading coupons...
        </div>
      }
    >
      <CouponsPageContent />
    </Suspense>
  )
}
