"use client"

import React, { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, MessageSquare } from "lucide-react"
import { ClaimsTable } from "./components/claims-table"
import { FeedbackTable } from "./components/feedback-table"

export default function HelpsPage() {
  const [activeTab, setActiveTab] = useState("claims")

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Helps & Support</h1>
              <p className="text-xs font-medium text-slate-500 mt-1">Review user product claim inquiries and storefront feedback submissions.</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-xs mb-8 inline-flex items-center gap-1.5 h-auto">
              <TabsTrigger 
                value="claims" 
                className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 text-slate-600 hover:!text-slate-900 hover:bg-slate-100/80 data-[state=active]:bg-emerald-600 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-xs"
              >
                <FileText className="h-4 w-4" /> Claim Inquiries
              </TabsTrigger>
              <TabsTrigger 
                value="feedback" 
                className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 text-slate-600 hover:!text-slate-900 hover:bg-slate-100/80 data-[state=active]:bg-emerald-600 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-xs"
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
