"use client"

import React, { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { NotificationItem } from "./components/types"
import { NotificationHeader } from "./components/notification-header"
import { NotificationMetricsCards } from "./components/notification-metrics-cards"
import { NotificationFilters } from "./components/notification-filters"
import { NotificationTable } from "./components/notification-table"
import { CreateNotificationModal } from "./components/create-notification-modal"
import { RecipientLogsModal } from "./components/recipient-logs-modal"
import { DeleteNotificationDialog } from "./components/delete-notification-dialog"

export default function PushNotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<NotificationItem | null>(null)
  const [deletingNotificationId, setDeletingNotificationId] = useState<number | null>(null)
  const [selectedNotificationForRecipients, setSelectedNotificationForRecipients] =
    useState<NotificationItem | null>(null)

  // Fetch notifications log
  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ["notificationsLog"],
    queryFn: async () => {
      const res = await fetch("/api/marketing/notifications")
      if (!res.ok) throw new Error("Failed to fetch notifications")
      return res.json()
    }
  })

  const notificationsList: NotificationItem[] = notificationsData?.notifications || []

  // Aggregate Dashboard Metrics
  const metrics = useMemo(() => {
    let totalReach = 0
    let totalSent = 0
    let totalRead = 0

    notificationsList.forEach((n) => {
      totalReach += n.total_recipients || 0
      totalSent += n.total_sent || 0
      totalRead += n.total_read || 0
    })

    const deliveryRate = totalReach > 0 ? ((totalSent / totalReach) * 100).toFixed(1) : "0"
    const readRate = totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(1) : "0"

    return {
      totalCount: notificationsList.length,
      totalReach,
      totalSent,
      totalRead,
      deliveryRate,
      readRate
    }
  }, [notificationsList])

  // Filter notification history list
  const filteredNotifications = useMemo(() => {
    return notificationsList.filter((n) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = (n.title || "").toLowerCase().includes(q)
        const matchMessage = (n.message || "").toLowerCase().includes(q)
        if (!matchTitle && !matchMessage) return false
      }

      if (statusFilter !== "ALL" && n.status !== statusFilter) {
        return false
      }

      if (typeFilter !== "ALL" && n.notification_type !== typeFilter) {
        return false
      }

      return true
    })
  }, [searchQuery, statusFilter, typeFilter, notificationsList])

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white">
        <SiteHeader />
        <div className="flex gap-1 flex-col p-8 pt-6">


          {/* Stacked Header Component */}
          <NotificationHeader
            onRefresh={() => refetch()}
            onCreateClick={() => {
              setEditingNotification(null)
              setIsCreateModalOpen(true)
            }}
          />

          {/* Top Dashboard Metrics Component */}
          <NotificationMetricsCards metrics={metrics} />

          {/* Search & Filter Component */}
          <NotificationFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            onClearFilters={() => {
              setSearchQuery("")
              setStatusFilter("ALL")
              setTypeFilter("ALL")
            }}
          />

          {/* Notifications Log Table Component */}
          <NotificationTable
            notifications={filteredNotifications}
            isLoading={isLoading}
            onSelectRecipients={(notif: NotificationItem) => setSelectedNotificationForRecipients(notif)}
            onEdit={(notif: NotificationItem) => setEditingNotification(notif)}
            onDelete={(id: number) => setDeletingNotificationId(id)}
          />
        </div>

        {/* Modal: Create & Edit Notification */}
        <CreateNotificationModal
          isOpen={isCreateModalOpen}
          editingNotification={editingNotification}
          onClose={() => {
            setIsCreateModalOpen(false)
            setEditingNotification(null)
          }}
        />

        {/* Modal: Recipient Delivery Logs */}
        <RecipientLogsModal
          notification={selectedNotificationForRecipients}
          onClose={() => setSelectedNotificationForRecipients(null)}
        />

        {/* Modal: Delete Confirmation */}
        <DeleteNotificationDialog
          notificationId={deletingNotificationId}
          onClose={() => setDeletingNotificationId(null)}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
