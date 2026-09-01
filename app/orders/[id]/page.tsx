"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft, CheckCircle2, Printer, Download, Package,
  User, MapPin, Save, CalendarDays, Phone,
  Clock, ShoppingBag, Truck, AlertCircle, CheckCheck,
  XCircle, Copy, FileText, Tag,
  Star, Receipt, Banknote, ShieldCheck, CalendarCheck2,
  CircleDot, Hash, Mail, Home, ExternalLink, RotateCcw,
  ArrowUpRight, ArrowDownLeft, CreditCard, PackageCheck,
  Loader2, RefreshCw
} from "lucide-react"
import Link from "next/link"
import React, { useState } from "react"
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
}

const fulfillmentStatusConfig: Record<string, { label: string; dot: string }> = {
  "Pending": { label: "Pending", dot: "bg-amber-400" },
  "Confirmed": { label: "Confirmed", dot: "bg-blue-500" },
  "Packed": { label: "Packed", dot: "bg-indigo-500" },
  "Ready To Ship": { label: "Ready To Ship", dot: "bg-violet-500" },
  "Shipped": { label: "Shipped", dot: "bg-cyan-500" },
  "Delivered": { label: "Delivered", dot: "bg-emerald-500" },
  "Completed": { label: "Completed", dot: "bg-emerald-600" },
  "Cancelled": { label: "Cancelled", dot: "bg-red-500" },
}

