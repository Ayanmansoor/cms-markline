"use client"

import React, { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { CategoryHeader } from "./components/category-header"
import { CategoryFilters } from "./components/category-filters"
import { CategoryTable } from "./components/category-table"
import { useCategory } from "./hooks/use-category"

function CategoryPageContent() {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    collections,
    totalCount,
    isLoading,
    isFetching,
    refetch,
    deleteTarget,
    setDeleteTarget,
    deleteMutation,
    updateStatusMutation,
  } = useCategory()

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white flex flex-col h-screen overflow-hidden">
        <SiteHeader />
        <div className="flex-1  p-7 space-y-2">
          {/* Header */}
          <CategoryHeader onRefresh={refetch} isFetching={isFetching} />

          {/* Filters */}
          <CategoryFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />

          {/* Table */}
          <CategoryTable
            collections={collections}
            totalCount={totalCount}
            isLoading={isLoading}
            onDelete={(id, name) => setDeleteTarget({ id, name })}
            onToggleStatus={(id, is_show) => updateStatusMutation.mutate({ id, is_show })}
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

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white text-slate-500 font-semibold text-sm">
          Loading categories...
        </div>
      }
    >
      <CategoryPageContent />
    </Suspense>
  )
}
