"use client"

import React, { useState, Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { BannersTab } from "../components/banners-tab"
import { CategoryBannerHeader } from "../components/category-banner-header"
import { useQueryClient } from "@tanstack/react-query"

function CategoryBannerPageContent() {
  const queryClient = useQueryClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const handleRefresh = async () => {
    setIsFetching(true)
    await queryClient.refetchQueries({ queryKey: ["collection-banners"] })
    setIsFetching(false)
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white flex flex-col h-screen overflow-hidden">
        <SiteHeader />
        <div className="flex-1 overflow-y-auto p-7 space-y-1">
          <CategoryBannerHeader
            onRefresh={handleRefresh}
            onAddOpen={() => setIsAddOpen(true)}
            isFetching={isFetching}
          />
          <BannersTab
            externalAddOpen={isAddOpen}
            onExternalAddClose={() => setIsAddOpen(false)}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function CategoryBannerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white text-slate-500 font-semibold text-sm">
          Loading category banners...
        </div>
      }
    >
      <CategoryBannerPageContent />
    </Suspense>
  )
}

