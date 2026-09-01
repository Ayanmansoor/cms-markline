"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  ArrowLeft, Trash2, Calendar, Mail, User, Bookmark, ShoppingBag, 
  Eye, Copy, Check, Truck, AlertCircle, CalendarRange, MapPin, RefreshCw,
  ShieldCheck, DollarSign, Settings, Bell, ExternalLink, Image as ImageIcon,
  ClipboardCheck, UserCheck, CreditCard, FileText, Lock
} from "lucide-react"
import { toast } from "sonner"

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "APPROVE", label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "ON HOLD", label: "On Hold", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "COMPLETED", label: "Completed", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "REJECTED", label: "Rejected", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "CANCELED", label: "Cancelled", color: "bg-slate-50 text-slate-700 border-slate-200" }
]

const PICKUP_STATUS_OPTIONS = [
  "Pending",
  "Scheduled",
  "Pickup Requested",
  "Picked Up",
  "In Transit",
  "Delivered to Warehouse",
  "Cancelled",
  "Failed"
]

const QC_DECISION_OPTIONS = [
  "Refund",
  "Replacement",
  "Exchange",
  "Reject"
]

const REFUND_STATUS_OPTIONS = [
  "Pending",
  "Initiated",
  "Processed",
  "Failed",
  "Cancelled"
]

function parseClaimDescription(fullDescription: string) {
  if (!fullDescription) return { text: "", pickup: null }
  
  const marker = "[PICKUP_INFO]:"
  const index = fullDescription.indexOf(marker)
  if (index !== -1) {
    const text = fullDescription.substring(0, index).trim()
    const jsonStr = fullDescription.substring(index + marker.length).trim()
    try {
      const pickup = JSON.parse(jsonStr)
      return { text, pickup }
    } catch (e) {
      // ignore
    }
  }
  
  return { text: fullDescription, pickup: null }
}

function formatDateForInput(dateVal: any) {
  if (!dateVal) return ""
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return ""
    return d.toISOString().substring(0, 16)
  } catch {
    return ""
  }
}

interface ClaimFormValues {
  status: string
  claimType: string
  reason: string
  description: string
  pickupStatus: string
  pickupScheduledAt: string
  courierName: string
  awbCode: string
  trackingNumber: string
  trackingUrl: string
  labelUrl: string
  manifestUrl: string
  shiprocketOrderId: string
  shipmentId: string
  receivedAt: string
  receivedBy: string
  customAddress: string
  qcStatus: string
  qcNote: string
  qcImagesStr: string
  qcCheckedBy: string
  qcCheckedAt: string
  refundStatus: string
  refundAmount: string
  razorpayPaymentId: string
  razorpayRefundId: string
  refundReason: string
  refundProcessedBy: string
  refundProcessedAt: string
  refundFailureReason: string
  assignedTo: string
  adminNote: string
  rejectedReason: string
  customerNotified: boolean
  customerNotifiedAt: string
  approvedAt: string
  approvedBy: string
}

const defaultFormValues: ClaimFormValues = {
  status: "PENDING",
  claimType: "",
  reason: "",
  description: "",
  pickupStatus: "Pending",
  pickupScheduledAt: "",
  courierName: "",
  awbCode: "",
  trackingNumber: "",
  trackingUrl: "",
  labelUrl: "",
  manifestUrl: "",
  shiprocketOrderId: "",
  shipmentId: "",
  receivedAt: "",
  receivedBy: "",
  customAddress: "",
  qcStatus: "",
  qcNote: "",
  qcImagesStr: "",
  qcCheckedBy: "",
  qcCheckedAt: "",
  refundStatus: "Pending",
  refundAmount: "",
  razorpayPaymentId: "",
  razorpayRefundId: "",
  refundReason: "",
  refundProcessedBy: "",
  refundProcessedAt: "",
  refundFailureReason: "",
  assignedTo: "",
  adminNote: "",
  rejectedReason: "",
  customerNotified: false,
  customerNotifiedAt: "",
  approvedAt: "",
  approvedBy: "",
}

