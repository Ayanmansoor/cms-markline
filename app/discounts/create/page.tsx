"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClockIcon, CheckCircle2Icon, PercentIcon, CircleDollarSignIcon, TagIcon, UsersIcon } from "lucide-react"
import React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"

interface DiscountFormValues {
  name: string
  code: string
  description: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: string
  minPurchase: string
  minQuantity: string
  isMinimumRequirement: boolean
  isRestricted: boolean
  selectedUserId: string
  startDate: string
  endDate: string
  noEndDate: boolean
  limitTotal: boolean
  maxUses: string
  limitPerCustomer: boolean
}

const getNowString = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const defaultFormValues: DiscountFormValues = {
  name: "",
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "20",
  minPurchase: "150",
  minQuantity: "1",
  isMinimumRequirement: false,
  isRestricted: false,
  selectedUserId: "",
  startDate: getNowString(),
  endDate: "",
  noEndDate: true,
  limitTotal: true,
  maxUses: "1000",
  limitPerCustomer: true,
}

export default function CreateDiscountPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { register, watch, setValue, getValues, control } = useForm<DiscountFormValues>({
    defaultValues: defaultFormValues,
  })

  const name = watch("name")
  const discountType = watch("discountType")
  const discountValue = watch("discountValue")
  const isMinimumRequirement = watch("isMinimumRequirement")
  const minPurchase = watch("minPurchase")
  const isRestricted = watch("isRestricted")
  const selectedUserId = watch("selectedUserId")
  const startDate = watch("startDate")
  const endDate = watch("endDate")
  const noEndDate = watch("noEndDate")
  const limitTotal = watch("limitTotal")
  const maxUses = watch("maxUses")
  const limitPerCustomer = watch("limitPerCustomer")

  const { data: customersData } = useQuery({
    queryKey: ["customers-list-raw"],
    queryFn: async () => {
      const res = await fetch("/api/customers?limit=100")
      if (!res.ok) throw new Error("Failed to fetch customers")
      return res.json()
    }
  })
  const customersList = customersData?.customers || []

  const parsedVal = parseFloat(discountValue) || 0
  const subtotal = 240.00
  const discountApplied = discountType === "PERCENTAGE" 
    ? (subtotal * parsedVal / 100) 
    : parsedVal
  const total = Math.max(0, subtotal - discountApplied)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Ongoing"
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    } catch {
      return "Ongoing"
    }
  }

  const createDiscountMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create discount")
      return data
    },
    onSuccess: () => {
      toast.success("Discount created successfully!")
      queryClient.invalidateQueries({ queryKey: ["discounts"] })
      router.push("/discounts")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save discount")
    }
  })

  const handleSave = () => {
    const v = getValues()
    if (!v.name.trim()) {
      toast.error("Discount name is required!")
      return
    }
    const val = parseFloat(v.discountValue)
    if (isNaN(val) || val < 0) {
      toast.error("Discount value must be a valid non-negative number!")
      return
    }

    const payload = {
      name: v.name.trim(),
      code: v.code.trim() || null,
      inPercent: v.discountType === "PERCENTAGE",
      discount_persent: val,
      discount_start: v.startDate ? v.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
      discount_end: v.noEndDate || !v.endDate ? null : v.endDate.split("T")[0],
      isMinimumRequirement: v.isMinimumRequirement,
      purchase_amount: v.isMinimumRequirement ? (parseFloat(v.minPurchase) || 0) : null,
      quantity: v.isMinimumRequirement ? (parseInt(v.minQuantity) || 0) : null,
      user: v.isRestricted && v.selectedUserId ? v.selectedUserId : null,
      limit_per_customer: v.limitPerCustomer
    }

    createDiscountMutation.mutate(payload)
  }

  const isPending = createDiscountMutation.isPending

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-8">

          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center text-xs text-slate-500 mb-1">
                <span className="hover:text-slate-900 cursor-pointer" onClick={() => router.push("/discounts")}>Discounts</span>
                <span className="mx-1">{'>'}</span>
                <span className="font-bold text-slate-900">Create Discount</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Create Discount</h1>
            </div>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => router.push("/discounts")}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Discount"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

            {/* Left Column - Form Sections */}
            <div className="space-y-6">

              {/* General Information */}
              <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 pt-3 pb-3 px-6">
                  <CardTitle className="text-sm font-bold text-slate-900">General Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Discount Name</Label>
                    <Input 
                      {...register("name")}
                      className="h-10 text-sm font-semibold border-slate-200 !text-black placeholder:text-slate-400" 
                      placeholder="e.g. Seasonal Spring Discount" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Internal Code</Label>
                      <Input 
                        {...register("code")}
                        className="h-10 text-sm font-semibold border-slate-200 !text-black placeholder:text-slate-400" 
                        placeholder="e.g. SPRING20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Description (Internal)</Label>
                      <Input 
                        {...register("description")}
                        className="h-10 text-sm font-semibold border-slate-200 !text-black placeholder:text-slate-400" 
                        placeholder="Short context of campaign" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Value */}
              <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 pt-3 pb-3 px-6">
                  <CardTitle className="text-sm font-bold text-slate-900">Value</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-[200px_1fr] gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 block mb-1">Discount Type</Label>
                      <div className="space-y-2">
                        <div 
                          onClick={() => setValue("discountType", "PERCENTAGE")}
                          className={`flex items-center gap-3 p-3 border-2 rounded-md cursor-pointer transition-all ${
                            discountType === "PERCENTAGE" 
                              ? "border-blue-500 bg-blue-50/30" 
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border bg-white flex items-center justify-center ${
                            discountType === "PERCENTAGE" ? "border-blue-600 border-4" : "border-slate-300"
                          }`}></div>
                          <span className={`text-sm font-bold ${discountType === "PERCENTAGE" ? "text-blue-900" : "text-slate-700"}`}>Percentage</span>
                        </div>
                        <div 
                          onClick={() => setValue("discountType", "FIXED_AMOUNT")}
                          className={`flex items-center gap-3 p-3 border-2 rounded-md cursor-pointer transition-all ${
                            discountType === "FIXED_AMOUNT" 
                              ? "border-blue-500 bg-blue-50/30" 
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border bg-white flex items-center justify-center ${
                            discountType === "FIXED_AMOUNT" ? "border-blue-600 border-4" : "border-slate-300"
                          }`}></div>
                          <span className={`text-sm font-bold ${discountType === "FIXED_AMOUNT" ? "text-blue-900" : "text-slate-700"}`}>Fixed Amount</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700 block mb-2">Discount Value</Label>
                      <div className="relative">
                        <Input 
                          {...register("discountValue")}
                          className="h-10 text-sm font-semibold border-slate-200 pr-8 !text-black" 
                          placeholder="0" 
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          {discountType === "PERCENTAGE" ? "%" : "₹"}
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-3">
                        Customers will receive {discountType === "PERCENTAGE" ? `${parsedVal}%` : `₹${parsedVal}`} off all items in their cart.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Minimum Requirements */}
              <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 pt-3 pb-3 px-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900">Minimum Requirements</CardTitle>
                  <Controller
                    name="isMinimumRequirement"
                    control={control}
                    render={({ field }) => (
                      <Switch 
                        id="min-requirements" 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="!border-slate-400 !border data-[state=unchecked]:!bg-slate-500 data-[state=checked]:!bg-blue-600 shadow-sm"
                      />
                    )}
                  />
                </CardHeader>
                <CardContent className={`p-6 transition-all duration-300 ${!isMinimumRequirement ? 'opacity-40' : ''}`}>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Min. Purchase Amount (₹)</Label>
                      <Input 
                        disabled={!isMinimumRequirement}
                        {...register("minPurchase")}
                        className="h-10 text-sm font-semibold border-slate-200 !text-black disabled:bg-slate-50 disabled:text-slate-400" 
                        placeholder="Ex: 1000" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Min. Quantity of items</Label>
                      <Input 
                        disabled={!isMinimumRequirement}
                        {...register("minQuantity")}
                        className="h-10 text-sm font-semibold border-slate-200 !text-black disabled:bg-slate-50 disabled:text-slate-400" 
                        placeholder="Ex: 1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Restriction */}
              <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 pt-3 pb-3 px-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900">Customer Restriction</CardTitle>
                  <Controller
                    name="isRestricted"
                    control={control}
                    render={({ field }) => (
                      <Switch 
                        id="restrict-customer" 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="!border-slate-400 !border data-[state=unchecked]:!bg-slate-500 data-[state=checked]:!bg-blue-600 shadow-sm"
                      />
                    )}
                  />
                </CardHeader>
                <CardContent className={`p-6 transition-all duration-300 ${!isRestricted ? 'opacity-40' : ''}`}>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Assign to Specific Customer</Label>
                    <Controller
                      name="selectedUserId"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          disabled={!isRestricted} 
                          value={field.value || ""} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full border-slate-200 text-slate-900 text-xs font-semibold">
                            <SelectValue placeholder="Select a customer..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200 text-slate-900 max-h-48 overflow-y-auto shadow-md">
                            {customersList.map((c: any) => (
                              <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                                {c.name || c.email} ({c.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <p className="text-[11px] font-medium text-slate-500 mt-2">
                      If enabled, only the assigned customer will be allowed to use this discount code at checkout.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 pt-3 pb-3 px-6">
                  <CardTitle className="text-sm font-bold text-slate-900">Schedule</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Start Date & Time</Label>
                      <div className="relative">
                        <Input 
                          type="datetime-local" 
                          {...register("startDate")}
                          className="h-10 text-sm font-semibold border-slate-200 !text-black" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">End Date & Time</Label>
                      <div className="relative">
                        <Input 
                          type="datetime-local" 
                          {...register("endDate")}
                          disabled={noEndDate}
                          className="h-10 text-sm font-semibold border-slate-200 !text-black disabled:opacity-50" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Controller
                      name="noEndDate"
                      control={control}
                      render={({ field }) => (
                        <Switch 
                          id="no-end-date" 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="!border-slate-400 !border data-[state=unchecked]:!bg-slate-500 data-[state=checked]:!bg-blue-600 shadow-sm" 
                        />
                      )}
                    />
                    <Label htmlFor="no-end-date" className="text-xs font-semibold text-slate-700 cursor-pointer">No end date</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Limits */}
              <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 pt-3 pb-3 px-6">
                  <CardTitle className="text-sm font-bold text-slate-900">Usage Limits</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Controller
                        name="limitTotal"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            id="limit-total" 
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            className="rounded text-blue-600 border-slate-300" 
                          />
                        )}
                      />
                      <Label htmlFor="limit-total" className="text-sm font-bold text-slate-700 cursor-pointer">Limit total number of uses</Label>
                    </div>
                    {limitTotal && (
                      <div className="pl-6 w-32">
                        <Input 
                          {...register("maxUses")}
                          className="h-9 text-sm font-semibold border-slate-200 !text-black" 
                          placeholder="e.g. 1000" 
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Controller
                      name="limitPerCustomer"
                      control={control}
                      render={({ field }) => (
                        <Checkbox 
                          id="limit-per-customer" 
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                          className="rounded text-blue-600 border-slate-300" 
                        />
                      )}
                    />
                    <Label htmlFor="limit-per-customer" className="text-sm font-bold text-slate-700 cursor-pointer">Limit to one use per customer</Label>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Column - Sidebar Widgets */}
            <div className="space-y-6">

              {/* Storefront Preview */}
              <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                <div className="bg-black text-white px-5 py-3">
                  <h3 className="text-sm font-bold text-center">Storefront Preview</h3>
                </div>
                <CardContent className="p-0">
                  <div className="p-5 border-b border-slate-100 flex justify-center">
                    <div className="w-full aspect-square max-w-[220px] bg-gradient-to-b from-slate-800 to-black rounded-lg flex flex-col items-center justify-center text-white shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                      <h2 className="text-4xl font-black mb-1 z-10 drop-shadow-md">
                        {discountType === "PERCENTAGE" ? `-${parsedVal}%` : `-₹${parsedVal}`}
                      </h2>
                      <p className="text-[10px] font-bold tracking-widest uppercase z-10 drop-shadow-md px-4 text-center">
                        {name || "ACTIVE PROMOTIONAL DISCOUNT"}
                      </p>
                      <div className="w-24 h-8 mt-4 bg-white/20 rounded-full blur-xl absolute bottom-10 z-0"></div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 mt-3 text-white/80 z-10 drop-shadow-md">
                        <path d="M19 12l-2-2-5 3-4-2c-1.7 0-3 1.3-3 3v1h14l4-3z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                      <span>Cart Subtotal</span>
                      <span className="text-slate-900">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-blue-600">
                      <span>Discount Applied</span>
                      <span>-₹{discountApplied.toFixed(2)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-lg font-black text-slate-900">Total</span>
                      <span className="text-lg font-black text-slate-900">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="px-5 pb-5 text-center">
                    <p className="text-[11px] italic font-medium text-slate-500">
                      "This discount will be automatically applied at checkout to eligible orders."
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                <CardContent className="p-5">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <CheckCircle2Icon className="w-4 h-4 text-slate-400" /> Summary
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-[11px] font-semibold text-slate-600">
                      <ClockIcon className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span>Active from {formatDate(startDate)}</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[11px] font-semibold text-slate-600">
                      <PercentIcon className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span>{discountType === "PERCENTAGE" ? `${parsedVal}%` : `₹${parsedVal}`} off all products</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[11px] font-semibold text-slate-600">
                      <CircleDollarSignIcon className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span>{isMinimumRequirement ? `Minimum purchase of ₹${parseFloat(minPurchase) || 0}` : "No minimum purchase requirement"}</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[11px] font-semibold text-slate-600">
                      <TagIcon className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span>{limitTotal ? `Limited to ${maxUses} total uses` : "Unlimited total uses"}</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[11px] font-semibold text-slate-600">
                      <UsersIcon className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span>
                        {isRestricted && selectedUserId 
                          ? `Restricted to customer: ${customersList.find((c: any) => c.id === selectedUserId)?.name || selectedUserId}` 
                          : "Available to all customers"}
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
