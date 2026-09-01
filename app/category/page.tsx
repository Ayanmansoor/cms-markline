"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import React from "react"
import { CollectionsTab } from "./components/collections-tab"

export default function CategoryPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Categories & Collections</h1>
            <p className="text-xs font-medium text-slate-500 mt-1">Configure your catalog listing structure, tags, collections and promo sliders.</p>
          </div>
          <CollectionsTab />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