export default function ClaimDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const queryClient = useQueryClient()

  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isSchedulingPickup, setIsSchedulingPickup] = useState(false)
  const [isProcessingRefund, setIsProcessingRefund] = useState(false)

  const { register, watch, setValue, reset, getValues } = useForm<ClaimFormValues>({
    defaultValues: defaultFormValues
  })

  const status = watch("status")
  const trackingUrl = watch("trackingUrl")
  const labelUrl = watch("labelUrl")
  const customAddress = watch("customAddress")

  const { data: detailResponse, isLoading, error } = useQuery({
    queryKey: ["claim-detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/helps/claims/${id}`)
      if (!res.ok) throw new Error("Failed to fetch claim details")
      return res.json()
    },
    enabled: !!id
  })

  const claim = detailResponse?.claim || null

  const isShippingEnabled = claim?.status === "APPROVE"
  const isQcRefundEnabled = !!claim?.awb_code && claim?.pickup_status === "Delivered to Warehouse"

  const updateClaimMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await fetch(`/api/helps/claims/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to update claim")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Claim updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["claim-detail", id] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update claim")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/helps/claims/${id}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete claim")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Claim deleted successfully!")
      router.push("/helps")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete claim")
    }
  })

  useEffect(() => {
    if (claim) {
      const { text: cleanDesc, pickup: legacyPickup } = parseClaimDescription(claim.description || "")

      reset({
        status: claim.status || "PENDING",
        claimType: claim.claim_type || "",
        reason: claim.reason || "",
        description: cleanDesc,
        pickupStatus: claim.pickup_status || legacyPickup?.pickup_status || "Pending",
        pickupScheduledAt: formatDateForInput(claim.pickup_scheduled_at || legacyPickup?.date),
        courierName: claim.courier_name || legacyPickup?.courier || "",
        awbCode: claim.awb_code || "",
        trackingNumber: claim.tracking_number || legacyPickup?.tracking || "",
        trackingUrl: claim.tracking_url || "",
        labelUrl: claim.label_url || "",
        manifestUrl: claim.manifest_url || "",
        shiprocketOrderId: claim.shiprocket_order_id || "",
        shipmentId: claim.shipment_id || "",
        receivedAt: formatDateForInput(claim.received_at),
        receivedBy: claim.received_by || "",
        customAddress: legacyPickup?.customAddress || "",
        qcStatus: claim.qc_status || "",
        qcNote: claim.qc_note || "",
        qcImagesStr: claim.qc_images ? claim.qc_images.join(", ") : "",
        qcCheckedBy: claim.qc_checked_by || "",
        qcCheckedAt: formatDateForInput(claim.qc_checked_at),
        refundStatus: claim.refund_status || "Pending",
        refundAmount: claim.refund_amount ? String(claim.refund_amount) : "",
        razorpayPaymentId: claim.razorpay_payment_id || "",
        razorpayRefundId: claim.razorpay_refund_id || "",
        refundReason: claim.refund_reason || "",
        refundProcessedBy: claim.refund_processed_by || "",
        refundProcessedAt: formatDateForInput(claim.refund_processed_at),
        refundFailureReason: claim.refund_failure_reason || "",
        assignedTo: claim.assigned_to || "",
        adminNote: claim.admin_note || "",
        rejectedReason: claim.rejected_reason || "",
        customerNotified: !!claim.customer_notified,
        customerNotifiedAt: formatDateForInput(claim.customer_notified_at),
        approvedAt: formatDateForInput(claim.approved_at),
        approvedBy: claim.approved_by || "",
      })
    }
  }, [claim, reset])

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this claim inquiry? This action cannot be undone.")) {
      deleteMutation.mutate()
    }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const handleSaveOverview = () => {
    const v = getValues()
    updateClaimMutation.mutate({
      claim_type: v.claimType,
      reason: v.reason,
      description: v.description
    })
  }

  const handleShiprocketSchedule = async () => {
    setIsSchedulingPickup(true)
    try {
      const res = await fetch(`/api/helps/claims/${id}/schedule-pickup`, {
        method: "POST"
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule Shiprocket pickup")
      }
      toast.success(
        data.demoMode 
          ? "Demo Mode: Shiprocket Return Pickup scheduled successfully!" 
          : "Shiprocket Return Pickup scheduled successfully!"
      )
      queryClient.invalidateQueries({ queryKey: ["claim-detail", id] })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSchedulingPickup(false)
    }
  }

  const handleRazorpayRefund = async () => {
    setIsProcessingRefund(true)
    try {
      const res = await fetch(`/api/helps/claims/${id}/process-refund`, {
        method: "POST"
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to process Razorpay refund")
      }
      toast.success(
        data.demoMode 
          ? "Demo Mode: Razorpay Refund processed successfully!" 
          : "Razorpay Refund processed successfully!"
      )
      queryClient.invalidateQueries({ queryKey: ["claim-detail", id] })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessingRefund(false)
    }
  }

  const handleSaveLogistics = () => {
    const v = getValues()
    updateClaimMutation.mutate({
      pickup_status: v.pickupStatus,
      pickup_scheduled_at: v.pickupScheduledAt ? new Date(v.pickupScheduledAt).toISOString() : null,
      courier_name: v.courierName,
      awb_code: v.awbCode,
      tracking_number: v.trackingNumber,
      tracking_url: v.trackingUrl,
      label_url: v.labelUrl,
      manifest_url: v.manifestUrl,
      shiprocket_order_id: v.shiprocketOrderId,
      shipment_id: v.shipmentId,
      received_at: v.receivedAt ? new Date(v.receivedAt).toISOString() : null,
      received_by: v.receivedBy ? v.receivedBy : null
    })
  }

  const handleSaveQC = () => {
    const v = getValues()
    const images = v.qcImagesStr.split(",")
      .map(url => url.trim())
      .filter(url => url.length > 0)

    updateClaimMutation.mutate({
      qc_status: v.qcStatus || null,
      qc_note: v.qcNote,
      qc_images: images,
      qc_checked_by: v.qcCheckedBy ? v.qcCheckedBy : null,
      qc_checked_at: v.qcCheckedAt ? new Date(v.qcCheckedAt).toISOString() : null
    })
  }

  const handleSaveRefund = () => {
    const v = getValues()
    updateClaimMutation.mutate({
      refund_status: v.refundStatus,
      refund_amount: v.refundAmount ? parseFloat(v.refundAmount) : null,
      razorpay_payment_id: v.razorpayPaymentId,
      razorpay_refund_id: v.razorpayRefundId,
      refund_reason: v.refundReason,
      refund_processed_by: v.refundProcessedBy ? v.refundProcessedBy : null,
      refund_processed_at: v.refundProcessedAt ? new Date(v.refundProcessedAt).toISOString() : null,
      refund_failure_reason: v.refundFailureReason
    })
  }

  const handleSaveAdmin = () => {
    const v = getValues()
    updateClaimMutation.mutate({
      assigned_to: v.assignedTo ? v.assignedTo : null,
      admin_note: v.adminNote,
      rejected_reason: v.rejectedReason,
      customer_notified: v.customerNotified,
      customer_notified_at: v.customerNotifiedAt ? new Date(v.customerNotifiedAt).toISOString() : null,
      approved_by: v.approvedBy ? v.approvedBy : null,
      approved_at: v.approvedAt ? new Date(v.approvedAt).toISOString() : null
    })
  }

  const handleStatusChange = (newStatus: string) => {
    setValue("status", newStatus)
    updateClaimMutation.mutate({ status: newStatus })
  }

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
          <SiteHeader />
          <div className="flex-1 flex items-center justify-center">
            <span className="text-slate-400 font-semibold text-xs animate-pulse">Loading claim details...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error || !claim) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
          <SiteHeader />
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <span className="text-red-500 font-bold text-sm">Failed to load claim details</span>
            <Button variant="outline" size="sm" onClick={() => router.push("/helps")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Helps
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const createdDateStr = claim.created_at ? new Date(claim.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Breadcrumbs & Delete Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push("/helps")}
                className="h-8 text-slate-500 hover:text-slate-900 px-2 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold text-slate-500">Helps & Support</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-slate-900">Claim Details</span>
            </div>

            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 h-8 px-3.5 shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Claim
            </Button>
          </div>

          {/* Core Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-start">
            
            {/* Left 3 Columns: Tabs Content */}
            <div className="xl:col-span-3 space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full grid grid-cols-5 p-1 bg-white border border-slate-200 rounded-xl h-11 mb-6 shadow-xs">
                  <TabsTrigger value="overview" className="text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                    <FileText className="h-3.5 w-3.5" /> Overview
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="logistics" 
                    disabled={!isShippingEnabled}
                    className="text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Truck className="h-3.5 w-3.5" /> Shipping {!isShippingEnabled && <Lock className="h-3 w-3" />}
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="qc" 
                    disabled={!isQcRefundEnabled}
                    className="text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> QC {!isQcRefundEnabled && <Lock className="h-3 w-3" />}
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="refund" 
                    disabled={!isQcRefundEnabled}
                    className="text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Refund {!isQcRefundEnabled && <Lock className="h-3 w-3" />}
                  </TabsTrigger>
                  
                  <TabsTrigger value="admin" className="text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                    <Settings className="h-3.5 w-3.5" /> Admin
                  </TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview">
                  <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-sm font-black text-slate-900">Claim Core Overview</CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        View basic parameters, user descriptions, and customer uploaded media. Saving here enables the Shipping/Logistics actions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Claim Type</Label>
                          <Input 
                            {...register("claimType")}
                            placeholder="e.g. Return, Replacement"
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Reason</Label>
                          <Input 
                            {...register("reason")}
                            placeholder="e.g. Damaged during shipping"
                            className="h-9 text-xs" 
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Claim Description / Message</Label>
                        <textarea
                          {...register("description")}
                          rows={4}
                          className="w-full rounded-md border border-slate-200 bg-transparent p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          placeholder="Detailed customer comment details..."
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Customer Uploaded Media Gallery</Label>
                        {claim.media_urls && claim.media_urls.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {claim.media_urls.map((url: string, index: number) => (
                              <div 
                                key={index} 
                                onClick={() => setSelectedImage(url)}
                                className="group relative aspect-square rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shadow-xs hover:border-blue-500 cursor-zoom-in transition-all"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`attachment-${index}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <Eye className="h-5 w-5" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> No photos or video links attached with this claim.
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <Button 
                          onClick={handleSaveOverview}
                          disabled={updateClaimMutation.isPending}
                          className="h-9 bg-slate-900 text-white font-bold text-xs px-4 rounded-lg"
                        >
                          Save Overview Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* SHIPPING & LOGISTICS TAB */}
                <TabsContent value="logistics">
                  <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-sm font-black text-slate-900">Return Logistics & Pickup Settings</CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Logistics data, shipping labels, manifest sheets, and scheduled pickup timestamps.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">

                      {/* Automated Shiprocket Widget */}
                      <Card className="border border-indigo-100 bg-indigo-50/20 rounded-xl">
                        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                              <Truck className="h-4 w-4 text-indigo-600" />
                              Automated Shiprocket Return Logistics
                            </h3>
                            <p className="text-[11px] text-indigo-700">
                              Initiate return logistics through Shiprocket API automatically. Generates AWB, labels, and tracking URL.
                            </p>
                          </div>
                          <Button
                            onClick={handleShiprocketSchedule}
                            disabled={isSchedulingPickup || !!claim?.awb_code}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 shrink-0 shadow-xs"
                          >
                            {isSchedulingPickup ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : claim?.awb_code ? (
                              <Check className="h-3.5 w-3.5 mr-1.5" />
                            ) : (
                              <Truck className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            {claim?.awb_code ? "Pickup Scheduled" : "Schedule Shiprocket Return"}
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Pickup Status</Label>
                          <select
                            {...register("pickupStatus")}
                            className="w-full h-9 rounded-md border border-slate-200 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          >
                            {PICKUP_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Pickup Scheduled At</Label>
                          <Input 
                            type="datetime-local"
                            {...register("pickupScheduledAt")}
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Courier Partner</Label>
                          <Input 
                            {...register("courierName")}
                            placeholder="e.g. Delhivery, BlueDart"
                            className="h-9 text-xs" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">AWB Code</Label>
                          <Input 
                            {...register("awbCode")}
                            placeholder="AWB tracking number"
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Tracking Number</Label>
                          <Input 
                            {...register("trackingNumber")}
                            placeholder="Tracking ID"
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Tracking URL</Label>
                          <Input 
                            {...register("trackingUrl")}
                            placeholder="https://tracking..."
                            className="h-9 text-xs" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Label URL</Label>
                          <Input 
                            {...register("labelUrl")}
                            placeholder="Shipping label link"
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Manifest URL</Label>
                          <Input 
                            {...register("manifestUrl")}
                            placeholder="Manifest sheet link"
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                          <div className="flex gap-2">
                            {trackingUrl && (
                              <Button variant="outline" size="sm" asChild className="h-9 text-xs font-bold w-full">
                                <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Track Order
                                </a>
                              </Button>
                            )}
                            {labelUrl && (
                              <Button variant="outline" size="sm" asChild className="h-9 text-xs font-bold w-full">
                                <a href={labelUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Label
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Shiprocket Order ID</Label>
                          <Input 
                            {...register("shiprocketOrderId")}
                            placeholder="Shiprocket reference ID"
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Shipment ID</Label>
                          <Input 
                            {...register("shipmentId")}
                            placeholder="Carrier Shipment ID"
                            className="h-9 text-xs" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Received At Warehouse</Label>
                          <Input 
                            type="datetime-local"
                            {...register("receivedAt")}
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Received By (User UUID)</Label>
                          <Input 
                            {...register("receivedBy")}
                            placeholder="Handler Admin UUID"
                            className="h-9 text-xs" 
                          />
                        </div>
                      </div>

                      {/* Pickup Address details */}
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Customer Return Pickup Address</span>
                        {claim.address_details ? (
                          <div className="space-y-1 text-xs">
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {claim.address_details.recipientName || claim.name}
                            </p>
                            <p className="font-medium text-slate-600 pl-5">{claim.address_details.full_address}</p>
                            <p className="text-slate-500 pl-5">
                              {claim.address_details.city}, {claim.address_details.state_name} - {claim.address_details.pin_code}
                            </p>
                            {claim.address_details.recipientPhone && (
                              <p className="font-bold text-slate-500 pl-5 mt-1">
                                Phone Contact: {claim.address_details.recipientPhone}
                              </p>
                            )}
                          </div>
                        ) : customAddress ? (
                          <div className="space-y-1 text-xs">
                            <p className="font-medium text-slate-700 flex items-start gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                              {customAddress}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs italic text-slate-400">No specific address linked to this claim.</p>
                        )}
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <Button 
                          onClick={handleSaveLogistics}
                          disabled={updateClaimMutation.isPending}
                          className="h-9 bg-slate-900 text-white font-bold text-xs px-4 rounded-lg"
                        >
                          Save Logistics Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* QC INSPECTION TAB */}
                <TabsContent value="qc">
                  <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-slate-600" /> Quality Control & Warehouse Verification
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Log item inspection outcomes, note return parameters, and attach condition images.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">QC Decision (Status)</Label>
                          <select
                            {...register("qcStatus")}
                            className="w-full h-9 rounded-md border border-slate-200 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          >
                            <option value="">-- Select Decision --</option>
                            {QC_DECISION_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">QC Checked At</Label>
                          <Input 
                            type="datetime-local"
                            {...register("qcCheckedAt")}
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Checked By (Agent UUID)</Label>
                          <Input 
                            {...register("qcCheckedBy")}
                            placeholder="Inspector UUID"
                            className="h-9 text-xs" 
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">QC Images (Comma Separated URLs)</Label>
                        <Input 
                          {...register("qcImagesStr")}
                          placeholder="https://image-url-1.jpg, https://image-url-2.jpg"
                          className="h-9 text-xs" 
                        />
                      </div>

                      {claim.qc_images && claim.qc_images.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inspected Item Photos</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            {claim.qc_images.map((url: string, idx: number) => (
                              <div 
                                key={idx} 
                                onClick={() => setSelectedImage(url)}
                                className="group relative aspect-square rounded border border-slate-200 bg-white overflow-hidden cursor-zoom-in"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`qc-${idx}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <Eye className="h-4 w-4" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Inspector Notes & Description</Label>
                        <textarea
                          {...register("qcNote")}
                          rows={3}
                          className="w-full rounded-md border border-slate-200 bg-transparent p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          placeholder="Write comments about item physical quality state..."
                        />
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <Button 
                          onClick={handleSaveQC}
                          disabled={updateClaimMutation.isPending}
                          className="h-9 bg-slate-900 text-white font-bold text-xs px-4 rounded-lg"
                        >
                          Save Quality Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* REFUND MANAGEMENT TAB */}
                <TabsContent value="refund">
                  <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-slate-600" /> Refund Transaction & Financial Logs
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Track customer reimbursement totals, Razorpay payment reference IDs, and failure reasons.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">

                      {/* Razorpay Refund Widget */}
                      <Card className="border border-emerald-100 bg-emerald-50/20 rounded-xl">
                        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                              <DollarSign className="h-4 w-4 text-emerald-600" />
                              Razorpay Instant Refund Gateway
                            </h3>
                            <p className="text-[11px] text-emerald-700">
                              Process instant refund to customer credit/debit card or UPI wallet directly via Razorpay API. (Requires Payment ID and Refund Amount to be set).
                            </p>
                          </div>
                          <Button
                            onClick={handleRazorpayRefund}
                            disabled={isProcessingRefund || claim?.refund_status === "Processed"}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 shrink-0 shadow-xs"
                          >
                            {isProcessingRefund ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : claim?.refund_status === "Processed" ? (
                              <Check className="h-3.5 w-3.5 mr-1.5" />
                            ) : (
                              <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            {claim?.refund_status === "Processed" ? "Refund Handled" : "Process Instant Refund"}
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Refund Status</Label>
                          <select
                            {...register("refundStatus")}
                            className="w-full h-9 rounded-md border border-slate-200 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          >
                            {REFUND_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Refund Amount (INR)</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            {...register("refundAmount")}
                            placeholder="0.00"
                            className="h-9 text-xs font-mono font-bold" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Refund Reason</Label>
                          <Input 
                            {...register("refundReason")}
                            placeholder="e.g. Broken packaging / defect"
                            className="h-9 text-xs" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Razorpay Payment ID</Label>
                          <Input 
                            {...register("razorpayPaymentId")}
                            placeholder="pay_..."
                            className="h-9 text-xs font-mono" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Razorpay Refund ID</Label>
                          <Input 
                            {...register("razorpayRefundId")}
                            placeholder="rfnd_..."
                            className="h-9 text-xs font-mono" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Refund Processed At</Label>
                          <Input 
                            type="datetime-local"
                            {...register("refundProcessedAt")}
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Processed By (Admin UUID)</Label>
                          <Input 
                            {...register("refundProcessedBy")}
                            placeholder="Processor Admin UUID"
                            className="h-9 text-xs" 
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t border-slate-100 pt-4">
                        <Label className="text-[10px] font-bold text-red-500 uppercase block tracking-wider">Refund Failure Reason</Label>
                        <textarea
                          {...register("refundFailureReason")}
                          rows={2}
                          className="w-full rounded-md border border-red-200 bg-red-50/10 p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-400"
                          placeholder="Log gateway decline error responses here..."
                        />
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <Button 
                          onClick={handleSaveRefund}
                          disabled={updateClaimMutation.isPending}
                          className="h-9 bg-slate-900 text-white font-bold text-xs px-4 rounded-lg"
                        >
                          Save Refund Transaction
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ADMIN & INTERNAL METADATA TAB */}
                <TabsContent value="admin">
                  <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-sm font-black text-slate-900">Administrative Logs & Notification Controls</CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Handle agent assignments, customer alert toggles, rejection logs, and supervisor signatures.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Assigned Supervisor (Agent UUID)</Label>
                          <Input 
                            {...register("assignedTo")}
                            placeholder="Assigned Supervisor Agent UUID"
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                          <div className="flex items-center gap-2 h-9">
                            <input 
                              type="checkbox" 
                              id="notified_check"
                              {...register("customerNotified")}
                              className="rounded border-slate-300 h-4 w-4"
                            />
                            <Label htmlFor="notified_check" className="text-xs font-bold text-slate-700 cursor-pointer">
                              Customer has been notified of outcome
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Customer Notified At</Label>
                          <Input 
                            type="datetime-local"
                            {...register("customerNotifiedAt")}
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Approved By Supervisor (Admin UUID)</Label>
                          <Input 
                            {...register("approvedBy")}
                            placeholder="Approver Admin UUID"
                            className="h-9 text-xs" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Approved At Timestamp</Label>
                          <Input 
                            type="datetime-local"
                            {...register("approvedAt")}
                            className="h-9 text-xs" 
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t border-slate-100 pt-4">
                        <Label className="text-[10px] font-bold text-rose-500 uppercase block tracking-wider">Rejected Reason / Decline Details</Label>
                        <textarea
                          {...register("rejectedReason")}
                          rows={2}
                          className="w-full rounded-md border border-rose-200 bg-rose-50/10 p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
                          placeholder="Provide explanation of rejection sent to the client..."
                        />
                      </div>

                      <div className="space-y-1.5 border-t border-slate-100 pt-4">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Admin Internal Notes (Private to Team)</Label>
                        <textarea
                          {...register("adminNote")}
                          rows={3}
                          className="w-full rounded-md border border-slate-200 bg-transparent p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          placeholder="Write private team comments regarding this ticket..."
                        />
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <Button 
                          onClick={handleSaveAdmin}
                          disabled={updateClaimMutation.isPending}
                          className="h-9 bg-slate-900 text-white font-bold text-xs px-4 rounded-lg"
                        >
                          Save Admin Logs
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column: General Status Widget & Origin Panel */}
            <div className="space-y-6">
              
              {/* Status control */}
              <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-wider">Review Status Control</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Overall Status</Label>
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={updateClaimMutation.isPending}
                      className="w-full h-9 rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Live Badge</span>
                    <Badge variant="outline" className={`${
                      STATUS_OPTIONS.find(o => o.value === status)?.color || "bg-slate-50 text-slate-600 border-slate-200"
                    } text-[9px] font-bold uppercase tracking-wider py-0.5 px-2`}>
                      {STATUS_OPTIONS.find(o => o.value === status)?.label || status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Inquiry Origin */}
              <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-wider">Inquiry Origin</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  
                  {/* Customer details */}
                  <div className="flex items-start gap-3 text-xs">
                    <div className="p-2 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Details</span>
                      <span className="font-bold text-slate-950 block">{claim.name}</span>
                      <span className="font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" /> {claim.email}
                      </span>
                    </div>
                  </div>

                  {/* Submission date */}
                  <div className="flex items-start gap-3 border-t border-slate-100 pt-3 text-xs">
                    <div className="p-2 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Submitted On</span>
                      <span className="font-bold text-slate-800 block">{createdDateStr}</span>
                    </div>
                  </div>

                  {/* Target Product */}
                  <div className="flex items-start gap-3 border-t border-slate-100 pt-3 text-xs">
                    <div className="p-2 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                      <Bookmark className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Claimed Product</span>
                      <span className="font-bold text-slate-800 block leading-tight">{claim.productname}</span>
                    </div>
                  </div>

                  {/* Order Reference */}
                  <div className="flex items-start gap-3 border-t border-slate-100 pt-3 text-xs">
                    <div className="p-2 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Order ID</span>
                      {claim.orderID ? (
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="font-mono font-bold text-blue-600 block truncate">{claim.orderID}</span>
                          <button 
                            onClick={() => handleCopy(claim.orderID, "Order ID")}
                            className="text-slate-400 hover:text-slate-900 shrink-0"
                          >
                            {copiedText === "Order ID" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 block mt-0.5">N/A</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Lightbox Modal overlay for images */}
      <Dialog open={selectedImage !== null} onOpenChange={(open) => { if (!open) setSelectedImage(null); }}>
        <DialogContent className="max-w-3xl p-1 bg-transparent border-0 shadow-none flex items-center justify-center outline-none">
          {selectedImage && (
            <div className="relative max-h-[85vh] max-w-[85vw] rounded-lg overflow-hidden border border-white/10 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedImage} alt="media-lightbox" className="max-h-[85vh] max-w-[85vw] object-contain bg-slate-950" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
