"use client"

import dynamic from "next/dynamic"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const Editor = dynamic(() => import("@/components/ui/editor"), { ssr: false })
import {
  Megaphone,
  Radio,
  Plus,
  RefreshCcw,
  Search,
  Users,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Send,
  Calendar,
  Clock,
  ExternalLink,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCheck,
  Folder,
  ChevronDown,
  Image
} from "lucide-react"
import React, { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface EmailCampaignItem {
  id: number
  created_at: string
  updated_at: string
  subject: string
  banner_url: string | null
  html_content: string
  audience: "All Users" | "Selected Users" | "Newsletter" | "ALL"
  status: "Draft" | "Scheduled" | "Sending" | "Sent" | "Cancelled" | "DRAFT" | "SCHEDULED" | "SENT" | "FAILED"
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  total_sent: number
  total_failed: number
  total_opened: number
  total_clicked: number
  created_by: string | null
}

export interface EmailCampaignRecipientItem {
  id: number
  created_at: string
  campaign_id: number
  user_id: string | null
  email: string
  name: string | null
  delivery_status: "Pending" | "Sent" | "Delivered" | "Opened" | "Clicked" | "Failed" | "Bounced" | "Unsubscribed" | "PENDING" | "SENT" | "DELIVERED" | "FAILED"
  sent_at: string | null
  opened_at: string | null
  error_message: string | null
}

interface CreateBroadcastFormValues {
  subject: string
  content: string
  banner_url: string
  audience: "ALL" | "SPECIFIC"
  redirectUrl?: string
}

const defaultBroadcastValues: CreateBroadcastFormValues = {
  subject: "",
  content: "",
  banner_url: "",
  audience: "ALL",
  redirectUrl: ""
}

export default function CustomerBroadcastingPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")
  const [deletingCampaignId, setDeletingCampaignId] = useState<number | null>(null)

  // Selected Campaign for Recipient Tracking Modal
  const [selectedCampaignForRecipients, setSelectedCampaignForRecipients] = useState<EmailCampaignItem | null>(null)

  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateBroadcastFormValues>({
    defaultValues: defaultBroadcastValues
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

  useEffect(() => {
    if (!isCreateModalOpen) {
      reset(defaultBroadcastValues)
      setSelectedCustomerIds([])
      setCustomerSearchQuery("")
      setBannerUploadMethod("url")
      setBannerLocalFile(null)
    }
  }, [isCreateModalOpen, reset])

  // Fetch email campaigns history
  const { data: broadcastsData, isLoading: loadingBroadcasts, refetch: refetchBroadcasts } = useQuery({
    queryKey: ["emailCampaigns"],
    queryFn: async () => {
      const res = await fetch("/api/marketing/broadcasting")
      if (!res.ok) throw new Error("Failed to fetch email campaigns")
      return res.json()
    }
  })

  const campaignsList: EmailCampaignItem[] = broadcastsData?.broadcasts || broadcastsData?.campaigns || []

  // Fetch recipients for selected campaign modal
  const { data: recipientsData, isLoading: isLoadingRecipients } = useQuery({
    queryKey: ["emailCampaignRecipients", selectedCampaignForRecipients?.id],
    queryFn: async () => {
      if (!selectedCampaignForRecipients) return null
      const res = await fetch(`/api/marketing/broadcasting/${selectedCampaignForRecipients.id}/recipients`)
      if (!res.ok) throw new Error("Failed to fetch campaign recipients log")
      return res.json()
    },
    enabled: !!selectedCampaignForRecipients
  })

  const recipientsList: EmailCampaignRecipientItem[] = recipientsData?.recipients || []

  // Fetch customers directory
  const { data: customersData, isLoading: loadingCustomers, refetch: refetchCustomers } = useQuery({
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
    return customersList.filter((c: any) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    )
  }, [customerSearchQuery, customersList])

  // Filter broadcast campaign history
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaignsList
    const q = searchQuery.toLowerCase()
    return campaignsList.filter((b) =>
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

    const reachableEmails = customersList.filter((c: any) => c.email && c.email.includes("@")).length

    return {
      totalCampaigns: campaignsList.length,
      emailReach: totalSent > 0 ? totalSent : reachableEmails,
      totalFailed,
      totalOpened,
      totalCustomers: customersList.length
    }
  }, [campaignsList, customersList])

  // Mutation for creating email campaign
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/marketing/broadcasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to dispatch email campaign")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || "Email campaign dispatched successfully via Nodemailer!")
      setIsCreateModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ["emailCampaigns"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  // Mutation for deleting campaign
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/marketing/broadcasting/${id}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to delete campaign")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || "Email campaign deleted successfully!")
      setDeletingCampaignId(null)
      queryClient.invalidateQueries({ queryKey: ["emailCampaigns"] })
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

  const onSubmitBroadcast = async (data: CreateBroadcastFormValues) => {
    if (!data.subject.trim()) {
      toast.error("Campaign Subject Title is required")
      return
    }
    if (!data.content.trim()) {
      toast.error("Email Message Content is required")
      return
    }
    if (data.audience === "SPECIFIC" && selectedCustomerIds.length === 0) {
      toast.error("Please select at least one customer for targeted email broadcast")
      return
    }

    setIsUploading(true)
    const toastId = "email-campaign-send"
    toast.loading("Processing email campaign dispatch...", { id: toastId })

    try {
      let finalBannerUrl = data.banner_url.trim()

      if (bannerUploadMethod === "file" && bannerLocalFile) {
        toast.loading("Uploading banner image to GitHub...", { id: toastId })
        finalBannerUrl = await uploadFile(bannerLocalFile)
      }

      toast.loading("Dispatching campaign...", { id: toastId })
      createMutation.mutate({
        subject: data.subject.trim(),
        content: data.content.trim(),
        banner_url: finalBannerUrl || null,
        audience: data.audience,
        targetCustomerIds: selectedCustomerIds,
        redirectUrl: data.redirectUrl?.trim() || null
      }, {
        onSuccess: (resData) => {
          toast.success(resData.message || "Email campaign dispatched successfully via Nodemailer!", { id: toastId })
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to dispatch email campaign", { id: toastId })
        }
      })
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const openDirectTargetBroadcast = (customerId: string) => {
    setSelectedCustomerIds([customerId])
    setValue("audience", "SPECIFIC")
    setIsCreateModalOpen(true)
  }

  const renderStatusBadge = (status: EmailCampaignItem["status"]) => {
    const s = (status || "").toString().toLowerCase()
    if (s === "sent") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Sent
        </span>
      )
    }
    if (s === "scheduled") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
          <Clock className="h-3 w-3 text-amber-500" />
          Scheduled
        </span>
      )
    }
    if (s === "failed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-red-50 text-red-700 border-red-200">
          Failed
        </span>
      )
    }
    return <Badge variant="outline">{status}</Badge>
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
            <span className="font-semibold text-slate-900">Email Campaigns & Broadcasting</span>
          </div>

          {/* Heading */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] flex items-center gap-2">
                <Radio className="h-7 w-7 text-black" />
                Email Campaigns (Nodemailer)
              </h1>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                Dispatch HTML email marketing campaigns, coupons, and announcements via Nodemailer SMTP.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => { refetchBroadcasts(); refetchCustomers(); }}
                variant="outline"
                className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
              >
                <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Refresh Data
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs font-bold bg-black text-white hover:bg-black/90 shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Email Campaign
              </Button>
            </div>
          </div>

          {/* Top Level Metric Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-indigo-50 text-indigo-700">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Campaigns</p>
                  <p className="text-xl font-bold text-slate-900">{metrics.totalCampaigns}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Emails Sent</p>
                  <p className="text-xl font-bold text-slate-900">{metrics.emailReach.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Opened</p>
                  <p className="text-xl font-bold text-slate-900">{metrics.totalOpened.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customers</p>
                  <p className="text-xl font-bold text-slate-900">{metrics.totalCustomers.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Campaigns vs Customer Directory */}
          <Tabs defaultValue="campaigns" className="space-y-6">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
              <TabsTrigger value="campaigns" className="text-xs font-bold px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white">
                <Radio className="h-3.5 w-3.5 mr-2" /> Email Campaigns Log
              </TabsTrigger>
              <TabsTrigger value="customers" className="text-xs font-bold px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white">
                <Users className="h-3.5 w-3.5 mr-2" /> Customer Directory
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Broadcast Campaigns Log */}
            <TabsContent value="campaigns">
              <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="relative w-full sm:w-72">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search email subject or content..."
                      className="pl-9 text-xs border-slate-200 bg-slate-50/50 !text-black h-9"
                    />
                  </div>
                  {searchQuery && (
                    <Button
                      onClick={() => setSearchQuery("")}
                      variant="ghost"
                      className="text-xs font-bold text-red-600 hover:text-red-700 h-9"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>

                {loadingBroadcasts ? (
                  <div className="py-24 text-center">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-500">Loading email campaigns log...</p>
                  </div>
                ) : filteredCampaigns.length === 0 ? (
                  <div className="py-24 text-center">
                    <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-400">No email campaigns found in database.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b border-slate-100">
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Subject & Banner</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Audience</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Status</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Sent / Reach</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Failed</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Date</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCampaigns.map((bc) => (
                          <TableRow key={bc.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                            <TableCell className="py-4">
                              <div className="flex items-start gap-3">
                                {bc.banner_url && (
                                  <img
                                    src={bc.banner_url}
                                    alt="Banner"
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 mt-0.5"
                                  />
                                )}
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{bc.subject}</p>
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                    {bc.html_content ? bc.html_content.replace(/<[^>]*>?/gm, '').slice(0, 80) : ''}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-4">
                              {bc.audience === "All Users" || bc.audience === "ALL" ? (
                                <Badge variant="outline" className="text-[9px] font-bold bg-blue-50 text-blue-700 border-blue-200">
                                  All Customers
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] font-bold bg-purple-50 text-purple-700 border-purple-200">
                                  Targeted
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="py-4">
                              {renderStatusBadge(bc.status)}
                            </TableCell>

                            <TableCell className="py-4 text-xs font-bold text-slate-900">
                              {bc.total_sent || 0} / {bc.total_recipients || 0}
                            </TableCell>

                            <TableCell className="py-4 text-xs font-bold text-red-600">
                              {bc.total_failed || 0}
                            </TableCell>

                            <TableCell className="py-4 text-xs text-slate-600 font-medium">
                              {bc.sent_at ? new Date(bc.sent_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit"
                              }) : bc.created_at ? new Date(bc.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric"
                              }) : "N/A"}
                            </TableCell>

                            <TableCell className="py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  onClick={() => setSelectedCampaignForRecipients(bc)}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                                >
                                  <Users className="h-3.5 w-3.5 mr-1 text-slate-500" /> Logs
                                </Button>
                                <Button
                                  onClick={() => setDeletingCampaignId(bc.id)}
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
            </TabsContent>

            {/* TAB 2: Customer Reach Directory */}
            <TabsContent value="customers">
              <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="relative w-full sm:w-72">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder="Search customer by name, email, or phone..."
                      className="pl-9 text-xs border-slate-200 bg-slate-50/50 !text-black h-9"
                    />
                  </div>
                  {customerSearchQuery && (
                    <Button
                      onClick={() => setCustomerSearchQuery("")}
                      variant="ghost"
                      className="text-xs font-bold text-red-600 hover:text-red-700 h-9"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>

                {loadingCustomers ? (
                  <div className="py-24 text-center">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-500">Loading customers directory...</p>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="py-24 text-center">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-400">No customers found matching search.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b border-slate-100">
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Customer Name</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Email Address</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Phone Number</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4 text-right">Quick Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCustomers.map((cust: any) => (
                          <TableRow key={cust.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                            <TableCell className="py-3.5 font-bold text-xs text-slate-900 flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-extrabold text-slate-700">
                                {cust.name ? cust.name.slice(0, 2).toUpperCase() : 'CU'}
                              </div>
                              {cust.name}
                            </TableCell>

                            <TableCell className="py-3.5 text-xs text-slate-600 font-medium">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-slate-400" />
                                {cust.email}
                              </span>
                            </TableCell>

                            <TableCell className="py-3.5 text-xs text-slate-600 font-medium">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {cust.phone || 'N/A'}
                              </span>
                            </TableCell>

                            <TableCell className="py-3.5 text-right">
                              <Button
                                onClick={() => openDirectTargetBroadcast(cust.id || cust.email)}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-bold border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                              >
                                <Send className="h-3 w-3 mr-1.5" /> Target Email
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Create Email Campaign Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-600" />
                Dispatch Nodemailer Email Campaign
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">

              {/* Subject Title */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Campaign Subject Line <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register("subject")}
                  placeholder="e.g. 🎉 Exclusive 20% Discount Code Inside!"
                  className="h-10 text-xs border-slate-200 bg-white text-slate-900 font-semibold shadow-sm"
                />
              </div>

              {/* Redirect URL */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Redirect URL (Redirection destination link)
                </label>
                <Input
                  {...register("redirectUrl")}
                  placeholder="e.g. https://shopmarkline.in/products/women"
                  className="h-10 text-xs border-slate-200 bg-white text-slate-900 font-semibold shadow-sm"
                />
              </div>

              {/* Banner Image Source Toggle & Directory Selector */}
              <div className="space-y-3 pt-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Banner Image Source
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
                    placeholder="https://images.unsplash.com/photo-..."
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

              {/* Message Content with Rich Text Editor */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Email Message Body <span className="text-red-500">*</span>
                </label>
                <div className="shadow-sm border border-slate-200 rounded-md overflow-hidden bg-white">
                  <Editor
                    value={watch("content") || ""}
                    onChange={(val) => setValue("content", val)}
                    height={280}
                  />
                </div>
              </div>



              {/* Target Audience Strategy */}
              <div className="border-t border-slate-100 pt-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Target Audience Strategy
                </label>
                <Select
                  value={currentAudience}
                  onValueChange={(val: any) => setValue("audience", val)}
                >
                  <SelectTrigger className="w-full h-10 text-xs font-semibold text-slate-900 border-slate-200 bg-white shadow-sm">
                    <SelectValue placeholder="Select target..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-lg">
                    <SelectItem value="ALL" className="text-xs font-semibold">
                      Broadcast to All Active Registered Customers
                    </SelectItem>
                    <SelectItem value="SPECIFIC" className="text-xs font-semibold">
                      Select Specific Customers / Recipients
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Selector (When audience === 'SPECIFIC') */}
              {currentAudience === "SPECIFIC" && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">
                      Selected Recipients ({selectedCustomerIds.length})
                    </span>
                    {selectedCustomerIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerIds([])}
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
                        const targetKey = cust.id || cust.email
                        const isSelected = selectedCustomerIds.includes(targetKey)
                        return (
                          <div
                            key={targetKey}
                            onClick={() => toggleSelectCustomer(targetKey)}
                            className={`px-3 py-2 text-xs font-semibold cursor-pointer rounded-md flex items-center justify-between transition-colors ${
                              isSelected ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold" : "hover:bg-slate-50 text-slate-800"
                            }`}
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{cust.name}</p>
                              <p className="text-[10px] text-slate-500">{cust.email}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
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
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs font-bold border-slate-200 text-slate-600 bg-white"
              >
                Cancel
              </Button>
              <Button
                disabled={createMutation.isPending || isUploading}
                onClick={handleSubmit(onSubmitBroadcast)}
                className="text-xs font-bold bg-black text-white hover:bg-black/90 shadow-sm"
              >
                {createMutation.isPending || isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Dispatched...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-2" /> Dispatch Email Campaign
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deletingCampaignId !== null}
          onOpenChange={(open) => {
            if (!open) setDeletingCampaignId(null)
          }}
        >
          <DialogContent className="sm:max-w-[420px] bg-white border border-slate-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" /> Delete Email Campaign
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete email campaign #{deletingCampaignId}? This will remove all recipient delivery tracking entries permanently.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 border-t border-slate-100 pt-4 mt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingCampaignId(null)}
                className="text-xs font-bold border-slate-200 text-slate-600"
              >
                Cancel
              </Button>
              <Button
                disabled={deleteMutation.isPending}
                onClick={() => deletingCampaignId && deleteMutation.mutate(deletingCampaignId)}
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

        {/* Recipient Tracking Modal */}
        <Dialog
          open={!!selectedCampaignForRecipients}
          onOpenChange={(open) => {
            if (!open) setSelectedCampaignForRecipients(null)
          }}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white border border-slate-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-indigo-600" />
                  Email Campaign Recipients & Delivery Log
                </span>
                {selectedCampaignForRecipients && (
                  <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-700">
                    ID #{selectedCampaignForRecipients.id}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedCampaignForRecipients && (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-bold text-slate-900">{selectedCampaignForRecipients.subject}</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-500">
                    <span>Sent: {selectedCampaignForRecipients.total_sent}</span>
                    <span>•</span>
                    <span>Failed: {selectedCampaignForRecipients.total_failed}</span>
                    <span>•</span>
                    <span>Audience: {selectedCampaignForRecipients.audience}</span>
                  </div>
                </div>

                {isLoadingRecipients ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-500">Loading recipient logs...</p>
                  </div>
                ) : recipientsList.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs font-semibold text-slate-400">No recipient logs recorded for this campaign.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-b border-slate-100">
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3">Recipient Email</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3">Name</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3">Delivery Status</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3">Dispatched Time</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3">Error Log</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipientsList.map((rec) => (
                          <TableRow key={rec.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <TableCell className="py-2.5 text-xs text-slate-900 font-bold">
                              {rec.email}
                            </TableCell>

                            <TableCell className="py-2.5 text-xs text-slate-600 font-medium">
                              {rec.name || 'N/A'}
                            </TableCell>

                            <TableCell className="py-2.5">
                              {rec.delivery_status === "Sent" || rec.delivery_status === "Delivered" || rec.delivery_status === "SENT" || rec.delivery_status === "DELIVERED" ? (
                                <Badge variant="outline" className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Sent / Delivered
                                </Badge>
                              ) : rec.delivery_status === "Failed" || rec.delivery_status === "FAILED" || rec.delivery_status === "Bounced" ? (
                                <Badge variant="outline" className="text-[9px] font-bold bg-red-50 text-red-700 border-red-200">
                                  {rec.delivery_status}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                                  {rec.delivery_status}
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="py-2.5 text-[10px] text-slate-500 font-medium">
                              {rec.sent_at ? new Date(rec.sent_at).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit"
                              }) : "N/A"}
                            </TableCell>

                            <TableCell className="py-2.5 text-[10px] text-red-600 font-mono">
                              {rec.error_message || '-'}
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
                onClick={() => setSelectedCampaignForRecipients(null)}
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
