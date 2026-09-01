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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Truck,
  Package,
  Search,
  Plus,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Activity,
  CheckCircle2,
  XCircle,
  FileDown,
  ExternalLink,
  Loader2,
  X
} from "lucide-react"
import React, { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { toast } from "sonner"

interface CreateShipmentFormValues {
  orderId: string
  warehouseId: string
  courierName: string
  courierId: string
  weight: string
  length: string
  breadth: string
  height: string
  remarks: string
}

const defaultShipmentValues: CreateShipmentFormValues = {
  orderId: "",
  warehouseId: "",
  courierName: "",
  courierId: "",
  weight: "",
  length: "",
  breadth: "",
  height: "",
  remarks: ""
}

export default function ShipmentsPage() {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateShipmentFormValues>({
    defaultValues: defaultShipmentValues
  })

  const selectedOrderId = watch("orderId")
  const selectedCourierName = watch("courierName")

  const [courierSearchQuery, setCourierSearchQuery] = useState("")
  const [isCourierDropdownOpen, setIsCourierDropdownOpen] = useState(false)

  useEffect(() => {
    if (!isCreateModalOpen) {
      setCourierSearchQuery("")
      setIsCourierDropdownOpen(false)
    }
  }, [isCreateModalOpen])

  // Fetch Shipments with filters
  const { data: shipmentsData, isLoading, refetch } = useQuery({
    queryKey: ["shipments", currentPage, statusFilter, typeFilter, searchQuery],
    queryFn: async () => {
      let url = `/api/shipments?page=${currentPage}&limit=${limit}`
      if (statusFilter !== "all") url += `&status=${encodeURIComponent(statusFilter)}`
      if (typeFilter !== "all") url += `&type=${encodeURIComponent(typeFilter)}`
      if (searchQuery.trim()) url += `&q=${encodeURIComponent(searchQuery)}`

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch shipments")
      return res.json()
    },
    placeholderData: (prev) => prev,
    staleTime: 5000
  })

  const shipmentsList = shipmentsData?.shipments || []
  const totalCount = shipmentsData?.totalCount || 0

  // Fetch active orders (for creation modal drop-down)
  const { data: ordersData } = useQuery({
    queryKey: ["ordersForShipments"],
    queryFn: async () => {
      const res = await fetch("/api/orders?limit=100")
      if (!res.ok) throw new Error("Failed to fetch orders")
      return res.json()
    },
    enabled: isCreateModalOpen
  })
  const allOrdersList = ordersData?.orders || []

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ["warehousesList"],
    queryFn: async () => {
      const res = await fetch("/api/settings/warehouses")
      if (!res.ok) throw new Error("Failed to fetch warehouses")
      return res.json()
    },
    enabled: isCreateModalOpen
  })
  const warehousesList = warehousesData?.warehouses || []

  // Extract selected order and warehouse pincodes
  const selectedOrderObj = useMemo(() => {
    return allOrdersList.find((o: any) => o.id === selectedOrderId)
  }, [allOrdersList, selectedOrderId])

  const selectedWarehouseObj = useMemo(() => {
    return warehousesList.find((w: any) => String(w.id) === String(watch("warehouseId")))
  }, [warehousesList, watch("warehouseId")])

  const deliveryPincode = selectedOrderObj?.address?.pincode || ""
  const pickupPincode = selectedWarehouseObj?.pincode || ""
  const pkgWeight = watch("weight") || "0.5"

  // Query Shiprocket Pincode Serviceability (triggered when order and warehouse are selected)
  const { data: serviceabilityResponse, isLoading: loadingServiceability } = useQuery({
    queryKey: ["serviceability", pickupPincode, deliveryPincode, pkgWeight],
    queryFn: async () => {
      if (!pickupPincode || !deliveryPincode) return null
      const res = await fetch(`/api/shipments/serviceability?pickup_postcode=${encodeURIComponent(pickupPincode)}&delivery_postcode=${encodeURIComponent(deliveryPincode)}&weight=${encodeURIComponent(pkgWeight)}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to check serviceability")
      }
      return res.json()
    },
    enabled: Boolean(isCreateModalOpen && pickupPincode && deliveryPincode)
  })

  // Extract available couriers from serviceability response
  const serviceabilityCouriers = useMemo(() => {
    const list = serviceabilityResponse?.data?.data?.available_courier_companies || []
    return list.filter((c: any) => c.blocked === 0)
  }, [serviceabilityResponse])

  const filteredCouriers = useMemo(() => {
    if (!courierSearchQuery.trim()) return serviceabilityCouriers
    const q = courierSearchQuery.toLowerCase()
    return serviceabilityCouriers.filter((c: any) => {
      const name = (c.courier_name || c.name || "").toLowerCase()
      return name.includes(q)
    })
  }, [courierSearchQuery, serviceabilityCouriers])

  // Determine orders that don't have shipment entries yet
  const availableOrders = useMemo(() => {
    return allOrdersList.filter((ord: any) => {
      const isAlreadyShipped = shipmentsList.some((s: any) => s.orderId === ord.id)
      return !isAlreadyShipped && ord.fulfillmentStatus !== "Cancelled"
    })
  }, [allOrdersList, shipmentsList])

  // Mutation for creating shipment
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to create shipment")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Shipment created successfully!")
      setIsCreateModalOpen(false)
      reset(defaultShipmentValues)
      setCourierSearchQuery("")
      setIsCourierDropdownOpen(false)
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const onSubmitCreateShipment = (data: CreateShipmentFormValues) => {
    if (!data.orderId) {
      toast.error("Please select an Order")
      return
    }
    if (!data.courierName) {
      toast.error("Please select a Courier Partner")
      return
    }
    createMutation.mutate({
      orderId: data.orderId,
      warehouseId: data.warehouseId || null,
      courierName: data.courierName || null,
      courierId: data.courierId || null,
      weight: data.weight || null,
      length: data.length || null,
      breadth: data.breadth || null,
      height: data.height || null,
      remarks: data.remarks || null
    })
  }

  // Helper styles for Shipment Status
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Pending':
      case 'Pickup Requested':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
      case 'Ready To Ship':
      case 'AWB Generated':
      case 'Pickup Scheduled':
      case 'Scheduled':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' }
      case 'Picked Up':
      case 'In Transit':
      case 'Reached Destination Hub':
      case 'Out For Delivery':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' }
      case 'Delivered':
      case 'Delivered to Warehouse':
      case 'Returned To Warehouse':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' }
      case 'Cancelled':
        return { bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' }
      case 'RTO':
      case 'Failed':
      case 'Lost':
      case 'Damaged':
      default:
        return { bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' }
    }
  }

  // Reset filters
  const handleClearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setTypeFilter("all")
    setCurrentPage(1)
  }

  // Pre-calculate list limits
  const totalPages = Math.ceil(totalCount / limit)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb]">
        <SiteHeader />
        <div className="flex flex-1 flex-col p-8 pt-6">

          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-slate-500 mb-4 font-medium">
            <span className="hover:text-slate-900 cursor-pointer">Sales</span>
            <span className="mx-2">{'>'}</span>
            <span className="font-semibold text-slate-900">Shipments</span>
          </div>

          {/* Heading */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] flex items-center gap-2">
                <Truck className="h-7 w-7 text-black" />
                Package Shipments
              </h1>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                Track, dispatch, and manage forward/return courier shipments.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
              >
                <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Sync Status
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs font-bold bg-black text-white hover:bg-black/90 shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Shipment
              </Button>
            </div>
          </div>

          {/* Top Level Metric Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-slate-50 text-slate-700">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Shipments</p>
                  <p className="text-xl font-bold text-slate-900">{totalCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Transit</p>
                  <p className="text-xl font-bold text-slate-900">
                    {shipmentsList.filter((s: any) => s.shipmentStatus === 'In Transit').length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Out for Delivery</p>
                  <p className="text-xl font-bold text-slate-900">
                    {shipmentsList.filter((s: any) => s.shipmentStatus === 'Out For Delivery').length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivered</p>
                  <p className="text-xl font-bold text-slate-900">
                    {shipmentsList.filter((s: any) => s.shipmentStatus === 'Delivered').length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters card */}
          <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white mb-6">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search query */}
                <div className="relative w-full sm:w-64">
                  <Search className="h-4 w-4 text-slate-400 absolute left-2.5 top-3" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="AWB or Tracking Number..."
                    className="pl-8 text-xs border-slate-200 bg-slate-50/50 !text-black h-9"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg h-9">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
                  <Select value={statusFilter} onValueChange={(val: any) => { setStatusFilter(val); setCurrentPage(1); }}>
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-[11px] gap-1">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-md">
                      <SelectItem value="all" className="text-xs font-semibold">All Statuses</SelectItem>
                      <SelectItem value="Pending" className="text-xs font-semibold">Pending</SelectItem>
                      <SelectItem value="Ready To Ship" className="text-xs font-semibold">Ready to Ship</SelectItem>
                      <SelectItem value="AWB Generated" className="text-xs font-semibold">AWB Generated</SelectItem>
                      <SelectItem value="In Transit" className="text-xs font-semibold">In Transit</SelectItem>
                      <SelectItem value="Out For Delivery" className="text-xs font-semibold">Out for Delivery</SelectItem>
                      <SelectItem value="Delivered" className="text-xs font-semibold">Delivered</SelectItem>
                      <SelectItem value="Delivered to Warehouse" className="text-xs font-semibold">Delivered to WH</SelectItem>
                      <SelectItem value="Cancelled" className="text-xs font-semibold">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg h-9">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Type:</span>
                  <Select value={typeFilter} onValueChange={(val: any) => { setTypeFilter(val); setCurrentPage(1); }}>
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-[11px] gap-1">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-md">
                      <SelectItem value="all" className="text-xs font-semibold">All Types</SelectItem>
                      <SelectItem value="Forward" className="text-xs font-semibold">Forward</SelectItem>
                      <SelectItem value="Reverse" className="text-xs font-semibold">Reverse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
                <Button
                  onClick={handleClearFilters}
                  variant="ghost"
                  className="text-xs font-bold text-red-600 hover:text-red-700 self-end md:self-auto h-9"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Table list */}
          <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white overflow-hidden">
            {isLoading ? (
              <div className="py-24 text-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-500">Loading shipments information...</p>
              </div>
            ) : shipmentsList.length === 0 ? (
              <div className="py-24 text-center">
                <Truck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-400">No shipments found matching filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-b border-slate-100">
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Shipment ID</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Order ID</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Customer</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Direction</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Courier & AWB</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Status</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4">Created Date</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipmentsList.map((shp: any) => {
                      const isForward = shp.shipmentType === 'Forward'
                      const activeStatus = isForward ? shp.shipmentStatus : shp.pickupStatus
                      const activeColors = getStatusStyles(activeStatus)

                      return (
                        <TableRow key={shp.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                          {/* Shipment ID */}
                          <TableCell className="py-3.5 font-bold text-xs text-slate-900">
                            SHP-{shp.id}
                          </TableCell>

                          {/* Order ID Link */}
                          <TableCell className="py-3.5">
                            <Link
                              href={`/orders/${shp.orderId}`}
                              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {shp.displayOrderId}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </TableCell>

                          {/* Customer */}
                          <TableCell className="py-3.5">
                            <p className="text-xs font-bold text-slate-900">{shp.customerName}</p>
                            <p className="text-[10px] text-slate-400">{shp.customerEmail}</p>
                          </TableCell>

                          {/* Direction (Forward or Reverse) */}
                          <TableCell className="py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                              shp.shipmentType === 'Forward' 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                              {shp.shipmentType}
                            </span>
                          </TableCell>

                          {/* Courier & AWB */}
                          <TableCell className="py-3.5">
                            <p className="text-xs font-bold text-slate-900">{shp.courierName || 'Unassigned'}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{shp.awbCode || shp.trackingNumber || 'No AWB Code'}</p>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${activeColors.bg}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${activeColors.dot}`} />
                              {activeStatus}
                            </span>
                          </TableCell>

                          {/* Date */}
                          <TableCell className="py-3.5 text-xs text-slate-600 font-medium">
                            {shp.date}
                          </TableCell>

                          {/* Action Button */}
                          <TableCell className="py-3.5 text-right">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-bold border-slate-200 hover:bg-slate-50"
                            >
                              <Link href={`/shipments/${shp.id}`}>
                                View Track
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination footer */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500">
                  Showing shipments {currentPage * limit - limit + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-bold border-slate-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-bold border-slate-200"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Create Shipment Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Create Package Shipment
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Order selection */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Select Order <span className="text-red-500">*</span>
                  </label>
                  {availableOrders.length === 0 ? (
                    <div className="h-10 px-3 flex items-center text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
                      No active orders require shipments
                    </div>
                  ) : (
                    <Select
                      value={selectedOrderId}
                      onValueChange={(val) => setValue("orderId", val)}
                    >
                      <SelectTrigger className="w-full h-10 text-xs font-semibold text-slate-900 border-slate-200 bg-white shadow-sm">
                        <SelectValue placeholder="Choose an order..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg max-h-60">
                        {availableOrders.map((ord: any) => (
                          <SelectItem key={ord.id} value={ord.id} className="text-xs font-medium">
                            #ORD-{ord.id.slice(0, 8).toUpperCase()} - {ord.address?.recipientName || 'Customer'} ({ord.address?.city || 'N/A'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Warehouse selection */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Source Warehouse
                  </label>
                  {warehousesList.length === 0 ? (
                    <div className="h-10 px-3 flex items-center text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-md">
                      No warehouses defined
                    </div>
                  ) : (
                    <Select
                      value={watch("warehouseId")}
                      onValueChange={(val) => setValue("warehouseId", val)}
                    >
                      <SelectTrigger className="w-full h-10 text-xs font-semibold text-slate-900 border-slate-200 bg-white shadow-sm">
                        <SelectValue placeholder="Select dispatch warehouse..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg max-h-60">
                        {warehousesList.map((wh: any) => (
                          <SelectItem key={wh.id} value={String(wh.id)} className="text-xs font-medium">
                            {wh.name} ({wh.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Courier Partner Selection with Search */}
              <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4">
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Courier Partner <span className="text-red-500">*</span>
                    </label>
                    {pickupPincode && deliveryPincode && serviceabilityResponse && (
                      <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        Route: {pickupPincode} → {deliveryPincode} ({serviceabilityCouriers.length} available)
                      </div>
                    )}
                  </div>

                  {!selectedOrderId || !watch("warehouseId") ? (
                    <div className="h-10 px-3 flex items-center text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-md">
                      Please select an Order and Source Warehouse first to check courier serviceability
                    </div>
                  ) : loadingServiceability ? (
                    <div className="h-10 px-3 flex items-center text-xs font-semibold text-blue-600 bg-blue-50/50 border border-blue-200 rounded-md">
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Checking courier serviceability for route ({pickupPincode} → {deliveryPincode})...
                    </div>
                  ) : serviceabilityCouriers.length === 0 ? (
                    <div className="h-10 px-3 flex items-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
                      No courier partners available for route ({pickupPincode} → {deliveryPincode})
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <Input
                          value={courierSearchQuery}
                          onChange={(e) => {
                            setCourierSearchQuery(e.target.value)
                            setIsCourierDropdownOpen(true)
                          }}
                          onFocus={() => setIsCourierDropdownOpen(true)}
                          placeholder="Type to search courier partner..."
                          className="pl-9 pr-8 text-xs border-slate-200 bg-white text-slate-900 h-10 shadow-sm"
                        />
                        {courierSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setCourierSearchQuery("")
                              setValue("courierName", "")
                              setValue("courierId", "")
                              setIsCourierDropdownOpen(true)
                            }}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Options */}
                      {isCourierDropdownOpen && (
                        <div className="absolute left-0 right-0 top-11 z-50 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl py-1 divide-y divide-slate-100">
                          {filteredCouriers.length === 0 ? (
                            <p className="px-3 py-3 text-xs font-semibold text-slate-400 text-center">
                              No courier partners match "{courierSearchQuery}"
                            </p>
                          ) : (
                            filteredCouriers.map((c: any) => {
                              const info = {
                                name: c.courier_name || c.name || "Courier Partner",
                                id: c.courier_company_id || c.id,
                                rate: c.rate !== undefined ? c.rate : c.freight_charge,
                                edd: c.estimated_delivery_days,
                                rating: c.rating,
                                isSurface: c.is_surface
                              }
                              const isSelected = selectedCourierName === info.name
                              return (
                                <div
                                  key={info.id}
                                  onClick={() => {
                                    setValue("courierName", info.name)
                                    setValue("courierId", String(info.id))
                                    setCourierSearchQuery(info.name)
                                    setIsCourierDropdownOpen(false)
                                  }}
                                  className={`px-3 py-2.5 text-xs font-semibold cursor-pointer flex items-center justify-between hover:bg-blue-50/60 hover:text-blue-700 transition-colors ${
                                    isSelected ? "bg-blue-50/80 text-blue-700 font-bold" : "text-slate-700"
                                  }`}
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <span className="flex items-center gap-2 text-slate-900 font-bold">
                                      <Truck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                      {info.name}
                                    </span>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                      {info.edd && <span>Est: {info.edd} days</span>}
                                      {info.rating && <span className="text-amber-600 font-bold">★ {info.rating}</span>}
                                      {info.isSurface !== undefined && (
                                        <Badge variant="outline" className="text-[8px] py-0 px-1 font-bold bg-slate-50 text-slate-600 border-slate-200">
                                          {info.isSurface ? "Surface" : "Air"}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {info.rate !== undefined && info.rate !== "" && (
                                      <span className="text-xs font-extrabold text-emerald-700 block">
                                        ₹{info.rate}
                                      </span>
                                    )}
                                    <span className="text-[9px] font-mono text-slate-400">ID: {info.id}</span>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Package Metrics & Dimensions
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/55 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Weight (kg)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("weight")}
                      placeholder="0.50"
                      className="h-8 text-xs border-slate-200 !text-black bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Length (cm)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      {...register("length")}
                      placeholder="15"
                      className="h-8 text-xs border-slate-200 !text-black bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Breadth (cm)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      {...register("breadth")}
                      placeholder="10"
                      className="h-8 text-xs border-slate-200 !text-black bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Height (cm)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      {...register("height")}
                      placeholder="12"
                      className="h-8 text-xs border-slate-200 !text-black bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Remarks / Notes
                </label>
                <textarea
                  {...register("remarks")}
                  placeholder="Internal dispatch notes..."
                  className="w-full h-16 p-3 text-xs font-semibold text-slate-700 bg-slate-50/50 border border-slate-200 rounded-md outline-none resize-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
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
                disabled={!selectedOrderId || !selectedCourierName || createMutation.isPending}
                onClick={handleSubmit(onSubmitCreateShipment)}
                className="text-xs font-bold bg-black text-white hover:bg-black/90"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Dispatching...
                  </>
                ) : (
                  "Confirm Shipment"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