const shipmentStatusColor: Record<string, string> = {
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
    <div className="flex-1 pb-5 border-b border-slate-50 last:border-0">
      <p className={`text-sm font-semibold ${done ? "text-slate-800" : current ? "text-indigo-700" : "text-slate-400"}`}>{title}</p>
      <p className="text-[11px] font-medium text-slate-400 mt-0.5">{subtitle}</p>
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
    <div className={`rounded-xl border p-4 space-y-3 ${isForward ? "bg-white border-blue-100" : "bg-white border-orange-100"}`}>
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
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Courier</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{shipment.courier_name}</p>
          </div>
        )}
        {shipment.awb_code && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">AWB Code</p>
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
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">SR Order ID</p>
            <p className="text-xs font-mono font-semibold text-slate-600 mt-0.5 truncate">{shipment.shiprocket_order_id}</p>
          </div>
        )}
        {shipment.pickup_status && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pickup</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{shipment.pickup_status}</p>
          </div>
        )}
        {(shipment.weight || shipment.length) && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Dimensions</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {shipment.weight ? `${shipment.weight}kg` : ''}{shipment.length ? ` · ${shipment.length}×${shipment.breadth}×${shipment.height}cm` : ''}
            </p>
          </div>
        )}
        {shipment.pickup_scheduled_at && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pickup Scheduled</p>
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
        {shipment.created_at && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Created</p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              {new Date(shipment.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
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
        {/* Show Schedule Return button on forward shipments if no reverse exists yet */}
        {isForward && onScheduleReturn && (
          <button
            onClick={() => onScheduleReturn(shipment.id)}
            className="ml-auto flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700"
          >
            <RotateCcw className="h-3 w-3" /> Schedule Return
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const queryClient = useQueryClient()

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

  // ── Order fetch ───────────────────────────────────────────────────────────
  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) throw new Error("Failed to fetch order details")
      return res.json()
    }
  })

  // ── Shipments fetch ───────────────────────────────────────────────────────
  const { data: shipmentsData, isLoading: shipmentsLoading, refetch: refetchShipments } = useQuery({
    queryKey: ["order-shipments", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/shipments`)
      if (!res.ok) throw new Error("Failed to fetch shipments")
      return res.json()
    }
  })

  const order = orderData?.order
  const shipments: any[] = shipmentsData?.shipments || []
  const forwardShipments = shipments.filter(s => s.shipment_type === 'Forward')
  const reverseShipments = shipments.filter(s => s.shipment_type === 'Reverse')
  const hasForward = forwardShipments.length > 0
  const hasReverse = reverseShipments.length > 0

  React.useEffect(() => {
    if (order) {
      setAdminNote(order.adminNote || "")
    }
  }, [order])

  // ── Order update mutation ─────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (payload: {
      paymentStatus?: string
      fulfillmentStatus?: string
      returnStatus?: string
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
    onSuccess: () => {
      toast.success("Order updated!")
      queryClient.invalidateQueries({ queryKey: ["order", orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
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
      if (data.warning) {
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
      toast.error("Please select a pickup date")
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
    // scroll to schedule section
    document.getElementById("schedule-section")?.scrollIntoView({ behavior: "smooth" })
  }

  const handleCancelReturn = () => {
    setIsReturnMode(false)
    setReturnParentId(null)
  }

  const handleApproveOrder = () => updateMutation.mutate({ paymentStatus: "PAID", fulfillmentStatus: "Confirmed" })
  const handleRejectOrder = () => setIsCancelOpen(true)
  const handleFulfillmentChange = (val: string) => updateMutation.mutate({ fulfillmentStatus: val })
  const handleReturnStatusChange = (val: string) => updateMutation.mutate({ returnStatus: val })
  const handleSaveNote = () => updateMutation.mutate({ adminNote })
  const handleCancelOrder = () => {
    updateMutation.mutate({ fulfillmentStatus: "Cancelled", cancelReason: cancelReason || "Cancelled by admin" })
    setIsCancelOpen(false)
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val || 0)

  const ps = order ? (paymentStatusConfig[order.paymentStatus] ?? paymentStatusConfig["PENDING"]) : null
  const ff = order ? (fulfillmentStatusConfig[order.fulfillmentStatus] ?? fulfillmentStatusConfig["Pending"]) : null

  const ffSteps = ["Pending", "Confirmed", "Packed", "Ready To Ship", "Shipped", "Delivered", "Completed"]
  const currentStep = order ? ffSteps.indexOf(order.fulfillmentStatus) : -1

  // Whether to show the schedule shipment form:
  // Forward: only when fulfillment is Confirmed (order approved) AND no forward shipment yet
  // Return: whenever admin clicks Schedule Return
  const showForwardSchedule = order?.fulfillmentStatus === "Confirmed" && !hasForward && !isReturnMode
  const showReturnSchedule = isReturnMode

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] min-h-screen">
        <SiteHeader />

        <div className="flex flex-1 flex-col">

          {/* ── Top Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-wrap gap-3 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <Link href="/orders">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">
                  {order?.displayId || `#ORD-${orderId?.slice(0, 8).toUpperCase()}`}
                </h1>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {order?.created_at ? new Date(order.created_at).toLocaleString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "numeric", minute: "2-digit", hour12: true
                  }) : "—"}
                </p>
              </div>
              {ps && (
                <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${ps.bg} ${ps.color}`}>
                  {ps.icon}{ps.label}
                </span>
              )}
              {ff && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-700">
                  <span className={`h-1.5 w-1.5 rounded-full ${ff.dot}`} />
                  {ff.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="text-xs font-semibold text-slate-600 border-slate-200 h-8 gap-1.5">
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
              <Button variant="outline" className="text-xs font-semibold text-slate-600 border-slate-200 h-8 gap-1.5">
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
            </div>
          </div>

          {/* ── Page Content ─────────────────────────────────────────────────── */}
          <div className="flex-1 p-5 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-400">Loading order…</p>
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
              <div className="max-w-7xl mx-auto grid gap-5 lg:grid-cols-3">

                {/* ════════════════════════════════════
                    LEFT COLUMN
                    ════════════════════════════════════ */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Cancelled Banner */}
                  {order.fulfillmentStatus === "Cancelled" && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-700">Order Cancelled</p>
                        <p className="text-xs text-red-500 mt-0.5">{order.cancelReason || "No reason provided"}</p>
                      </div>
                    </div>
                  )}

                  {/* ── Products ─────────────────────────────────────── */}
                  <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-slate-400" />
                        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Products Ordered</h2>
                        <span className="h-5 w-5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center">
                          {order.products?.length || 0}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-50">
                        {order.products?.map((item: any, idx: number) => (
                          <div key={item.id ?? idx} className="flex gap-4 p-5 hover:bg-slate-50/50 transition-colors">
                            {/* Product image — larger */}
                            <div className="h-24 w-24 rounded-xl border border-slate-200 bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                              {item.imageUrl
                                ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                : <Package className="h-8 w-8 text-slate-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              {/* Name + price row */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-bold text-slate-900 leading-tight">{item.name}</h3>
                                  {item.slug && (
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{item.slug}</p>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-base font-black text-indigo-700">{formatCurrency(item.finalPrice * item.quantity)}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    {formatCurrency(item.finalPrice)} × {item.quantity}
                                  </p>
                                  {item.discountAmount > 0 && (
                                    <p className="text-[10px] font-medium text-slate-400 line-through">{formatCurrency(item.unitPrice)}</p>
                                  )}
                                </div>
                              </div>
                              {/* Attributes row */}
                              <div className="flex flex-wrap items-center gap-2">
                                {item.color && (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
                                    <span className="h-2.5 w-2.5 rounded-full border border-slate-300" style={{ backgroundColor: item.color.toLowerCase() }} />
                                    {item.color}
                                  </span>
                                )}
                                {item.size && (
                                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
                                    Size: {item.size}
                                  </span>
                                )}
                                <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full">
                                  SKU: {item.sku}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
                                  Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-500">
                          <span>Subtotal</span>
                          <span className="font-semibold text-slate-700">{formatCurrency(order.financials.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-slate-500">
                          <span>Shipping</span>
                          <span className="font-semibold text-slate-700">{formatCurrency(order.financials.shipping)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-slate-500">
                          <span>Tax (GST)</span>
                          <span className="font-semibold text-slate-700">{formatCurrency(order.financials.tax)}</span>
                        </div>
                        {order.financials.discount > 0 && (
                          <div className="flex justify-between text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {order.couponCode && <span className="font-mono text-emerald-600">({order.couponCode})</span>}
                            </span>
                            <span className="font-bold text-emerald-600">−{formatCurrency(order.financials.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                          <span>Grand Total</span>
                          <span className="text-indigo-700 text-base">{formatCurrency(order.financials.total)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ── Customer & Shipping ───────────────────────────── */}
                  <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                      <User className="h-4 w-4 text-slate-400" />
                      <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Customer & Delivery Details</h2>
                    </div>
                    <CardContent className="p-5">
                      <div className="grid sm:grid-cols-2 gap-6">
                        {/* Who Ordered */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Who Ordered</p>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {order.customerName?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{order.customerName || "Guest"}</p>
                              <p className="text-xs text-slate-400 font-medium">{order.customerEmail}</p>
                            </div>
                          </div>
                          <div className="space-y-2 pl-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Hash className="h-3 w-3 text-slate-300" />
                              <span className="font-mono text-slate-400 text-[10px]">{order.userId?.slice(0, 8)}…</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Mail className="h-3 w-3 text-slate-300" />
                              <span>{order.customerEmail}</span>
                            </div>
                          </div>
                          {order.customerNote && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Customer Note</p>
                              <p className="text-xs italic text-amber-800">"{order.customerNote}"</p>
                            </div>
                          )}
                        </div>

                        {/* Where It's Going */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Where It's Going</p>
                          {order.shippingAddress ? (
                            <div className="space-y-2.5">
                              <div className="flex items-start gap-2">
                                <User className="h-3.5 w-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
                                <p className="text-sm font-bold text-slate-800">{order.shippingAddress.recipientName}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <Home className="h-3.5 w-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-slate-600">{order.shippingAddress.fullAddress}</p>
                                  <p className="text-xs font-medium text-slate-600">
                                    {order.shippingAddress.city}, {order.shippingAddress.state}
                                  </p>
                                  <p className="text-xs font-bold text-slate-700">PIN: {order.shippingAddress.pinCode}</p>
                                  {order.shippingAddress.landmark && (
                                    <p className="text-[10px] italic text-slate-400 mt-0.5">Near: {order.shippingAddress.landmark}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
                                <Phone className="h-3.5 w-3.5 text-slate-300" />
                                <p className="text-xs font-bold text-slate-700">{order.shippingAddress.recipientPhone}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <MapPin className="h-4 w-4" /> No address on file
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ── Shipments Section ─────────────────────────────── */}
                  <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-slate-400" />
                        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Shipments</h2>
                        {shipments.length > 0 && (
                          <span className="h-5 w-5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center">
                            {shipments.length}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => refetchShipments()}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Refresh shipments"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <CardContent className="p-5 space-y-4">

                      {/* Loading */}
                      {shipmentsLoading && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading shipments…
                        </div>
                      )}

                      {/* No shipments — pending order */}
                      {!shipmentsLoading && forwardShipments.length === 0 && order.fulfillmentStatus === "Pending" && (
                        <div className="flex flex-col items-center py-8 text-center">
                          <div className="h-12 w-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
                            <Clock className="h-6 w-6 text-amber-400" />
                          </div>
                          <p className="text-sm font-bold text-slate-500">Order is Pending</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-xs">
                            Approve the order first. Once status is <strong>Confirmed</strong>, you can schedule a shipment via Shiprocket.
                          </p>
                        </div>
                      )}

                      {/* Existing shipments */}
                      {!shipmentsLoading && (forwardShipments.length > 0 || reverseShipments.length > 0) && (
                        <div className="space-y-3">
                          {/* Forward shipments */}
                          {forwardShipments.map((s: any) => (
                            <ShipmentCard
                              key={s.id}
                              shipment={s}
                              onScheduleReturn={!hasReverse ? handleStartReturn : undefined}
                            />
                          ))}
                          {/* Reverse shipments */}
                          {reverseShipments.map((s: any) => (
                            <ShipmentCard
                              key={s.id}
                              shipment={s}
                            />
                          ))}
                        </div>
                      )}

                      {/* ── Schedule Shipment Form ────────────────────── */}
                      {(showForwardSchedule || showReturnSchedule) && (
                        <div id="schedule-section" className={`rounded-xl border p-4 space-y-4 ${
                          isReturnMode
                            ? "bg-orange-50/60 border-orange-200"
                            : "bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200"
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isReturnMode
                                ? <ArrowDownLeft className="h-4 w-4 text-orange-500" />
                                : <ArrowUpRight className="h-4 w-4 text-indigo-500" />
                              }
                              <div>
                                <p className={`text-xs font-bold uppercase tracking-wider ${isReturnMode ? "text-orange-700" : "text-indigo-700"}`}>
                                  {isReturnMode ? "Schedule Return Shipment" : "Schedule Forward Shipment"}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  {isReturnMode
                                    ? "Creates a reverse logistics shipment via Shiprocket (Pending approval)"
                                    : "Creates the order in Shiprocket and assigns AWB"}
                                </p>
                              </div>
                            </div>
                            {isReturnMode && (
                              <button onClick={handleCancelReturn} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          {/* Dimensions */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Weight (kg) *
                              </label>
                              <Input
                                type="number" step="0.1" min="0.1"
                                value={shipWeight}
                                onChange={e => setShipWeight(e.target.value)}
                                className="h-9 text-xs font-semibold border-slate-200"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Length (cm)
                              </label>
                              <Input
                                type="number" step="1" min="1"
                                value={shipLength}
                                onChange={e => setShipLength(e.target.value)}
                                className="h-9 text-xs font-semibold border-slate-200"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Breadth (cm)
                              </label>
                              <Input
                                type="number" step="1" min="1"
                                value={shipBreadth}
                                onChange={e => setShipBreadth(e.target.value)}
                                className="h-9 text-xs font-semibold border-slate-200"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Height (cm)
                              </label>
                              <Input
                                type="number" step="1" min="1"
                                value={shipHeight}
                                onChange={e => setShipHeight(e.target.value)}
                                className="h-9 text-xs font-semibold border-slate-200"
                              />
                            </div>
                          </div>

                          {/* Pickup Date & Time */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Pickup Date & Time <span className="text-red-400">*</span>
                            </label>
                            <Input
                              type="datetime-local"
                              value={shipPickupDate}
                              min={(() => {
                                const offset = new Date().getTimezoneOffset() * 60000;
                                return new Date(Date.now() - offset).toISOString().slice(0, 16);
                              })()}
                              onChange={e => setShipPickupDate(e.target.value)}
                              className="h-9 text-xs font-semibold border-slate-200"
                            />
                          </div>

                          {/* Remarks */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Remarks / Comments
                            </label>
                            <Input
                              value={shipRemarks}
                              onChange={e => setShipRemarks(e.target.value)}
                              placeholder="e.g. Handle with care, fragile items…"
                              className="h-9 text-xs border-slate-200"
                            />
                          </div>

                          {/* Warehouse / pickup location card */}
                          {/* Warehouse / pickup location card */}
                          {order.warehouse ? (
                            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <PackageCheck className="h-3.5 w-3.5 text-indigo-400" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  {isReturnMode ? "Return Destination" : "Pickup Location"}
                                </p>
                              </div>
                              <p className="text-xs font-bold text-slate-800">{order.warehouse.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {order.warehouse.addressLine1}
                                {order.warehouse.addressLine2 ? `, ${order.warehouse.addressLine2}` : ''}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {order.warehouse.city}, {order.warehouse.state} — {order.warehouse.pincode}
                              </p>
                              {order.warehouse.phone && (
                                <p className="text-[10px] text-slate-400">📞 {order.warehouse.phone}</p>
                              )}
                              {!order.warehouseId && (
                                <p className="text-[10px] text-amber-500 font-semibold mt-1">⚠ Using default warehouse (none assigned to order)</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200 text-[10px] text-red-600">
                              <PackageCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                              <span>No warehouse found. Please add a warehouse in Settings before scheduling.</span>
                            </div>
                          )}

                          {/* Submit */}
                          <Button
                            onClick={handleScheduleShipment}
                            disabled={createShipmentMutation.isPending}
                            className={`w-full h-10 text-xs font-bold gap-2 text-white ${
                              isReturnMode
                                ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                                : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                            }`}
                          >
                            {createShipmentMutation.isPending
                              ? <><Loader2 className="h-4 w-4 animate-spin" /> {isReturnMode ? "Scheduling return…" : "Scheduling with Shiprocket…"}</>
                              : <><CalendarCheck2 className="h-4 w-4" /> {isReturnMode ? "Schedule Return Shipment" : "Schedule Forward Shipment"}</>
                            }
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ── Admin Notes ───────────────────────────────────── */}
                  <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Internal Admin Notes</h2>
                    </div>
                    <CardContent className="p-5">
                      <textarea
                        className="w-full h-24 p-3 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 resize-none"
                        placeholder="Customer preferences, handling instructions, internal flags…"
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                      />
                      <div className="mt-2.5 flex justify-end">
                        <Button size="sm" variant="outline" disabled={updateMutation.isPending}
                          onClick={handleSaveNote}
                          className="text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-8 gap-1.5">
                          <Save className="h-3.5 w-3.5" /> Save Note
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* ════════════════════════════════════
                    RIGHT COLUMN
                    ════════════════════════════════════ */}
                <div className="space-y-5">

                  {/* ── Order Actions ─────────────────────────────────── */}
                  <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                      <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Order Actions</h2>
                    </div>
                    <CardContent className="p-5 space-y-3">
                      {/* Payment Status badge */}
                      {ps && (
                        <div className={`flex items-center gap-2.5 p-3 rounded-lg border ${ps.bg}`}>
                          {ps.icon}
                          <div>
                            <p className={`text-xs font-bold ${ps.color}`}>{ps.label}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Payment status</p>
                          </div>
                        </div>
                      )}

                      {/* Fulfillment Status dropdown */}
                      {ff && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Fulfillment Status</label>
                          <div className="relative">
                            <select
                              value={order.fulfillmentStatus}
                              onChange={e => handleFulfillmentChange(e.target.value)}
                              className="w-full h-9 pl-3 pr-8 text-xs font-semibold text-slate-900 border border-slate-200 rounded-md bg-white appearance-none outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                            >
                              {Object.entries(fulfillmentStatusConfig).map(([val, cfg]) => (
                                <option key={val} value={val}>{cfg.label}</option>
                              ))}
                            </select>
                            <div className={`absolute right-3 top-3.5 h-2 w-2 rounded-full ${ff.dot}`} />
                          </div>
                        </div>
                      )}

                      {/* Return Status dropdown */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Return Status</label>
                        <div className="relative">
                          <select
                            value={order.returnStatus || "None"}
                            onChange={e => handleReturnStatusChange(e.target.value)}
                            className="w-full h-9 pl-3 pr-8 text-xs font-semibold text-slate-900 border border-slate-200 rounded-md bg-white appearance-none outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                          >
                            {["None", "Requested", "Approved", "Rejected", "Pickup Scheduled", "Picked Up", "Returned",
                              "QC Pending", "QC Passed", "QC Failed", "Refund Processing", "Refunded", "Closed"]
                              .map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                          <div className={`absolute right-3 top-3.5 h-2 w-2 rounded-full ${order.returnStatus === "Refunded" ? "bg-emerald-500" :
                            order.returnStatus === "Rejected" ? "bg-red-500" :
                              order.returnStatus === "None" ? "bg-slate-300" : "bg-amber-400"}`} />
                        </div>
                      </div>

                      {/* Approve / Reject */}
                      {order.fulfillmentStatus !== "Cancelled" && order.fulfillmentStatus !== "Completed" && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {/* Approve — only show when not already approved */}
                          <Button
                            onClick={handleApproveOrder}
                            disabled={updateMutation.isPending || (order.paymentStatus === "PAID" && order.fulfillmentStatus === "Confirmed")}
                            className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Approve
                          </Button>
                          <Button
                            onClick={handleRejectOrder}
                            disabled={updateMutation.isPending}
                            variant="outline"
                            className="h-10 text-xs font-bold text-red-600 border-red-200 bg-red-50 hover:bg-red-100 gap-1.5"
                          >
                            <XCircle className="h-4 w-4" /> Reject
                          </Button>
                        </div>
                      )}

                      {/* Process Refund */}
                      <Button variant="outline" className="w-full h-9 text-xs font-bold text-violet-600 border-violet-200 hover:bg-violet-50 gap-1.5">
                        <Banknote className="h-3.5 w-3.5" /> Process Refund
                      </Button>
                    </CardContent>
                  </Card>

                  {/* ── Payment Details ───────────────────────────────── */}
                  <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                      <Receipt className="h-4 w-4 text-slate-400" />
                      <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Payment Details</h2>
                    </div>
                    <CardContent className="p-5 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Method</p>
                            <p className="text-xs font-bold text-slate-700">{order.paymentMethod || "Razorpay"}</p>
                          </div>
                        </div>
                        {order.razorpayPaymentId && order.razorpayPaymentId !== "N/A" && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment ID</p>
                              <p className="text-[10px] font-mono font-semibold text-slate-600 truncate">{order.razorpayPaymentId}</p>
                            </div>
                            <Copy className="h-3 w-3 text-slate-300 cursor-pointer hover:text-slate-600 flex-shrink-0"
                              onClick={() => { navigator.clipboard.writeText(order.razorpayPaymentId); toast.success("Copied!") }} />
                          </div>
                        )}
                        {order.couponCode && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                            <Tag className="h-3.5 w-3.5 text-emerald-500" />
                            <div>
                              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Coupon</p>
                              <p className="text-xs font-bold text-emerald-700 font-mono">{order.couponCode}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Grand Total highlight */}
                      <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-1">Grand Total</p>
                        <p className="text-2xl font-black">{formatCurrency(order.financials.total)}</p>
                        <p className={`text-xs font-bold mt-1 ${order.paymentStatus === "PAID" ? "text-emerald-200" : "text-amber-200"}`}>
                          {order.paymentStatus === "PAID" ? "✓ Payment Received" : "⏳ Awaiting Payment"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ── Order Timeline ────────────────────────────────── */}
                  <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Order Timeline</h2>
                    </div>
                    <CardContent className="p-5">
                      <div className="space-y-0">
                        <TimelineStep
                          title="Order Placed"
                          subtitle={order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          done={true}
                        />
                        <TimelineStep
                          title="Payment Received"
                          subtitle={order.paymentStatus === "PAID" ? "Payment verified" : "Awaiting payment"}
                          done={order.paymentStatus === "PAID"}
                          current={order.paymentStatus !== "PAID"}
                        />
                        <TimelineStep
                          title="Order Confirmed"
                          subtitle="Order accepted and processing"
                          done={currentStep >= 1}
                          current={currentStep === 0 && order.paymentStatus === "PAID"}
                        />
                        <TimelineStep
                          title="Packed & Shipped"
                          subtitle={hasForward ? `AWB: ${forwardShipments[0]?.awb_code || "Pending"}` : "Awaiting dispatch"}
                          done={currentStep >= 4}
                          current={currentStep === 2 || currentStep === 3}
                        />
                        <TimelineStep
                          title="Delivered"
                          subtitle="Order delivered to customer"
                          done={currentStep >= 5}
                          current={currentStep === 4}
                        />
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </div>
            )}
          </div>

          {/* ── Bottom Bar ───────────────────────────────────────────────── */}
          {order && (
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between sticky bottom-0 z-10">
              <div className="flex gap-2">
                <Button variant="outline" className="text-xs font-bold text-slate-600 border-slate-200 h-8 gap-1.5">
                  <Printer className="h-3.5 w-3.5" /> Print Invoice
                </Button>
                <Button variant="outline" className="text-xs font-bold text-slate-600 border-slate-200 h-8 gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
              </div>
              {order.fulfillmentStatus !== "Cancelled" && (
                <button onClick={() => setIsCancelOpen(true)}
                  className="text-xs font-bold text-red-500 hover:underline cursor-pointer">
                  Cancel Order
                </button>
              )}
            </div>
          )}
        </div>
      </SidebarInset>

      {/* ── Cancel Order Dialog ───────────────────────────────────────────── */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white border border-slate-200 text-slate-900 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Cancel / Reject Order
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium mt-1">
              This will mark the order as cancelled. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-xs font-bold text-slate-600 block mb-2">Reason</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="e.g. Customer request, Out of stock, Fraudulent order…"
              className="w-full h-24 p-3 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-red-300 focus:border-red-400 resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}
              className="text-xs font-bold border-slate-200 text-slate-600">
              Close
            </Button>
            <Button onClick={handleCancelOrder} disabled={updateMutation.isPending}
              className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5">
              <XCircle className="h-3.5 w-3.5" /> Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
