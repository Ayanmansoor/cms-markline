"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { BannerHeader } from "./components/banner-header"
import { BannersTab } from "@/components/banners/banners-tab"
import { VideosTab } from "@/components/banners/videos-tab"

function BannersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [activeMainTab, setActiveMainTab] = useState<string>("banners")

  useEffect(() => {
    if (tabParam === "videos") {
      setActiveMainTab("videos")
    } else if (tabParam === "banners") {
      setActiveMainTab("banners")
    }
  }, [tabParam])

  const handleTabChange = (val: string) => {
    setActiveMainTab(val)
    router.push(`/banners?tab=${val}`, { scroll: false })
  }

  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false)

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-background">
          <BannerHeader
            activeTab={activeMainTab}
            onTabChange={handleTabChange}
            onAddOpen={() => setIsAddVideoOpen(true)}
          />

          <Tabs defaultValue="banners" value={activeMainTab} onValueChange={handleTabChange} className="w-full">
            <TabsContent value="banners" className="mt-0">
              <BannersTab />
            </TabsContent>
            <TabsContent value="videos" className="mt-0">
              <VideosTab isAddOpen={isAddVideoOpen} onAddOpenChange={setIsAddVideoOpen} />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function BannersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground text-sm">
          Loading banners...
        </div>
      }
    >
      <BannersPageContent />
    </Suspense>
  )
}
