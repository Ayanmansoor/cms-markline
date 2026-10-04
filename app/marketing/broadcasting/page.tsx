"use client"

import React, { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Radio, Users } from "lucide-react"

import { EmailCampaignItem } from "./components/types"
import { BroadcastingHeader } from "./components/broadcasting-header"
import { BroadcastingMetricsCards } from "./components/broadcasting-metrics-cards"
import { CampaignsTable } from "./components/campaigns-table"
import { CustomersDirectoryTable } from "./components/customers-directory-table"
import { CreateCampaignModal } from "./components/create-campaign-modal"
import { RecipientLogsModal } from "./components/recipient-logs-modal"
import { DeleteCampaignDialog } from "./components/delete-campaign-dialog"

export default function CustomerBroadcastingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTargetCustomerId, setSelectedTargetCustomerId] = useState<string | null>(null)
  const [deletingCampaignId, setDeletingCampaignId] = useState<number | null>(null)
  const [selectedCampaignForRecipients, setSelectedCampaignForRecipients] =
    useState<EmailCampaignItem | null>(null)

  // Fetch email campaigns history
  const {
    data: broadcastsData,
    isLoading: loadingBroadcasts,
    refetch: refetchBroadcasts
  } = useQuery({
    queryKey: ["emailCampaigns"],
    queryFn: async () => {
      const res = await fetch("/api/marketing/broadcasting")
      if (!res.ok) throw new Error("Failed to fetch email campaigns")
      return res.json()
    }
  })

  const campaignsList: EmailCampaignItem[] =
    broadcastsData?.broadcasts || broadcastsData?.campaigns || []

  // Fetch customers directory
  const {
    data: customersData,
    isLoading: loadingCustomers,
    refetch: refetchCustomers
  } = useQuery({
    queryKey: ["customersDirectory"],
    queryFn: async () => {
      const res = await fetch("/api/customers?limit=100")
      if (!res.ok) throw new Error("Failed to fetch customers")
      return res.json()
    }
  })

  const customersList = customersData?.customers || []

  // Filter customer directory based on search query
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customersList
    const q = customerSearchQuery.toLowerCase()
    return customersList.filter(
      (c: any) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
    )
  }, [customerSearchQuery, customersList])

  // Filter broadcast campaign history
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaignsList
    const q = searchQuery.toLowerCase()
    return campaignsList.filter(
      (b) =>
        (b.subject || "").toLowerCase().includes(q) ||
        (b.html_content || "").toLowerCase().includes(q)
    )
  }, [searchQuery, campaignsList])

  // Aggregate Dashboard Metrics
  const metrics = useMemo(() => {
    let totalSent = 0
    let totalFailed = 0
    let totalOpened = 0

    campaignsList.forEach((c) => {
      totalSent += c.total_sent || 0
      totalFailed += c.total_failed || 0
      totalOpened += c.total_opened || 0
    })

    const reachableEmails = customersList.filter(
      (c: any) => c.email && c.email.includes("@")
    ).length

    return {
      totalCampaigns: campaignsList.length,
      emailReach: totalSent > 0 ? totalSent : reachableEmails,
      totalFailed,
      totalOpened,
      totalCustomers: customersList.length
    }
  }, [campaignsList, customersList])

  const openDirectTargetBroadcast = (customerId: string) => {
    setSelectedTargetCustomerId(customerId)
    setIsCreateModalOpen(true)
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white">
        <SiteHeader />
        <div className="flex flex-1 flex-col p-8 pt-6">
          {/* Header Component */}
          <BroadcastingHeader
            onRefresh={() => {
              refetchBroadcasts()
              refetchCustomers()
            }}
            onCreateClick={() => {
              setSelectedTargetCustomerId(null)
              setIsCreateModalOpen(true)
            }}
          />

          {/* Metrics Cards Component */}
          <BroadcastingMetricsCards metrics={metrics} />

          {/* Tabs for Campaigns Log vs Customer Directory */}
          <Tabs defaultValue="campaigns" className="space-y-6">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
              <TabsTrigger
                value="campaigns"
                className="text-xs font-bold px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white cursor-pointer"
              >
                <Radio className="h-3.5 w-3.5 mr-2" /> Email Campaigns Log
              </TabsTrigger>
              <TabsTrigger
                value="customers"
                className="text-xs font-bold px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white cursor-pointer"
              >
                <Users className="h-3.5 w-3.5 mr-2" /> Customer Directory
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Campaigns Table */}
            <TabsContent value="campaigns">
              <CampaignsTable
                campaigns={filteredCampaigns}
                isLoading={loadingBroadcasts}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClearSearch={() => setSearchQuery("")}
                onSelectRecipients={(campaign) => setSelectedCampaignForRecipients(campaign)}
                onDelete={(id) => setDeletingCampaignId(id)}
              />
            </TabsContent>

            {/* TAB 2: Customer Reach Directory */}
            <TabsContent value="customers">
              <CustomersDirectoryTable
                customers={filteredCustomers}
                isLoading={loadingCustomers}
                searchQuery={customerSearchQuery}
                onSearchChange={setCustomerSearchQuery}
                onClearSearch={() => setCustomerSearchQuery("")}
                onTargetCustomer={openDirectTargetBroadcast}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal: Create & Dispatch Email Campaign */}
        <CreateCampaignModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false)
            setSelectedTargetCustomerId(null)
          }}
          customersList={customersList}
          initialSelectedCustomerIds={
            selectedTargetCustomerId ? [selectedTargetCustomerId] : []
          }
        />

        {/* Modal: Campaign Recipient Logs */}
        <RecipientLogsModal
          campaign={selectedCampaignForRecipients}
          onClose={() => setSelectedCampaignForRecipients(null)}
        />

        {/* Modal: Delete Confirmation */}
        <DeleteCampaignDialog
          campaignId={deletingCampaignId}
          onClose={() => setDeletingCampaignId(null)}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
