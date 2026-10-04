"use client"

import React, { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { DiscountHeader } from "./components/discount-header"
import { DiscountFilters } from "./components/discount-filters"
import { DiscountTable } from "./components/discount-table"
import { useDiscounts } from "./hooks/use-discounts"

function DiscountsPageContent() {
  const {
    currentPage,
    setCurrentPage,
    limit,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    discounts,
    totalCount,
    isLoading,
    isFetching,
    refetch,
    deleteTargetId,
    setDeleteTargetId,
    deleteMutation,
  } = useDiscounts()

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col  p-4 md:p-6 bg-background">
          {/* Header */}
          <DiscountHeader onRefresh={refetch} isFetching={isFetching} />

          {/* Filters */}
          <DiscountFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />

          {/* Data Table */}
          <DiscountTable
            discounts={discounts}
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
            itemName={`Discount #${deleteTargetId}`}
            isPending={deleteMutation.isPending}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DiscountsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground text-sm">
          Loading discounts...
        </div>
      }
    >
      <DiscountsPageContent />
    </Suspense>
  )
}
