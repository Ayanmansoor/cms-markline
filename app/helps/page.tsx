
"use client"

import React, { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { FileText, HelpCircle, MessageSquare, RefreshCw } from "lucide-react"
import { ClaimsTable } from "./components/claims-table"
import { FeedbackTable } from "./components/feedback-table"

export default function HelpsPage() {
  const [activeTab, setActiveTab] = useState("claims")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["helps-claims"] }),
      queryClient.invalidateQueries({ queryKey: ["helps-feedback"] }),
    ])
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4 md:p-6 bg-background min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/80">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-slate-700" />
                Helps & Support
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review user product claim inquiries and storefront feedback submissions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 text-xs font-medium cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100/80 border border-slate-200/80 rounded-lg p-1 shadow-2xs mb-4 inline-flex items-center gap-1 h-auto">
              <TabsTrigger 
                value="claims" 
                className="px-4 py-2 rounded-md text-xs font-medium flex items-center gap-2 transition-all text-slate-600 hover:text-slate-900 data-[state=active]:bg-slate-900 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-xs cursor-pointer"
              >
                <FileText className="h-4 w-4" /> Claim Inquiries
              </TabsTrigger>
              <TabsTrigger 
                value="feedback" 
                className="px-4 py-2 rounded-md text-xs font-medium flex items-center gap-2 transition-all text-slate-600 hover:text-slate-900 data-[state=active]:bg-slate-900 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-xs cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" /> User Feedback
              </TabsTrigger>
            </TabsList>

            <TabsContent value="claims" className="mt-0 outline-none">
              <ClaimsTable />
            </TabsContent>

            <TabsContent value="feedback" className="mt-0 outline-none">
              <FeedbackTable />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

