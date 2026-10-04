"use client"

import React, { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { ProductHeader } from "./components/product-header"
import { ProductFilters } from "./components/product-filters"
import { ProductStats } from "./components/product-stats"
import { ProductTable } from "./components/product-table"
import { useProducts } from "./hooks/use-products"

function ProductsPageContent() {
  const {
    currentPage,
    setCurrentPage,
    limit,
    selectedBrand,
    setSelectedBrand,
    selectedCollection,
    setSelectedCollection,
    selectedGender,
    setSelectedGender,
    selectedGroup,
    setSelectedGroup,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    filtersData,
    products,
    totalCount,
    isLoading,
    isFetching,
    refetchProducts,
    refetchAnalytics,
    analyticsData,
    deleteMutation,
    toggleActiveMutation,
    updateGroupMutation,
    productToDelete,
    setProductToDelete,
    handleExportCSV,
  } = useProducts()


  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white flex flex-col h-screen overflow-hidden">
        <SiteHeader />
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 min-w-0">
          {/* Module Header */}
          <ProductHeader
            onRefresh={() => {
              refetchProducts()
              refetchAnalytics()
            }}
            onExport={handleExportCSV}
            isFetching={isFetching}
          />

          {/* Analytics Cards */}
          {/* <ProductStats
            trendData={analyticsData?.trendData || []}
            stockAvailability={analyticsData?.stockAvailability ?? 0}
          /> */}

          {/* Filter Bar */}
          <ProductFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchInputRef={searchInputRef}
            selectedBrand={selectedBrand}
            onBrandChange={setSelectedBrand}
            selectedCollection={selectedCollection}
            onCollectionChange={setSelectedCollection}
            selectedGender={selectedGender}
            onGenderChange={setSelectedGender}
            selectedGroup={selectedGroup}
            onGroupChange={setSelectedGroup}
            filterOptions={filtersData}
          />

          {/* Product Data Table */}
          <ProductTable
            products={products}
            totalCount={totalCount}
            currentPage={currentPage}
            limit={limit}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            groups={filtersData?.groups || []}
            onUpdateGroup={(id, grouptype) =>
              updateGroupMutation.mutate({ id, grouptype })
            }
            onDelete={(id) => setProductToDelete(id)}
            onToggleActive={(id, currentStatus) =>
              toggleActiveMutation.mutate({ id, is_active: !currentStatus })
            }
          />

          {/* Destructive Delete Confirmation Dialog */}
          <DeleteConfirmDialog
            isOpen={!!productToDelete}
            onClose={() => setProductToDelete(null)}
            onConfirm={() => productToDelete && deleteMutation.mutate(productToDelete)}
            itemName={`Product #${productToDelete}`}
            isPending={deleteMutation.isPending}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground text-sm">
          Loading products...
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  )
}