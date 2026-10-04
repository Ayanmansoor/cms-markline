"use client"

import React, { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { BlogHeader } from "./components/blog-header"
import { BlogFilters } from "./components/blog-filters"
import { BlogTable } from "./components/blog-table"
import { useBlogs } from "./hooks/use-blogs"

function BlogPostsPageContent() {
  const {
    currentPage,
    setCurrentPage,
    limit,
    statusFilter,
    setStatusFilter,
    searchValue,
    setSearchValue,
    blogs,
    totalCount,
    isLoading,
    isFetching,
    refetch,
    deleteTarget,
    setDeleteTarget,
    deleteMutation,
  } = useBlogs()

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-background">
          {/* Header */}
          <BlogHeader onRefresh={refetch} isFetching={isFetching} />

          {/* Filters */}
          <BlogFilters
            searchQuery={searchValue}
            onSearchChange={setSearchValue}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />

          {/* Data Table */}
          <BlogTable
            blogs={blogs}
            totalCount={totalCount}
            currentPage={currentPage}
            limit={limit}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            onDelete={(id, title) => setDeleteTarget({ id, title })}
          />

          {/* Delete Dialog */}
          <DeleteConfirmDialog
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            itemName={deleteTarget?.title}
            isPending={deleteMutation.isPending}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function BlogPostsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground text-sm">
          Loading blog posts...
        </div>
      }
    >
      <BlogPostsPageContent />
    </Suspense>
  )
}
