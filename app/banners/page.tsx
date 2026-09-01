"use client"

import Link from "next/link"
import React, { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusIcon } from "lucide-react"
import { BannersTab } from "@/components/banners/banners-tab"
import { VideosTab } from "@/components/banners/videos-tab"

export default function BannersPage() {
  // ── Tab Switcher State ─────────────────────────────────────────────────────
  const [activeMainTab, setActiveMainTab] = useState<string>("banners")
  
  // ── Trigger Child Add Dialog State ─────────────────────────────────────────
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                <span>Dashboard</span>
                <span className="text-slate-300">&gt;</span>
                <span>Marketing</span>
                <span className="text-slate-300">&gt;</span>
                <span className="text-slate-700">{activeMainTab === "banners" ? "Home Banners" : "Shop Videos"}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[#0f172a]">
                {activeMainTab === "banners" ? "Home Banners" : "Shop Videos"}
              </h1>
            </div>
            <div className="flex gap-3">
              {activeMainTab === "banners" ? (
                <Button asChild className="text-xs font-bold text-white bg-black hover:bg-black/90 shadow-sm">
                  <Link href="/banners/create">
                    <PlusIcon className="h-4 w-4 mr-1.5" /> Add New Banner
                  </Link>
                </Button>
              ) : (
                <Button onClick={() => setIsAddVideoOpen(true)} className="text-xs font-bold text-white bg-black hover:bg-black/90 shadow-sm">
                  <PlusIcon className="h-4 w-4 mr-1.5" /> Add New Video
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="banners" value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
            <TabsList className="mb-6 bg-slate-200/60 p-1 rounded-xl border border-slate-200/50 w-fit flex gap-1 shadow-sm">
              <TabsTrigger
                value="banners"
                className="text-xs font-bold px-4 py-1.5 rounded-lg transition-all !text-slate-500 hover:!text-slate-900 data-[state=active]:!bg-white data-[state=active]:!text-slate-900 data-[state=active]:!shadow-sm data-[state=active]:!border-transparent"
              >
                Home Banners
              </TabsTrigger>
              <TabsTrigger
                value="videos"
                className="text-xs font-bold px-4 py-1.5 rounded-lg transition-all !text-slate-500 hover:!text-slate-900 data-[state=active]:!bg-white data-[state=active]:!text-slate-900 data-[state=active]:!shadow-sm data-[state=active]:!border-transparent"
              >
                Shop Videos
              </TabsTrigger>
            </TabsList>

            {/* TAB CONTENT: BANNERS */}
            <TabsContent value="banners" className="mt-0">
              <BannersTab />
            </TabsContent>

            {/* TAB CONTENT: SHOP VIDEOS */}
            <TabsContent value="videos" className="mt-0">
              <VideosTab isAddOpen={isAddVideoOpen} onAddOpenChange={setIsAddVideoOpen} />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
