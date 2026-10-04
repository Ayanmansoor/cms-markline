"use client"

import React, { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { BrandHeader } from "./components/brand-header"
import { BrandFilters } from "./components/brand-filters"
import { BrandTable } from "./components/brand-table"
import { useBrands } from "./hooks/use-brands"

function BrandsPageContent() {
  const {
    currentPage,
    setCurrentPage,
    limit,
    selectedGender,
    setSelectedGender,
    selectedStatus,
    setSelectedStatus,
    brands,
    totalCount,
    isLoading,
    isFetching,
    refetch,
    deleteTarget,
    setDeleteTarget,
    deleteMutation,
  } = useBrands()

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white flex flex-col h-screen overflow-hidden">
        <SiteHeader />
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 p-4 md:p-6 bg-background">
          {/* Header */}
          <BrandHeader onRefresh={refetch} isFetching={isFetching} />

          {/* Filters */}
          <BrandFilters
            selectedGender={selectedGender}
            onGenderChange={setSelectedGender}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />

          {/* Data Table */}
          <BrandTable
            brands={brands}
            totalCount={totalCount}
            currentPage={currentPage}
            limit={limit}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            onDelete={(id, name) => setDeleteTarget({ id, name })}
          />

          {/* Delete Dialog */}
          <DeleteConfirmDialog
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            itemName={deleteTarget?.name}
            isPending={deleteMutation.isPending}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function BrandsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground text-sm">
          Loading brands...
        </div>
      }
    >
      <BrandsPageContent />
    </Suspense>
  )
}
