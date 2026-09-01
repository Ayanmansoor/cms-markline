"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import {
  Bell,
  Send,
  Plus,
  RefreshCcw,
  Search,
  Users,
  CheckCircle2,
  Loader2,
  Smartphone,
  ExternalLink,
  Flame,
  Calendar,
  Eye,
  Megaphone,
  ShoppingBag,
  Info,
  Clock,
  CheckCheck,
  MousePointerClick,
  Trash2,
  Pencil,
  Folder,
  ChevronDown,
  Image
} from "lucide-react"
import React, { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface NotificationItem {
  id: number
  created_at: string
  updated_at: string
  title: string
  message: string
  banner_url: string | null
  action_url: string | null
  notification_type: "PROMOTIONAL" | "SYSTEM" | "ORDER_UPDATE" | "ANNOUNCEMENT" | "PUSH"
  audience: "ALL" | "SPECIFIC"
  status: "DRAFT" | "SCHEDULED" | "SENT" | "CANCELLED"
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  total_sent: number
  total_read: number
  created_by: string | null
}

export interface NotificationRecipientItem {
  id: number
  created_at: string
  notification_id: number
  user_id: string
  delivery_status: "PENDING" | "SENT" | "DELIVERED" | "FAILED"
  sent_at: string | null
  is_read: boolean
  read_at: string | null
  is_clicked: boolean
  clicked_at: string | null
}

interface CreateNotificationFormValues {
  title: string
  message: string
  banner_url: string
  action_url: string
  notification_type: "PROMOTIONAL" | "SYSTEM" | "ORDER_UPDATE" | "ANNOUNCEMENT" | "PUSH"
  audience: "ALL" | "SPECIFIC"
}

const defaultNotificationValues: CreateNotificationFormValues = {
  title: "",
  message: "",
  banner_url: "",
  action_url: "",
  notification_type: "PUSH",
  audience: "ALL"
}

export default function PushNotificationsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<NotificationItem | null>(null)
  const [deletingNotificationId, setDeletingNotificationId] = useState<number | null>(null)

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")

  // Recipient Tracking Modal state
  const [selectedNotificationForRecipients, setSelectedNotificationForRecipients] = useState<NotificationItem | null>(null)

  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateNotificationFormValues>({
    defaultValues: defaultNotificationValues
  })

  const currentAudience = watch("audience")
  const bannerUrl = watch("banner_url")

  // ── Image upload states ───────────────────────────────────────────────────
  const [bannerUploadMethod, setBannerUploadMethod] = useState<"url" | "file">("url")
  const [bannerLocalFile, setBannerLocalFile] = useState<File | null>(null)
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [isFoldersLoading, setIsFoldersLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Load GitHub folders on mount
  useEffect(() => {
    async function loadFolders() {
      setIsFoldersLoading(true)
      try {
        const res = await fetch("/api/upload/folders")
        if (res.ok) {
          const data = await res.json()
          if (data.folders && Array.isArray(data.folders)) {
            setFolders(data.folders)
            if (data.folders.length > 0) setSelectedFolder(data.folders[0])
          }
        }
      } catch (err) {
        console.error("Failed to load GitHub repository folders:", err)
      } finally {
        setIsFoldersLoading(false)
      }
    }
    loadFolders()
  }, [])

  // Auto-route folder based on filename (scoring logic)
  const autoRouteFolder = (filename: string) => {
    if (folders.length === 0) return
    const filenameLower = filename.toLowerCase()
    let bestMatch = ""
    let maxScore = 0
    for (const folderPath of folders) {
      const parts = folderPath.toLowerCase().split('/')
      const folderName = parts[parts.length - 1]
      const keywords = folderName.split(/[-_\s]/).filter(w => w.length > 2)
      keywords.push(folderName)
      let score = 0
      for (const word of keywords) {
        if (filenameLower.includes(word)) score += word.length
      }
      if (score > maxScore) { maxScore = score; bestMatch = folderPath }
    }
    if (maxScore > 0 && bestMatch) {
      setSelectedFolder(bestMatch)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerLocalFile(file)
    setValue("banner_url", URL.createObjectURL(file))
    autoRouteFolder(file.name)
  }

  // Reset form when modal opens or closes
  useEffect(() => {
    if (editingNotification) {
      setValue("title", editingNotification.title)
      setValue("message", editingNotification.message)
      setValue("banner_url", editingNotification.banner_url || "")
      setValue("action_url", editingNotification.action_url || "")
      setValue("notification_type", editingNotification.notification_type)
      setValue("audience", editingNotification.audience)
      setBannerUploadMethod("url")
      setBannerLocalFile(null)
    } else if (!isCreateModalOpen) {
      reset(defaultNotificationValues)
      setSelectedUserIds([])
      setCustomerSearchQuery("")
      setBannerUploadMethod("url")
      setBannerLocalFile(null)
    }
  }, [isCreateModalOpen, editingNotification, reset, setValue])

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

  // Fetch recipients for selected notification
  const { data: recipientsData, isLoading: isLoadingRecipients } = useQuery({
    queryKey: ["notificationRecipients", selectedNotificationForRecipients?.id],
    queryFn: async () => {
      if (!selectedNotificationForRecipients) return null
      const res = await fetch(`/api/marketing/notifications/${selectedNotificationForRecipients.id}/recipients`)
      if (!res.ok) throw new Error("Failed to fetch recipients log")
      return res.json()
    },
    enabled: !!selectedNotificationForRecipients
  })

  const recipientsList: NotificationRecipientItem[] = recipientsData?.recipients || []

  // Fetch customers list for targeting selection
  const { data: customersData } = useQuery({
    queryKey: ["customersListForTargeting"],
    queryFn: async () => {
      const res = await fetch("/api/customers?limit=100")
      if (!res.ok) throw new Error("Failed to fetch customers list")
      return res.json()
    },
    enabled: (isCreateModalOpen || !!editingNotification) && currentAudience === "SPECIFIC"
  })

  const customersList = customersData?.customers || []

  // Filter customers based on search input
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customersList
    const q = customerSearchQuery.toLowerCase()
    return customersList.filter((c: any) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    )
  }, [customerSearchQuery, customersList])

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

  // Mutation to create or update notification
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const isEdit = !!editingNotification
      const url = isEdit ? `/api/marketing/notifications/${editingNotification.id}` : "/api/marketing/notifications"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to save notification")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || (editingNotification ? "Notification updated!" : "Firebase Push Notification dispatched!"))
      setIsCreateModalOpen(false)
      setEditingNotification(null)
      queryClient.invalidateQueries({ queryKey: ["notificationsLog"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  // Mutation to delete notification
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/marketing/notifications/${id}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to delete notification")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || "Notification deleted successfully!")
      setDeletingNotificationId(null)
      queryClient.invalidateQueries({ queryKey: ["notificationsLog"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    if (selectedFolder) {
      formData.append("folder", selectedFolder)
    }
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Image upload failed")
    return data.url
  }

  const onSubmitNotification = async (data: CreateNotificationFormValues) => {
    if (!data.title.trim()) {
      toast.error("Notification Title is required")
      return
    }
    if (!data.message.trim()) {
      toast.error("Message content is required")
      return
    }
    if (data.audience === "SPECIFIC" && selectedUserIds.length === 0 && !editingNotification) {
      toast.error("Please select at least one customer to target")
      return
    }

    setIsUploading(true)
    const toastId = "notification-send"
    toast.loading(editingNotification ? "Saving notification changes..." : "Processing push notification dispatch...", { id: toastId })

    try {
      let finalBannerUrl = data.banner_url.trim()

      if (bannerUploadMethod === "file" && bannerLocalFile) {
        toast.loading("Uploading banner image to GitHub...", { id: toastId })
        finalBannerUrl = await uploadFile(bannerLocalFile)
      }

      toast.loading(editingNotification ? "Saving notification..." : "Dispatching notification...", { id: toastId })
      saveMutation.mutate({
        title: data.title.trim(),
        message: data.message.trim(),
        banner_url: finalBannerUrl || null,
        action_url: data.action_url.trim(),
        notification_type: data.notification_type,
        audience: data.audience,
        targetUserIds: selectedUserIds
      }, {
        onSuccess: (resData) => {
          toast.success(resData.message || (editingNotification ? "Notification updated!" : "Firebase Push Notification dispatched!"), { id: toastId })
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to save notification", { id: toastId })
        }
      })
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const toggleSelectCustomer = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Filter notification history list
  const filteredNotifications = useMemo(() => {
    return notificationsList.filter((n) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = (n.title || "").toLowerCase().includes(q)
        const matchMessage = (n.message || "").toLowerCase().includes(q)
        if (!matchTitle && !matchMessage) return false
      }

      // Status Filter
      if (statusFilter !== "ALL" && n.status !== statusFilter) {
        return false
      }

      // Type Filter
      if (typeFilter !== "ALL" && n.notification_type !== typeFilter) {
        return false
      }

      return true
    })
  }, [searchQuery, statusFilter, typeFilter, notificationsList])

  // Badge helpers
  const renderTypeBadge = (type: NotificationItem["notification_type"]) => {
    switch (type) {
      case "PROMOTIONAL":
        return (
          <Badge variant="outline" className="text-[9px] font-bold bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1 w-max">
            <Flame className="h-3 w-3" /> Promotional
          </Badge>
        )
      case "ORDER_UPDATE":
        return (
          <Badge variant="outline" className="text-[9px] font-bold bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 w-max">
            <ShoppingBag className="h-3 w-3" /> Order Update
          </Badge>
        )
      case "ANNOUNCEMENT":
        return (
          <Badge variant="outline" className="text-[9px] font-bold bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 w-max">
            <Megaphone className="h-3 w-3" /> Announcement
          </Badge>
        )
      case "SYSTEM":
        return (
          <Badge variant="outline" className="text-[9px] font-bold bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-1 w-max">
            <Info className="h-3 w-3" /> System
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 w-max">
            <Smartphone className="h-3 w-3" /> Push
          </Badge>
        )
    }
  }

  const renderStatusBadge = (status: NotificationItem["status"]) => {
    switch (status) {
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Sent
          </span>
        )
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 text-amber-500" />
            Scheduled
          </span>
        )
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-slate-100 text-slate-600 border-slate-200">
            Draft
          </span>
        )
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-red-50 text-red-700 border-red-200">
            Cancelled
          </span>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb]">
        <SiteHeader />
        <div className="flex flex-1 flex-col p-8 pt-6">

          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-slate-500 mb-4 font-medium">
            <span className="hover:text-slate-900 cursor-pointer">Marketing</span>
            <span className="mx-2">{'>'}</span>
            <span className="font-semibold text-slate-900">Push Notifications & Messaging</span>
          </div>

          {/* Heading */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] flex items-center gap-2">
                <Bell className="h-7 w-7 text-black" />
                Push Notifications (FCM)
              </h1>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                Dispatch & manage Firebase push notifications, promotional announcements, and user message logs.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
              >
                <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Refresh Log
              </Button>
              <Button
                onClick={() => {
                  setEditingNotification(null)
                  setIsCreateModalOpen(true)
                }}
                className="text-xs font-bold bg-black text-white hover:bg-black/90 shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Notification
              </Button>
            </div>
          </div>

          {/* Top Level Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatched</p>
                  <p className="text-xl font-bold text-slate-900">{metrics.totalCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Reach</p>
                  <p className="text-xl font-bold text-slate-900">{metrics.totalReach.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Rate</p>
                  <p className="text-xl font-bold text-slate-900">{metrics.deliveryRate}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Read Rate</p>
                  <p className="text-xl font-bold text-slate-900">{metrics.readRate}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white mb-6">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notifications by title or message content..."
                    className="pl-9 text-xs border-slate-200 bg-slate-50/50 !text-black h-9"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-9 text-xs font-semibold bg-white border-slate-200 text-slate-900">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="ALL" className="text-xs font-semibold">All Statuses</SelectItem>
                    <SelectItem value="SENT" className="text-xs font-semibold">Sent</SelectItem>
                    <SelectItem value="SCHEDULED" className="text-xs font-semibold">Scheduled</SelectItem>
                    <SelectItem value="DRAFT" className="text-xs font-semibold">Draft</SelectItem>
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40 h-9 text-xs font-semibold bg-white border-slate-200 text-slate-900">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="ALL" className="text-xs font-semibold">All Types</SelectItem>
                    <SelectItem value="PUSH" className="text-xs font-semibold">Push</SelectItem>
                    <SelectItem value="PROMOTIONAL" className="text-xs font-semibold">Promotional</SelectItem>
                    <SelectItem value="ORDER_UPDATE" className="text-xs font-semibold">Order Update</SelectItem>
                    <SelectItem value="ANNOUNCEMENT" className="text-xs font-semibold">Announcement</SelectItem>
                    <SelectItem value="SYSTEM" className="text-xs font-semibold">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL") && (
                <Button
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("ALL")
                    setTypeFilter("ALL")
                  }}
                  variant="ghost"
                  className="text-xs font-bold text-red-600 hover:text-red-700 h-9"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>

          {/* History Table */}
          <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white overflow-hidden">
            {isLoading ? (
              <div className="py-24 text-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-500">Loading notifications log...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-24 text-center">
                <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-400">No notifications found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-b border-slate-100">
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Title & Content</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Type & Audience</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Status</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Sent / Reach</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Total Read</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Date</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.map((notif) => (
                      <TableRow key={notif.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex items-start gap-3">
                            {notif.banner_url && (
                              <img
                                src={notif.banner_url}
                                alt="Banner"
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 mt-0.5"
                              />
                            )}
                            <div>
                              <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                              {notif.action_url && (
                                <a
                                  href={notif.action_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                >
                                  Link: {notif.action_url} <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 space-y-1">
                          {renderTypeBadge(notif.notification_type)}
                          {notif.audience === "ALL" ? (
                            <Badge variant="outline" className="text-[9px] font-bold bg-blue-50 text-blue-700 border-blue-200 block w-max">
                              All Customers
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-bold bg-purple-50 text-purple-700 border-purple-200 block w-max">
                              Targeted Users
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="py-4">
                          {renderStatusBadge(notif.status)}
                        </TableCell>

                        <TableCell className="py-4">
                          <p className="text-xs font-bold text-slate-900">
                            {notif.total_sent} / {notif.total_recipients}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">recipients</p>
                        </TableCell>

                        <TableCell className="py-4">
                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                            {notif.total_read}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {notif.total_sent > 0 ? `${((notif.total_read / notif.total_sent) * 100).toFixed(0)}% read` : '0%'}
                          </p>
                        </TableCell>

                        <TableCell className="py-4 text-xs text-slate-600 font-medium">
                          {notif.status === "SCHEDULED" && notif.scheduled_at ? (
                            <div>
                              <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Scheduled
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {new Date(notif.scheduled_at).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                {notif.sent_at ? new Date(notif.sent_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric"
                                }) : new Date(notif.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric"
                                })}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {notif.sent_at ? new Date(notif.sent_at).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit"
                                }) : ""}
                              </p>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              onClick={() => setSelectedNotificationForRecipients(notif)}
                              variant="outline"
                              size="sm"
                              className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                            >
                              <Users className="h-3.5 w-3.5 mr-1 text-slate-500" /> Logs
                            </Button>

                            <Button
                              onClick={() => {
                                setEditingNotification(notif)
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              onClick={() => setDeletingNotificationId(notif.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>

        {/* Create / Edit Notification Modal */}
        <Dialog
          open={isCreateModalOpen || !!editingNotification}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateModalOpen(false)
              setEditingNotification(null)
            }
          }}
        >
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                {editingNotification ? `Edit Notification #${editingNotification.id}` : "Dispatch FCM Push Notification"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">

              {/* Title */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Notification Title <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register("title")}
                  placeholder="e.g. 🔥 Weekend Flash Sale Starts Now!"
                  className="h-10 text-xs border-slate-200 bg-white text-slate-900 font-semibold shadow-sm"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Message Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("message")}
                  placeholder="Enter the main notification body text..."
                  className="w-full h-20 p-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-blue-500 resize-none shadow-sm"
                />
              </div>

              {/* Type & Audience Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Notification Type
                  </label>
                  <Select
                    value={watch("notification_type")}
                    onValueChange={(val: any) => setValue("notification_type", val)}
                  >
                    <SelectTrigger className="w-full h-10 text-xs font-semibold text-slate-900 border-slate-200 bg-white shadow-sm">
                      <SelectValue placeholder="Type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 shadow-lg">
                      <SelectItem value="PUSH" className="text-xs font-semibold">Push Notification</SelectItem>
                      <SelectItem value="PROMOTIONAL" className="text-xs font-semibold">Promotional Campaign</SelectItem>
                      <SelectItem value="ORDER_UPDATE" className="text-xs font-semibold">Order Status Update</SelectItem>
                      <SelectItem value="ANNOUNCEMENT" className="text-xs font-semibold">General Announcement</SelectItem>
                      <SelectItem value="SYSTEM" className="text-xs font-semibold">System Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Target Audience
                  </label>
                  <Select
                    value={currentAudience}
                    onValueChange={(val: any) => setValue("audience", val)}
                  >
                    <SelectTrigger className="w-full h-10 text-xs font-semibold text-slate-900 border-slate-200 bg-white shadow-sm">
                      <SelectValue placeholder="Audience..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 shadow-lg">
                      <SelectItem value="ALL" className="text-xs font-semibold">Broadcast to All Registered Customers</SelectItem>
                      <SelectItem value="SPECIFIC" className="text-xs font-semibold">Target Specific Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Link */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Action URL / Deep Link (Optional)
                </label>
                <Input
                  {...register("action_url")}
                  placeholder="/products or https://..."
                  className="h-9 text-xs border-slate-200 bg-white text-slate-900"
                />
              </div>

              {/* Banner Image Source Toggle & Directory Selector */}
              <div className="space-y-3 pt-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Banner / Image Source (Optional)
                </label>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBannerUploadMethod("url")}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      bannerUploadMethod === "url"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Paste URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerUploadMethod("file")}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      bannerUploadMethod === "file"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Upload File
                  </button>
                </div>

                {bannerUploadMethod === "url" ? (
                  <Input
                    {...register("banner_url")}
                    placeholder="https://domain.com/banner.jpg"
                    className="h-9 text-xs border-slate-200 bg-white text-slate-900"
                  />
                ) : (
                  <div className="space-y-3">
                    {/* GitHub Storage Folder Dropdown */}
                    <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-4 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-900">GitHub Storage Folder</span>
                      </div>
                      <div className="relative">
                        <select
                          value={selectedFolder}
                          disabled={isFoldersLoading}
                          onChange={e => setSelectedFolder(e.target.value)}
                          className="w-full h-9 pl-3 pr-10 text-xs font-bold text-slate-800 border border-slate-200 rounded-lg bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          {isFoldersLoading ? (
                            <option value="">Loading repository folders...</option>
                          ) : (
                            <>
                              <option value="">/ (Root)</option>
                              {folders.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </>
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>

                    {/* File Input */}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="h-10 text-xs border-slate-200 bg-white text-slate-900 cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                    />
                  </div>
                )}

                {/* Banner Image Preview */}
                {bannerUrl && (
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden mt-3 bg-slate-50">
                    <div className="aspect-[21/9] w-full flex items-center justify-center overflow-hidden">
                      <img
                        src={bannerUrl}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/900x385?text=Invalid+Image+URL" }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setValue("banner_url", "")
                        setBannerLocalFile(null)
                      }}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>



              {/* Customer Selector (When audience === 'SPECIFIC') */}
              {currentAudience === "SPECIFIC" && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">
                      Selected Customers ({selectedUserIds.length})
                    </span>
                    {selectedUserIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedUserIds([])}
                        className="text-[10px] font-bold text-red-600 hover:underline"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  {/* Customer Search Bar */}
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <Input
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder="Search customer by name, email, or phone..."
                      className="pl-8 text-xs border-slate-200 bg-white h-8"
                    />
                  </div>

                  {/* Customer Options List */}
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded-lg p-1">
                    {filteredCustomers.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
                        No customers found matching search.
                      </p>
                    ) : (
                      filteredCustomers.map((cust: any) => {
                        const isSelected = selectedUserIds.includes(cust.id)
                        return (
                          <div
                            key={cust.id}
                            onClick={() => toggleSelectCustomer(cust.id)}
                            className={`px-3 py-2 text-xs font-semibold cursor-pointer rounded-md flex items-center justify-between transition-colors ${
                              isSelected ? "bg-blue-50 text-blue-700 border border-blue-200 font-bold" : "hover:bg-slate-50 text-slate-800"
                            }`}
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{cust.name || cust.email}</p>
                              <p className="text-[10px] text-slate-500">{cust.email} • {cust.phone || 'No phone'}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

            </div>

            <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingNotification(null)
                }}
                className="text-xs font-bold border-slate-200 text-slate-600 bg-white"
              >
                Cancel
              </Button>
              <Button
                disabled={saveMutation.isPending || isUploading}
                onClick={handleSubmit(onSubmitNotification)}
                className="text-xs font-bold bg-black text-white hover:bg-black/90 shadow-sm"
              >
                {saveMutation.isPending || isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> {editingNotification ? "Saving..." : "Dispatching..."}
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-2" /> {editingNotification ? "Update Notification" : "Dispatch Notification"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deletingNotificationId !== null}
          onOpenChange={(open) => {
            if (!open) setDeletingNotificationId(null)
          }}
        >
          <DialogContent className="sm:max-w-[420px] bg-white border border-slate-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" /> Delete Notification
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete notification #{deletingNotificationId}? This will remove all associated recipient logs permanently.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 border-t border-slate-100 pt-4 mt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingNotificationId(null)}
                className="text-xs font-bold border-slate-200 text-slate-600"
              >
                Cancel
              </Button>
              <Button
                disabled={deleteMutation.isPending}
                onClick={() => deletingNotificationId && deleteMutation.mutate(deletingNotificationId)}
                className="text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                )}
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Recipient Log Tracking Modal */}
        <Dialog
          open={!!selectedNotificationForRecipients}
          onOpenChange={(open) => {
            if (!open) setSelectedNotificationForRecipients(null)
          }}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white border border-slate-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Recipient Delivery & Read Log
                </span>
                {selectedNotificationForRecipients && (
                  <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-700">
                    ID #{selectedNotificationForRecipients.id}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedNotificationForRecipients && (
              <div className="space-y-4 py-2">
                {/* Notification Summary Box */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-bold text-slate-900">{selectedNotificationForRecipients.title}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{selectedNotificationForRecipients.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-500">
                    <span>Sent: {selectedNotificationForRecipients.total_sent}</span>
                    <span>•</span>
                    <span>Read: {selectedNotificationForRecipients.total_read}</span>
                    <span>•</span>
                    <span>Type: {selectedNotificationForRecipients.notification_type}</span>
                  </div>
                </div>

                {/* Recipients Table */}
                {isLoadingRecipients ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-6 w-6 text-purple-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-500">Loading recipient logs...</p>
                  </div>
                ) : recipientsList.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs font-semibold text-slate-400">No individual recipient logs recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-b border-slate-100">
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3">User ID</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3">Delivery Status</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3">Is Read?</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3">Is Clicked?</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3">Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipientsList.map((rec) => (
                          <TableRow key={rec.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <TableCell className="py-2.5 font-mono text-[11px] text-slate-800 font-semibold">
                              {rec.user_id}
                            </TableCell>

                            <TableCell className="py-2.5">
                              {rec.delivery_status === "DELIVERED" ? (
                                <Badge variant="outline" className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Delivered
                                </Badge>
                              ) : rec.delivery_status === "FAILED" ? (
                                <Badge variant="outline" className="text-[9px] font-bold bg-red-50 text-red-700 border-red-200">
                                  Failed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] font-bold bg-blue-50 text-blue-700 border-blue-200">
                                  {rec.delivery_status || 'Sent'}
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="py-2.5">
                              {rec.is_read ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                  <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  Read ({rec.read_at ? new Date(rec.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Yes'})
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">Unread</span>
                              )}
                            </TableCell>

                            <TableCell className="py-2.5">
                              {rec.is_clicked ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700">
                                  <MousePointerClick className="h-3.5 w-3.5 text-purple-600" />
                                  Clicked
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">No</span>
                              )}
                            </TableCell>

                            <TableCell className="py-2.5 text-[10px] text-slate-500 font-medium">
                              {rec.sent_at ? new Date(rec.sent_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit"
                              }) : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="border-t border-slate-100 pt-3">
              <Button
                variant="outline"
                onClick={() => setSelectedNotificationForRecipients(null)}
                className="text-xs font-bold border-slate-200 text-slate-600"
              >
                Close Log
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </SidebarInset>
    </SidebarProvider>
  )
}
