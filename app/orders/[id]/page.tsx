"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  ArrowLeft, CheckCircle2, Printer, Download, Package,
  User, MapPin, Save, Phone,
  Clock, ShoppingBag, Truck, AlertCircle, CheckCheck,
  XCircle, Copy, FileText, Tag, AlertTriangle,
  Receipt, ShieldCheck, CalendarCheck2,
  CircleDot, Hash, Mail, Home, ExternalLink, RotateCcw,
  ArrowUpRight, ArrowDownLeft, CreditCard, PackageCheck,
  Loader2, RefreshCw, Lock, Sparkles, ChevronRight
} from "lucide-react"
import Link from "next/link"
import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ─── Status config ─────────────────────────────────────────────────────────
const paymentStatusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PAID: { label: "Paid", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <ShieldCheck className="h-4 w-4 text-emerald-600" /> },
  PENDING: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: <Clock className="h-4 w-4 text-amber-500" /> },
  NOT_PAID: { label: "Not Paid", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
  FAILED: { label: "Failed", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", icon: <XCircle className="h-4 w-4 text-rose-600" /> },
}

const fulfillmentStatusConfig: Record<string, { label: string; dot: string }> = {
  "Pending": { label: "Pending Approval", dot: "bg-amber-400" },
  "Confirmed": { label: "Confirmed", dot: "bg-blue-500" },
  "Packed": { label: "Packed", dot: "bg-indigo-500" },
  "Ready To Ship": { label: "Ready To Ship", dot: "bg-violet-500" },
  "Shipped": { label: "Shipped", dot: "bg-cyan-500" },
  "Delivered": { label: "Delivered", dot: "bg-emerald-500" },
  "Completed": { label: "Completed", dot: "bg-emerald-600" },
  "Cancelled": { label: "Cancelled", dot: "bg-red-500" },
}

const shipmentStatusColor: Record<string, string> = {
  "Pending Creation": "bg-slate-100 text-slate-600 border-slate-200",
  "Pending": "bg-amber-100 text-amber-700 border-amber-200",
  "AWB Generated": "bg-blue-100 text-blue-700 border-blue-200",
  "Pickup Scheduled": "bg-violet-100 text-violet-700 border-violet-200",
  "Picked Up": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "In Transit": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Out For Delivery": "bg-sky-100 text-sky-700 border-sky-200",
  "Delivered": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Cancelled": "bg-red-100 text-red-700 border-red-200",
  "Lost": "bg-rose-100 text-rose-700 border-rose-200",
  "NDR": "bg-orange-100 text-orange-700 border-orange-200",
}

// ─── Timeline step component ────────────────────────────────────────────────
const TimelineStep = ({
  title, subtitle, done, current
}: { title: string; subtitle: string; done: boolean; current?: boolean }) => (
  <div className="flex gap-3 items-start">
    <div className={`mt-0.5 flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all
      ${done ? "bg-emerald-500 border-emerald-500" : current ? "border-indigo-500 bg-white" : "border-slate-200 bg-white"}`}>
      {done
        ? <CheckCheck className="h-3.5 w-3.5 text-white" />
        : current
          ? <CircleDot className="h-3.5 w-3.5 text-indigo-500" />
          : <div className="h-2 w-2 rounded-full bg-slate-200" />}
    </div>
    <div className="flex-1 pb-4 border-b border-slate-50 last:border-0">
      <p className={`text-xs font-semibold ${done ? "text-slate-800" : current ? "text-indigo-700" : "text-slate-400"}`}>{title}</p>
      <p className="text-[10px] font-medium text-slate-400 mt-0.5">{subtitle}</p>
    </div>
  </div>
)

// ─── Shipment Card component ─────────────────────────────────────────────────
const ShipmentCard = ({
  shipment,
  onScheduleReturn
}: {
  shipment: any
  onScheduleReturn?: (parentId: number) => void
}) => {
  const isForward = shipment.shipment_type === 'Forward'
  const statusCls = shipmentStatusColor[shipment.shipment_status] ?? "bg-slate-100 text-slate-600 border-slate-200"

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${isForward ? "bg-white border-blue-100 shadow-xs" : "bg-white border-orange-100 shadow-xs"}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isForward
            ? <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
              <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
            </div>
            : <div className="h-7 w-7 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center">
              <ArrowDownLeft className="h-3.5 w-3.5 text-orange-500" />
            </div>
          }
          <div>
            <p className="text-xs font-bold text-slate-800">
              {isForward ? "Forward Shipment" : "Return Shipment"}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {isForward ? "→ Delivering to customer" : "← Returning to warehouse"}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCls}`}>
          {shipment.shipment_status}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {shipment.courier_name && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">Courier</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{shipment.courier_name}</p>
          </div>
        )}
        {shipment.awb_code && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">AWB Code</p>
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-xs font-mono font-semibold text-slate-700 truncate">{shipment.awb_code}</p>
              <Copy
                className="h-3 w-3 text-slate-300 cursor-pointer hover:text-slate-600 flex-shrink-0"
                onClick={() => { navigator.clipboard.writeText(shipment.awb_code); toast.success("Copied!") }}
              />
            </div>
          </div>
        )}
        {shipment.shiprocket_order_id && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">SR Order ID</p>
            <p className="text-xs font-mono font-semibold text-slate-600 mt-0.5 truncate">{shipment.shiprocket_order_id}</p>
          </div>
        )}
        {shipment.pickup_status && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">Pickup</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{shipment.pickup_status}</p>
          </div>
        )}
        {(shipment.weight || shipment.length) && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">Dimensions</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {shipment.weight ? `${shipment.weight}kg` : ''}{shipment.length ? ` · ${shipment.length}×${shipment.breadth}×${shipment.height}cm` : ''}
            </p>
          </div>
        )}
        {shipment.pickup_scheduled_at && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">Pickup Scheduled</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {new Date(shipment.pickup_scheduled_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
        )}
      </div>

      {/* Actions Row */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
        <Link
          href={`/shipments/${shipment.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
        >
          <Truck className="h-3.5 w-3.5" />
          Manage Shipment Details (#SHP-{shipment.id})
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
        <div className="flex items-center gap-2 ml-auto">
          {shipment.tracking_url && (
            <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700">
              <ExternalLink className="h-3 w-3" /> Track
            </a>
          )}
          {shipment.shipping_label_url && (
            <a href={shipment.shipping_label_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-700">
              <Download className="h-3 w-3" /> Label
            </a>
          )}
          {shipment.invoice_url && (
            <a href={shipment.invoice_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-700">
              <FileText className="h-3 w-3" /> Invoice
            </a>
          )}
          {isForward && onScheduleReturn && (
            <button
              onClick={() => onScheduleReturn(shipment.id)}
              className="flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700"
            >
              <RotateCcw className="h-3 w-3" /> Return
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const queryClient = useQueryClient()

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("order-details")

  // Order actions state
  const [adminNote, setAdminNote] = useState("")
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  // Shipment form state
  const [shipWeight, setShipWeight] = useState("0.5")
  const [shipLength, setShipLength] = useState("10")
  const [shipBreadth, setShipBreadth] = useState("10")
  const [shipHeight, setShipHeight] = useState("10")
  const [shipRemarks, setShipRemarks] = useState("")
  const [shipPickupDate, setShipPickupDate] = useState("")
  const [isReturnMode, setIsReturnMode] = useState(false)
  const [returnParentId, setReturnParentId] = useState<number | null>(null)
  const [lastCreatedShipmentId, setLastCreatedShipmentId] = useState<number | null>(null)

  // ── Order fetch ───────────────────────────────────────────────────────────
  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) throw new Error("Failed to fetch order details")
      return res.json()
    },
    enabled: !!orderId
  })

  console.log("order detail ", orderData);


  // ── Shipments fetch ───────────────────────────────────────────────────────
  const { data: shipmentsData, isLoading: shipmentsLoading, refetch: refetchShipments } = useQuery({
    queryKey: ["order-shipments", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/shipments`)
      if (!res.ok) throw new Error("Failed to fetch shipments")
      return res.json()
    }
  })

  // ── Derived order data (must come before Razorpay query) ────────────────
  const order = orderData?.order


  const shipments: any[] = shipmentsData?.shipments || []

  // ── Razorpay Live Details fetch ──────────────────────────────────────────
  const razorpayPaymentId = order?.razorpayPaymentId
  const razorpayOrderId = order?.razorpayOrderId
  const hasRazorpay = Boolean(
    (razorpayPaymentId && razorpayPaymentId !== "N/A") ||
    (razorpayOrderId && razorpayOrderId !== "N/A")
  )
  const { data: razorpayData, isLoading: razorpayLoading } = useQuery({
    queryKey: ["order-razorpay", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/razorpay`)
      if (!res.ok) throw new Error("Failed to fetch razorpay details")
      return res.json()
    },
    enabled: hasRazorpay
  })

  console.log("razorpay", order?.razorpayPaymentId, "orderId", order?.razorpayOrderId, "orders", order)

  const forwardShipments = shipments.filter(s => s.shipment_type === 'Forward')
  const reverseShipments = shipments.filter(s => s.shipment_type === 'Reverse')
  const hasForward = forwardShipments.length > 0
  const hasReverse = reverseShipments.length > 0

  // Check if order is accepted/approved
  const isApproved = order && order.fulfillmentStatus !== "Pending" && order.fulfillmentStatus !== "Cancelled"
  const isCancelled = order?.fulfillmentStatus === "Cancelled"

  // ── Payment & Order Mode Validation ──────────────────────────────────────
  const orderMode = (order?.orderMode || "").toUpperCase() || (
    (order?.paymentMethod?.toLowerCase() === 'cod' || order?.paymentMethod?.toLowerCase() === 'cash') ? 'CASH' : 'ONLINE'
  )
  const isOnlineOrder = orderMode === 'ONLINE'
  const rawPaymentStatus = (order?.paymentStatus || 'PENDING').toUpperCase()

  // If razorpay payment or order ID exists, or raw payment status is PAID, effective payment status is PAID
  const effectivePaymentStatus = (hasRazorpay || rawPaymentStatus === 'PAID') ? 'PAID' : rawPaymentStatus

  // An online order is incomplete ONLY if:
  // 1. paymentStatus is explicitly NOT_PAID or FAILED, OR
  // 2. It has NO payment ID/order ID (hasRazorpay is false) AND paymentStatus is not PAID
  const isExplicitlyUnpaid = effectivePaymentStatus === 'NOT_PAID' || effectivePaymentStatus === 'FAILED'
  const isMissingPaymentInfo = !hasRazorpay && effectivePaymentStatus !== 'PAID'
  const isPaymentIncomplete = isOnlineOrder && (isExplicitlyUnpaid || isMissingPaymentInfo)

  // Derive current shipment status
  const currentShipmentStatusStr = forwardShipments[0]?.shipment_status || (hasForward ? "Created" : "Pending Creation")
  const currentShipmentCls = shipmentStatusColor[currentShipmentStatusStr] ?? "bg-slate-100 text-slate-700 border-slate-200"

  useEffect(() => {
    if (order) {
      setAdminNote(order.adminNote || "")
    }
  }, [order])

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load order: ${error.message || 'Unknown error'}. Please refresh the page.`)
    }
  }, [error])

  // ── Order update mutation ─────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (payload: {
      paymentStatus?: string
      fulfillmentStatus?: string
      adminNote?: string
      cancelReason?: string
    }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Failed to update order")
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })

      if (variables.fulfillmentStatus === "Confirmed") {
        toast.success("Order approved! Tab 2 (Create Shipment) is now unlocked.")
        setActiveTab("shipment")
      } else {
        toast.success("Order updated!")
      }
    },
    onError: (err: any) => toast.error(err.message || "Failed to update order")
  })

  // ── Create shipment mutation ──────────────────────────────────────────────
  const createShipmentMutation = useMutation({
    mutationFn: async (payload: {
      shipmentType: string
      weight: string
      length: string
      breadth: string
      height: string
      remarks: string
      pickupDate?: string
      parentShipmentId?: number | null
    }) => {
      const res = await fetch(`/api/orders/${orderId}/shipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create shipment")
      return data
    },
    onSuccess: (data) => {
      const createdId = data.shipment?.id
      if (createdId) {
        setLastCreatedShipmentId(createdId)
        toast.success(`Shipment #SHP-${createdId} created! Manage pickup and courier details below.`)
      } else if (data.warning) {
        toast.warning(data.warning)
      } else {
        toast.success(`${isReturnMode ? "Return" : "Forward"} shipment created with Shiprocket!`)
      }
      setIsReturnMode(false)
      setReturnParentId(null)
      queryClient.invalidateQueries({ queryKey: ["order-shipments", orderId] })
      queryClient.invalidateQueries({ queryKey: ["order", orderId] })
    },
    onError: (err: any) => toast.error(err.message || "Shipment creation failed")
  })

  const handleScheduleShipment = () => {
    if (!shipWeight || parseFloat(shipWeight) <= 0) {
      toast.error("Please enter a valid weight")
      return
    }
    if (!shipPickupDate) {
      toast.error("Please select a pickup date & time")
      return
    }
    createShipmentMutation.mutate({
      shipmentType: isReturnMode ? "Reverse" : "Forward",
      weight: shipWeight,
      length: shipLength,
      breadth: shipBreadth,
      height: shipHeight,
      remarks: shipRemarks,
      pickupDate: shipPickupDate || undefined,
      parentShipmentId: returnParentId
    })
  }

  const handleStartReturn = (parentId: number) => {
    setIsReturnMode(true)
    setReturnParentId(parentId)
  }

  const handleCancelReturn = () => {
    setIsReturnMode(false)
    setReturnParentId(null)
  }

  // ── Pre-handover Order Cancellation mutation ──────────────────────────────
  const cancelOrderMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelReason: reason })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to cancel order")
      return data
    },
    onSuccess: (data) => {
      toast.success(data.message || "Order and shipment successfully cancelled.")
      setIsCancelOpen(false)
      queryClient.invalidateQueries({ queryKey: ["order", orderId] })
      queryClient.invalidateQueries({ queryKey: ["order-shipments", orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
    onError: (err: any) => toast.error(err.message || "Failed to cancel order")
  })

  // ── Razorpay Refund mutation ──────────────────────────────────────────────
  const refundMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to process refund")
      return data
    },
    onSuccess: (data) => {
      toast.success(data.message || "Refund confirmed by Razorpay!")
      queryClient.invalidateQueries({ queryKey: ["order", orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
    onError: (err: any) => toast.error(err.message || "Refund initiation failed")
  })

  const handleApproveOrder = () => updateMutation.mutate({ paymentStatus: "PAID", fulfillmentStatus: "Confirmed" })
  const handleRejectOrder = () => setIsCancelOpen(true)
  const handleSaveNote = () => updateMutation.mutate({ adminNote })
  const handleCancelOrder = () => {
    cancelOrderMutation.mutate(cancelReason || "Cancelled by admin")
  }

  const handleTabChange = (val: string) => {
    if (val === "shipment" && !isApproved) {
      toast.error("Please approve the order first in Tab 1 before accessing Shipment!")
      return
    }
    setActiveTab(val)
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val || 0)

  const ps = order ? (paymentStatusConfig[order.paymentStatus] ?? paymentStatusConfig["PENDING"]) : null
  const ff = order ? (fulfillmentStatusConfig[order.fulfillmentStatus] ?? fulfillmentStatusConfig["Pending"]) : null

  const ffSteps = ["Pending", "Confirmed", "Packed", "Ready To Ship", "Shipped", "Delivered", "Completed"]
  const currentStep = order ? ffSteps.indexOf(order.fulfillmentStatus) : -1

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex flex-1 flex-col overflow-y-auto min-w-0">

          {/* ── Page Container ───────────────────────────────────────────────── */}
          <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-3">

            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
                  <p className="text-sm font-semibold text-slate-500">Loading order details…</p>
                </div>
              </div>
            ) : error || !order ? (
              <div className="flex items-center justify-center py-32 text-center">
                <div>
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-red-500">Failed to load order</p>
                  <p className="text-xs text-slate-400 mt-1">Please check your connection and try again.</p>
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">

                {/* ── 2-Step Workflow Shadcn Tabs Bar ──────────────────────── */}
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-3">
                  <TabsList className="bg-slate-100/80 p-1 rounded-xl h-auto gap-1 border border-slate-200/80">

                    {/* Tab 1: Order Details & Approval */}
                    <TabsTrigger
                      value="order-details"
                      className="px-4 py-2 rounded-lg text-xs font-bold gap-2 transition-all text-slate-600 hover:text-slate-900 data-[state=active]:bg-slate-900 data-[state=active]:!text-white data-[state=active]:shadow-xs cursor-pointer"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
                        1
                      </span>
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Order Details & Approval
                      {isApproved && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 ml-1" />
                      )}
                    </TabsTrigger>

                    {/* Tab 2: Create Shipment (Locked until order accepted) */}
                    <TabsTrigger
                      value="shipment"
                      disabled={!isApproved}
                      className="px-4 py-2 rounded-lg text-xs font-bold gap-2 transition-all text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-slate-900 data-[state=active]:!text-white data-[state=active]:shadow-xs cursor-pointer"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
                        2
                      </span>
                      <Truck className="h-3.5 w-3.5" />
                      Create Shipment
                      {!isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 ml-1">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 ml-1">
                          Ready
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Quick Order Approval Action Banner in Header */}
                  {isCancelled ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Order Cancelled
                      </span>
                    </div>
                  ) : isPaymentIncomplete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        Payment Not Completed
                      </span>
                      <Button
                        onClick={handleRejectOrder}
                        variant="outline"
                        className="h-9 px-4 text-xs font-bold text-red-600 border-red-200 bg-red-50 hover:bg-red-100 gap-1.5 cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject Order
                      </Button>
                    </div>
                  ) : !isApproved ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                        Order Needs Approval
                      </span>
                      <Button
                        onClick={handleRejectOrder}
                        variant="outline"
                        className="h-9 px-4 text-xs font-bold text-red-600 border-red-200 bg-red-50 hover:bg-red-100 gap-1.5 cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject Order
                      </Button>
                      <Button
                        onClick={handleApproveOrder}
                        disabled={updateMutation.isPending}
                        className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5"
                      >
                        {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Approve Order
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Order Approved
                      </span>
                      <Button
                        onClick={handleRejectOrder}
                        variant="outline"
                        className="h-9 px-4 text-xs font-bold text-red-600 border-red-200 bg-red-50 hover:bg-red-100 gap-1.5 cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel Order
                      </Button>
                      <Button
                        onClick={() => setActiveTab("shipment")}
                        variant="outline"
                        className="h-9 px-4 text-xs font-bold text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 shadow-xs gap-1.5"
                      >
                        Proceed to Create Shipment <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    TAB 1: ORDER DETAILS, PRODUCTS, CUSTOMER & PAYMENT
                    ═════════════════════════════════════════════════════════════ */}
                <TabsContent value="order-details" className="space-y-6 mt-0">

                  {/* Payment Incomplete Warning Banner */}
                  {!isCancelled && isPaymentIncomplete && (
                    <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-red-50 border border-red-200 shadow-xs flex-wrap">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-red-700">Order Payment Not Completed ({rawPaymentStatus})</p>
                          <p className="text-xs text-red-600 mt-0.5">
                            This online order has not been paid. Payment verification is required before order approval.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-3.5 py-1.5 rounded-xl">
                        Approval Disabled
                      </span>
                    </div>
                  )}

                  {/* Approval Banner Prompt */}
                  {isCancelled && (
                    <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-red-50 border border-red-200 shadow-xs flex-wrap">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-red-700">Order Cancelled</p>
                          <p className="text-xs text-red-500 mt-0.5">Reason: {order.cancelReason || "Pre-handover order cancellation"}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-slate-600 flex-wrap">
                            <span>Mode: <strong className={isOnlineOrder ? "text-indigo-700 font-bold" : "text-emerald-700 font-bold"}>{orderMode}</strong></span>
                            <span>Payment: <strong className={effectivePaymentStatus === 'PAID' ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>{effectivePaymentStatus}</strong></span>
                            <span>Return: <strong className="text-slate-900">{order.returnStatus || "None"}</strong></span>
                            <span>Refund: <strong className="text-slate-900">{order.refundStatus || (effectivePaymentStatus === 'PAID' && isOnlineOrder ? "PENDING" : "None")}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Refund Action Section */}
                      {isOnlineOrder && hasRazorpay ? (
                        <div>
                          {order.refundStatus === "REFUNDED" ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Refund Processed
                            </span>
                          ) : order.refundStatus === "PROCESSING" || refundMutation.isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-100 text-blue-800 font-bold text-xs border border-blue-200">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Processing Refund…
                            </span>
                          ) : (
                            <Button
                              onClick={() => refundMutation.mutate()}
                              disabled={refundMutation.isPending}
                              variant="outline"
                              className="h-9 px-4 text-xs font-bold text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
                            >
                              {refundMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                              {order.refundStatus === "FAILED" ? "Retry Refund" : "Start Refund"}
                            </Button>
                          )}
                        </div>
                      ) : isOnlineOrder ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200">
                          No Online Refund Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200">
                          Cash on Delivery (No Gateway Refund)
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid gap-6 lg:grid-cols-3">

                    {/* Left Column (Products & Customer) */}
                    <div className="lg:col-span-2 space-y-6">



                      {/* ── Product Details Card ──────────────────────── */}
                      <Card className="border border-slate-200/80 shadow-2xs bg-white overflow-hidden rounded-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-slate-700" />
                            <h2 className="text-xs font-bold text-slate-800 capitalize tracking-wider">Product Details</h2>
                            <span className="h-5 w-5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 flex items-center justify-center">
                              {order.products?.length || 0}
                            </span>
                          </div>
                        </div>
                        <CardContent className="p-0">
                          <div className="divide-y divide-slate-100">
                            {order.products?.map((item: any, idx: number) => (
                              <div key={item.id ?? idx} className="flex gap-4 p-5 hover:bg-slate-50/40 transition-colors">
                                <div className="h-20 w-20 rounded-xl border border-slate-200 bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
                                  {item.imageUrl
                                    ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                    : <Package className="h-8 w-8 text-slate-300" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-xs font-bold text-slate-900 leading-tight">{item.name}</h3>
                                      {item.slug && (
                                        <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">{item.slug}</p>
                                      )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-lg font-black text-slate-900">{formatCurrency(item.finalPrice)}</p>
                                      <p className="text-xs text-slate-400 font-medium">
                                        {formatCurrency(item.unitPrice)} × {item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {item.color && (
                                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                        {(() => {
                                          let colorStr = item.color
                                          let hexColor = null
                                          if (typeof colorStr === 'string' && colorStr.startsWith('{')) {
                                            try {
                                              const parsed = JSON.parse(colorStr)
                                              colorStr = parsed.name || colorStr
                                              hexColor = parsed.hex
                                            } catch (e) { }
                                          }
                                          return (
                                            <>
                                              {hexColor && <span className="h-2 w-2 rounded-full border border-slate-300" style={{ backgroundColor: hexColor }} />}
                                              {colorStr}
                                            </>
                                          )
                                        })()}
                                      </span>
                                    )}
                                    {item.size && (
                                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                        Size: {(() => {
                                          let sizeStr = item.size
                                          if (typeof sizeStr === 'string' && sizeStr.startsWith('{')) {
                                            try {
                                              const parsed = JSON.parse(sizeStr)
                                              sizeStr = parsed.size || sizeStr
                                            } catch (e) { }
                                          }
                                          return sizeStr
                                        })()}
                                      </span>
                                    )}
                                    <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                      SKU: {item.sku}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Order Financial Totals Summary */}
                          <div className="border-t border-slate-200/80 bg-slate-50/80 px-5 py-4 space-y-2">
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                              <span>Subtotal</span>
                              <span className="font-semibold text-slate-800">{formatCurrency(order.financials.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                              <span>Shipping Charges</span>
                              <span className="font-semibold text-slate-800">{formatCurrency(order.financials.shipping)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                              <span>Tax Amount (GST)</span>
                              <span className="font-semibold text-slate-800">{formatCurrency(order.financials.tax)}</span>
                            </div>
                            {order.financials.discount > 0 && (
                              <div className="flex justify-between text-xs font-medium text-slate-500">
                                <span className="flex items-center gap-1 text-slate-700 font-semibold">
                                  <Tag className="h-3 w-3" /> Discount {order.couponCode && `(${order.couponCode})`}
                                </span>
                                <span className="font-bold text-slate-900">−{formatCurrency(order.financials.discount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                              <span>Grand Total</span>
                              <span className="text-slate-900 text-base">{formatCurrency(order.financials.total)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* ── Customer Details & Shipping Address ──────── */}
                      <Card className="border border-slate-200/80 shadow-2xs bg-white overflow-hidden rounded-2xl">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                          <User className="h-4 w-4 text-slate-700" />
                          <h2 className="text-xs font-bold text-slate-800 capitalize tracking-wider">Customer & Delivery Details</h2>
                        </div>
                        <CardContent className="p-5">
                          <div className="grid sm:grid-cols-2 gap-6">

                            {/* Customer Profile */}
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 capitalize tracking-wider mb-3">Customer Information</p>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                                  {order.customerName?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{order.customerName || "Guest Customer"}</p>
                                  <p className="text-xs text-slate-400 font-medium">{order.customerEmail}</p>
                                </div>
                              </div>
                              <div className="space-y-1.5 text-xs text-slate-500 pl-1">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{order.customerEmail}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="font-mono text-slate-400 text-[10px]">User ID: {order.userId?.slice(0, 10)}…</span>
                                </div>
                              </div>
                              {order.customerNote && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                  <p className="text-[10px] font-bold text-amber-600 capitalize tracking-wider mb-0.5">Customer Note</p>
                                  <p className="text-xs italic text-amber-900">"{order.customerNote}"</p>
                                </div>
                              )}
                            </div>

                            {/* Shipping Address */}
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 capitalize tracking-wider mb-3">Shipping Address</p>
                              {order.shippingAddress ? (
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <User className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs font-bold text-slate-800">{order.shippingAddress.recipientName}</p>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Home className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-slate-700">{order.shippingAddress.fullAddress}</p>
                                      <p className="text-xs font-medium text-slate-700">
                                        {order.shippingAddress.city}, {order.shippingAddress.state}
                                      </p>
                                      <p className="text-xs font-bold text-slate-900 mt-0.5">PIN: {order.shippingAddress.pinCode}</p>
                                      {order.shippingAddress.landmark && (
                                        <p className="text-[10px] italic text-slate-400 mt-0.5">Landmark: {order.shippingAddress.landmark}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                    <p className="text-xs font-bold text-slate-800">{order.shippingAddress.recipientPhone}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <MapPin className="h-4 w-4" /> No shipping address provided
                                </div>
                              )}
                            </div>

                          </div>
                        </CardContent>
                      </Card>

                    </div>

                    {/* Right Column (Payment Details & Admin Notes) */}
                    <div className="space-y-6">

                      {/* ── Payment Details Card ──────────────────────── */}
                      <Card className="border border-slate-200/80 shadow-2xs bg-white overflow-hidden rounded-2xl">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                          <Receipt className="h-4 w-4 text-slate-700" />
                          <h2 className="text-xs font-bold text-slate-800 capitalize tracking-wider">Payment Details</h2>
                        </div>
                        <CardContent className="p-5 space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <div className="flex items-center gap-2.5">
                                <CreditCard className="h-4 w-4 text-slate-500" />
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">Payment Method</p>
                                  <p className="text-xs font-bold text-slate-800">{order.paymentMethod || "Razorpay Online"}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">Order Mode</p>
                                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${isOnlineOrder ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                                  {orderMode}
                                </span>
                              </div>
                            </div>
                            {order.razorpayPaymentId && order.razorpayPaymentId !== "N/A" && (
                              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <Hash className="h-4 w-4 text-slate-400" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">Razorpay Payment ID</p>
                                  <p className="text-[10px] font-mono font-bold text-slate-700 truncate">{order.razorpayPaymentId}</p>
                                </div>
                                <Copy className="h-3.5 w-3.5 text-slate-300 cursor-pointer hover:text-slate-600 flex-shrink-0"
                                  onClick={() => { navigator.clipboard.writeText(order.razorpayPaymentId); toast.success("Copied!") }} />
                              </div>
                            )}
                            {order.couponCode && (
                              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <Tag className="h-4 w-4 text-slate-700" />
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">Applied Coupon</p>
                                  <p className="text-xs font-bold text-slate-800 font-mono">{order.couponCode}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Highlighted Amount */}
                          <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs">
                            <p className="text-[10px] font-bold capitalize tracking-wider opacity-80 mb-1">Total Paid / Payable</p>
                            <p className="text-2xl font-black">{formatCurrency(order.financials.total)}</p>
                            <div className="mt-1.5 text-xs font-bold">
                              {isCancelled ? (
                                order.refundStatus === "REFUNDED" ? (
                                  <p className="text-emerald-300 flex items-center gap-1.5">
                                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> Order Cancelled · Refund Processed
                                  </p>
                                ) : order.refundStatus === "PROCESSING" ? (
                                  <p className="text-blue-300 flex items-center gap-1.5">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> Order Cancelled · Refund Processing
                                  </p>
                                ) : effectivePaymentStatus === "PAID" || hasRazorpay ? (
                                  <p className="text-amber-300 flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-amber-400" /> Payment Received · Refund Pending
                                  </p>
                                ) : (
                                  <p className="text-slate-400 flex items-center gap-1.5">
                                    <XCircle className="h-4 w-4 text-slate-400" /> Order Cancelled (Unpaid)
                                  </p>
                                )
                              ) : (
                                effectivePaymentStatus === "PAID" ? (
                                  <p className="text-slate-200 flex items-center gap-1.5">
                                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> Payment Confirmed & Received
                                  </p>
                                ) : (
                                  <p className="text-amber-200 flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-amber-400" /> Awaiting Customer Payment
                                  </p>
                                )
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* ── Razorpay Live Details Card ──────────────────────── */}
                      {hasRazorpay && (
                        <Card className="border border-indigo-200/80 shadow-2xs bg-white overflow-hidden rounded-2xl relative">
                          {razorpayLoading && (
                            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                              <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                              <p className="text-[10px] font-bold text-slate-500">Syncing Gateway Data...</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 px-5 py-4 border-b border-indigo-100 bg-indigo-50/60">
                            <h2 className="text-xs font-bold  capitalize tracking-wider">Live Payment Gateway</h2>
                          </div>
                          <CardContent className="p-5 space-y-4">
                            {razorpayData?.payment ? (
                              <>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">Gateway Status</p>
                                    <p className="text-xs font-bold text-slate-800 capitalize">{razorpayData.payment.status}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider">Method</p>
                                    <p className="text-xs font-bold text-slate-800 uppercase">{razorpayData.payment.method}</p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Captured Amount</span>
                                    <span className="font-bold text-slate-900">{formatCurrency((razorpayData.payment.amount || 0) / 100)}</span>
                                  </div>
                                  {razorpayData.payment.fee && (
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-medium text-red-500">Gateway Fee</span>
                                      <span className="font-semibold text-red-600">-{formatCurrency((razorpayData.payment.fee || 0) / 100)}</span>
                                    </div>
                                  )}
                                  {razorpayData.payment.tax && (
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-medium text-red-500">Tax on Fee</span>
                                      <span className="font-semibold text-red-600">-{formatCurrency((razorpayData.payment.tax || 0) / 100)}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-3 border-t border-slate-100">
                                  <p className="text-[9px] font-bold text-slate-400 capitalize tracking-wider mb-2">Customer Identity (Gateway)</p>
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-3 w-3 text-slate-400" />
                                      <span className="text-[11px] font-medium text-slate-700">{razorpayData.payment.email || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3 w-3 text-slate-400" />
                                      <span className="text-[11px] font-medium text-slate-700">{razorpayData.payment.contact || "N/A"}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : !razorpayLoading ? (
                              <div className="text-center py-4">
                                <p className="text-xs font-medium text-red-500">Failed to load Razorpay details.</p>
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      )}

                      {/* ── Admin Notes Card ──────────────────────────── */}
                      <Card className="border border-slate-200/80 shadow-2xs bg-white overflow-hidden rounded-2xl">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <h2 className="text-xs font-bold text-slate-800 capitalize tracking-wider">Internal Admin Notes</h2>
                        </div>
                        <CardContent className="p-5">
                          <textarea
                            className="w-full h-24 p-3 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-500 resize-none"
                            placeholder="Add notes or handling preferences for this order…"
                            value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                          />
                          <div className="mt-2.5 flex justify-end">
                            <Button size="sm" variant="outline" disabled={updateMutation.isPending}
                              onClick={handleSaveNote}
                              className="text-xs font-bold text-slate-900 border-slate-200 hover:bg-slate-100 bg-white h-8 gap-1.5 cursor-pointer">
                              <Save className="h-3.5 w-3.5" /> Save Note
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                    </div>

                  </div>
                </TabsContent>

                {/* ═════════════════════════════════════════════════════════════
                    TAB 2: CREATE SHIPMENT & LOGISTICS
                    ═════════════════════════════════════════════════════════════ */}
                <TabsContent value="shipment" className="space-y-6 mt-0">

                  {/* Gatekeeper Check */}
                  {!isApproved ? (
                    <Card className="border border-amber-200 bg-amber-50/70 p-8 text-center rounded-2xl shadow-2xs">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="h-12 w-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                          <Lock className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-bold text-amber-900">Order Approval Required</h3>
                        <p className="text-xs text-amber-700 font-medium">
                          You cannot create a shipment or assign a courier until the order has been accepted/approved in Step 1.
                        </p>
                        <Button
                          onClick={() => setActiveTab("order-details")}
                          className="mt-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2"
                        >
                          <ShoppingBag className="h-4 w-4" /> Go to Step 1: Order Details & Approval
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <div className="grid gap-6 lg:grid-cols-3">

                      {/* Left Column (Create Shipment Form & Shipments List) */}
                      <div className="lg:col-span-2 space-y-6">

                        {/* Post-Creation Action Banner */}
                        {lastCreatedShipmentId && (
                          <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-center justify-between shadow-2xs flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-bold text-white">Shipment #SHP-{lastCreatedShipmentId} Created Successfully!</p>
                                <p className="text-[11px] text-slate-300 font-medium">Click below to manage courier details, schedule pickup, and download shipping labels.</p>
                              </div>
                            </div>
                            <Button asChild className="h-8 px-3.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 gap-1.5 shadow-2xs cursor-pointer">
                              <Link href={`/shipments/${lastCreatedShipmentId}`}>
                                Go to Shipment Details <ChevronRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        )}

                        {/* Schedule Shipment Form */}
                        <Card className={`border shadow-2xs overflow-hidden rounded-2xl ${isReturnMode ? "bg-white border-orange-200" : "bg-white border-slate-200/80"
                          }`}>
                          <div className={`flex items-center justify-between px-5 py-4 border-b ${isReturnMode ? "bg-orange-50/80 border-orange-100" : "bg-slate-50/80 border-slate-100"
                            }`}>
                            <div className="flex items-center gap-2">
                              {isReturnMode ? (
                                <ArrowDownLeft className="h-4 w-4 text-orange-600" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-slate-700" />
                              )}
                              <div>
                                <h2 className={`text-xs font-bold capitalize tracking-wider ${isReturnMode ? "text-orange-900" : "text-slate-900"
                                  }`}>
                                  {isReturnMode ? "Schedule Return Shipment" : "Schedule Forward Shipment"}
                                </h2>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  {isReturnMode
                                    ? "Create reverse logistics pickup from customer via Shiprocket"
                                    : "Push order to Shiprocket, generate AWB, and request pickup"}
                                </p>
                              </div>
                            </div>
                            {isReturnMode && (
                              <Button variant="ghost" size="sm" onClick={handleCancelReturn} className="h-7 text-xs text-slate-500">
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel Return
                              </Button>
                            )}
                          </div>

                          <CardContent className="p-5 space-y-4">

                            {/* Dimensions */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider block mb-1">
                                  Weight (kg) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  type="number" step="0.1" min="0.1"
                                  value={shipWeight}
                                  onChange={e => setShipWeight(e.target.value)}
                                  className="h-9 text-xs font-semibold border-slate-200 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider block mb-1">
                                  Length (cm)
                                </label>
                                <Input
                                  type="number" step="1" min="1"
                                  value={shipLength}
                                  onChange={e => setShipLength(e.target.value)}
                                  className="h-9 text-xs font-semibold border-slate-200 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider block mb-1">
                                  Breadth (cm)
                                </label>
                                <Input
                                  type="number" step="1" min="1"
                                  value={shipBreadth}
                                  onChange={e => setShipBreadth(e.target.value)}
                                  className="h-9 text-xs font-semibold border-slate-200 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider block mb-1">
                                  Height (cm)
                                </label>
                                <Input
                                  type="number" step="1" min="1"
                                  value={shipHeight}
                                  onChange={e => setShipHeight(e.target.value)}
                                  className="h-9 text-xs font-semibold border-slate-200 rounded-lg"
                                />
                              </div>
                            </div>

                            {/* Pickup Date & Time */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider block mb-1">
                                Scheduled Pickup Date & Time <span className="text-red-500">*</span>
                              </label>
                              <Input
                                type="datetime-local"
                                value={shipPickupDate}
                                min={(() => {
                                  const offset = new Date().getTimezoneOffset() * 60000;
                                  return new Date(Date.now() - offset).toISOString().slice(0, 16);
                                })()}
                                onChange={e => setShipPickupDate(e.target.value)}
                                className="h-9 text-xs font-semibold border-slate-200 rounded-lg"
                              />
                            </div>

                            {/* Remarks */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider block mb-1">
                                Remarks / Courier Instructions
                              </label>
                              <Input
                                value={shipRemarks}
                                onChange={e => setShipRemarks(e.target.value)}
                                placeholder="e.g. Fragile items, handle with care…"
                                className="h-9 text-xs border-slate-200 rounded-lg"
                              />
                            </div>

                            {/* Warehouse / pickup location */}
                            {order.warehouse ? (
                              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <PackageCheck className="h-3.5 w-3.5 text-slate-700" />
                                  <p className="text-[10px] font-bold text-slate-500 capitalize tracking-wider">
                                    {isReturnMode ? "Return Destination Warehouse" : "Dispatch Warehouse"}
                                  </p>
                                </div>
                                <p className="text-xs font-bold text-slate-800">{order.warehouse.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  {order.warehouse.addressLine1} {order.warehouse.addressLine2 ? `, ${order.warehouse.addressLine2}` : ''}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  {order.warehouse.city}, {order.warehouse.state} — {order.warehouse.pincode}
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-600">
                                ⚠ No warehouse assigned. Please set up a warehouse in Settings.
                              </div>
                            )}

                            {/* Submit */}
                            <Button
                              onClick={handleScheduleShipment}
                              disabled={createShipmentMutation.isPending}
                              className={`w-full h-10 text-xs font-bold gap-2 text-white shadow-xs rounded-xl cursor-pointer ${isReturnMode
                                ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                                : "bg-slate-900 hover:bg-black"
                                }`}
                            >
                              {createShipmentMutation.isPending
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> {isReturnMode ? "Scheduling Return…" : "Creating Shiprocket Order…"}</>
                                : <><CalendarCheck2 className="h-4 w-4" /> {isReturnMode ? "Create Return Shipment" : "Create Forward Shipment & Assign AWB"}</>
                              }
                            </Button>

                          </CardContent>
                        </Card>

                        {/* Existing Shipments List */}
                        <Card className="border border-slate-200/80 shadow-2xs bg-white overflow-hidden rounded-2xl">
                          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-slate-700" />
                              <h2 className="text-xs font-bold text-slate-800 capitalize tracking-wider">Shipment Records</h2>
                              {shipments.length > 0 && (
                                <span className="h-5 w-5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 flex items-center justify-center">
                                  {shipments.length}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => refetchShipments()}
                              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                              title="Refresh shipments"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <CardContent className="p-5 space-y-3">
                            {shipmentsLoading ? (
                              <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading shipments…
                              </div>
                            ) : shipments.length === 0 ? (
                              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                                No shipments created yet. Fill the form above to schedule shipment with Shiprocket.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {forwardShipments.map((s: any) => (
                                  <ShipmentCard
                                    key={s.id}
                                    shipment={s}
                                    onScheduleReturn={!hasReverse ? handleStartReturn : undefined}
                                  />
                                ))}
                                {reverseShipments.map((s: any) => (
                                  <ShipmentCard
                                    key={s.id}
                                    shipment={s}
                                  />
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                      </div>

                      {/* Right Column (Live Status Overview & Timeline) */}
                      <div className="space-y-6">

                        {/* Live Status Overview Card (Read-Only Badges) */}
                        <Card className="border border-slate-200 shadow-2xs bg-white overflow-hidden rounded-2xl">
                          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                            <h2 className="text-xs font-bold text-slate-800 capitalize tracking-wider">Live Status Overview</h2>
                          </div>
                          <CardContent className="p-5 space-y-4">
                            {/* Fulfillment Status (Read-Only Highlighted Badge) */}
                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 capitalize tracking-wider block">Fulfillment Status</label>
                              {ff && (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-800 shadow-2xs">
                                    <span className={`h-2 w-2 rounded-full ${ff.dot}`} />
                                    {ff.label}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Current Shipment Status (Read-Only Highlighted Badge) */}
                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 capitalize tracking-wider block">Current Shipment Status</label>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border shadow-2xs ${currentShipmentCls}`}>
                                  <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                                  {currentShipmentStatusStr}
                                </span>
                              </div>
                              {forwardShipments[0]?.awb_code && (
                                <p className="text-[10px] text-slate-500 font-mono font-semibold pt-1">
                                  AWB: {forwardShipments[0].awb_code} {forwardShipments[0].courier_name ? `(${forwardShipments[0].courier_name})` : ''}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Order Timeline */}
                        <Card className="border border-slate-200/80 shadow-2xs bg-white overflow-hidden rounded-2xl">
                          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                            <Clock className="h-4 w-4 text-slate-700" />
                            <h2 className="text-xs font-bold text-slate-800 capitalize tracking-wider">Fulfillment Progress</h2>
                          </div>
                          <CardContent className="p-5">
                            <div className="space-y-0">
                              <TimelineStep
                                title="1. Order Placed"
                                subtitle={order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                done={true}
                              />
                              <TimelineStep
                                title="2. Order Approved"
                                subtitle={isApproved ? "Order accepted" : "Pending approval"}
                                done={isApproved}
                                current={!isApproved}
                              />
                              <TimelineStep
                                title="3. Shipment Created"
                                subtitle={hasForward ? `AWB: ${forwardShipments[0]?.awb_code || "Generated"}` : "Awaiting shipment creation"}
                                done={hasForward}
                                current={isApproved && !hasForward}
                              />
                              <TimelineStep
                                title="4. Pickup & In Transit"
                                subtitle={forwardShipments[0]?.pickup_status || "Pending pickup"}
                                done={currentStep >= 4}
                                current={hasForward && currentStep < 4}
                              />
                              <TimelineStep
                                title="5. Delivered"
                                subtitle="Package delivered to customer"
                                done={currentStep >= 5}
                              />
                            </div>
                          </CardContent>
                        </Card>

                      </div>

                    </div>
                  )}
                </TabsContent>

              </Tabs>
            )}

          </div>
        </div>
      </SidebarInset>

      {/* ── Cancel / Reject Order Dialog ─────────────────────────────────── */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[440px] bg-white border border-slate-200 text-slate-900 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Cancel this order?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">
              The shipment has not been handed over to the courier. Cancelling this order will cancel the Shiprocket shipment. The payment will remain <strong>PAID</strong> and a refund will be available to start separately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Cancellation Reason (Optional)</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="e.g. Out of stock, customer requested cancellation, invalid delivery pincode…"
              className="w-full h-20 p-3 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-red-300 focus:border-red-400 resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCancelOpen(false)}
              className="text-xs font-bold border-slate-200 text-slate-700 rounded-xl cursor-pointer"
            >
              Keep Order
            </Button>
            <Button
              onClick={handleCancelOrder}
              disabled={cancelOrderMutation.isPending}
              className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5 rounded-xl cursor-pointer"
            >
              {cancelOrderMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
