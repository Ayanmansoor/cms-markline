"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClockIcon, CheckCircle2Icon, PercentIcon, CircleDollarSignIcon, TagIcon, Sparkles } from "lucide-react"
import React, { useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useRouter, useParams } from "next/navigation"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"

interface CouponFormValues {
  code: string
  title: string
  description: string
  discountType: "Percentage" | "Fixed" | "Free Shipping"
  discountValue: string
  minimumOrderAmount: string
  maximumDiscountAmount: string
  usageLimit: string
  perUserLimit: string
  startsAt: string
  expiresAt: string
  isActive: boolean
  noExpiry: boolean
}

const getNowString = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const defaultFormValues: CouponFormValues = {
  code: "",
  title: "",
  description: "",
  discountType: "Percentage",
  discountValue: "",
  minimumOrderAmount: "0",
  maximumDiscountAmount: "",
  usageLimit: "",
  perUserLimit: "1",
  startsAt: getNowString(),
  expiresAt: "",
  isActive: true,
  noExpiry: true,
}

export default function EditCouponPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const queryClient = useQueryClient()

  const { register, watch, setValue, reset, getValues, control } = useForm<CouponFormValues>({
    defaultValues: defaultFormValues,
  })

  // Fetch current coupon data
  const { data: couponResponse, isLoading: isCouponLoading } = useQuery({
    queryKey: ["coupon", id],
    queryFn: async () => {
      const res = await fetch(`/api/coupon/${id}`)
      if (!res.ok) throw new Error("Failed to fetch coupon details")
      return res.json()
    },
    enabled: !!id
  })

  useEffect(() => {
    if (couponResponse?.success && couponResponse.coupon) {
      const c = couponResponse.coupon
      
      const formatDateTimeLocal = (isoString: string | null) => {
        if (!isoString) return ""
        try {
          const d = new Date(isoString)
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
          return d.toISOString().slice(0, 16)
        } catch {
          return ""
        }
      }

      reset({
        code: c.code || "",
        title: c.title || "",
        description: c.description || "",
        discountType: c.discount_type || "Percentage",
        discountValue: c.discount_value !== null ? String(c.discount_value) : "",
        minimumOrderAmount: c.minimum_order_amount !== null ? String(c.minimum_order_amount) : "0",
        maximumDiscountAmount: c.maximum_discount_amount !== null ? String(c.maximum_discount_amount) : "",
        usageLimit: c.usage_limit !== null ? String(c.usage_limit) : "",
        perUserLimit: c.per_user_limit !== null ? String(c.per_user_limit) : "1",
        startsAt: formatDateTimeLocal(c.starts_at),
        expiresAt: formatDateTimeLocal(c.expires_at),
        isActive: !!c.is_active,
        noExpiry: !c.expires_at,
      })
    }
  }, [couponResponse, reset])

  const code = watch("code")
  const title = watch("title")
  const description = watch("description")
  const discountType = watch("discountType")
  const discountValue = watch("discountValue")
  const minimumOrderAmount = watch("minimumOrderAmount")
  const maximumDiscountAmount = watch("maximumDiscountAmount")
  const startsAt = watch("startsAt")
  const expiresAt = watch("expiresAt")
  const noExpiry = watch("noExpiry")
  const usageLimit = watch("usageLimit")
  const perUserLimit = watch("perUserLimit")
  const isActive = watch("isActive")

  const parsedVal = parseFloat(discountValue) || 0
  const minOrder = parseFloat(minimumOrderAmount) || 0
  const maxDiscount = parseFloat(maximumDiscountAmount) || 0

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

  const updateCouponMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/coupon/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update coupon")
      return data
    },
    onSuccess: () => {
      toast.success("Coupon updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["coupons"] })
      queryClient.invalidateQueries({ queryKey: ["coupon", id] })
      router.push("/coupon")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update coupon")
    }
  })

  const handleSave = () => {
    const v = getValues()
    if (!v.code.trim()) {
      toast.error("Coupon Code is required!")
      return
    }
    if (!v.title.trim()) {
      toast.error("Coupon Title is required!")
      return
    }

    const val = parseFloat(v.discountValue)
    if (v.discountType !== "Free Shipping" && (isNaN(val) || val <= 0)) {
      toast.error("Discount value must be a valid positive number!")
      return
    }

    const payload = {
      code: v.code.trim().toUpperCase(),
      title: v.title.trim(),
      description: v.description.trim() || null,
      discount_type: v.discountType,
      discount_value: v.discountType === "Free Shipping" ? 0 : val,
      minimum_order_amount: parseFloat(v.minimumOrderAmount) || 0,
      maximum_discount_amount: v.maximumDiscountAmount ? parseFloat(v.maximumDiscountAmount) : null,
      usage_limit: v.usageLimit ? parseInt(v.usageLimit) : null,
      per_user_limit: parseInt(v.perUserLimit) || 1,
      starts_at: v.startsAt ? new Date(v.startsAt).toISOString() : new Date().toISOString(),
      expires_at: v.noExpiry || !v.expiresAt ? null : new Date(v.expiresAt).toISOString(),
      is_active: v.isActive
    }

    updateCouponMutation.mutate(payload)
  }

  const isPending = isCouponLoading || updateCouponMutation.isPending

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-8">

          <div className="flex items-center justify-between mb-8 w-full">
            <div>
              <div className="flex items-center text-xs text-slate-500 mb-1">
                <span className="hover:text-slate-900 cursor-pointer" onClick={() => router.push("/coupon")}>Coupons</span>
                <span className="mx-1">{'>'}</span>
                <span className="font-bold text-slate-900">Edit Coupon</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Edit Coupon</h1>
            </div>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => router.push("/coupon")}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-black hover:bg-black/90 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {updateCouponMutation.isPending ? "Saving..." : "Save Coupon"}
              </button>
            </div>
          </div>

          {isCouponLoading ? (
            <div className="text-sm font-medium text-slate-500 py-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm w-full">
              Loading coupon details...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 w-full">

              {/* Left Column - Form Sections */}
              <div className="space-y-6">

                {/* General Information */}
                <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                  <CardHeader className="bg-white border-b border-slate-100 pt-3 pb-3 px-6">
                    <CardTitle className="text-sm font-bold text-slate-900">General Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">Coupon Code</Label>
                        <Input 
                          {...register("code")}
                          className="h-10 text-sm font-semibold border-slate-200 !text-black placeholder:text-slate-400 uppercase" 
                          placeholder="e.g. MONSOON30" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">Coupon Title</Label>
                        <Input 
                          {...register("title")}
                          className="h-10 text-sm font-semibold border-slate-200 !text-black placeholder:text-slate-400" 
                          placeholder="e.g. Save 30% during monsoon sale" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Description (Internal or Customer Facing)</Label>
                      <textarea 
                        {...register("description")}
                        rows={3}
                        className="w-full p-3 text-sm font-semibold !text-black border border-slate-200 rounded-md bg-white shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y" 
                        placeholder="e.g. Applicable on all products with minimum purchase criteria." 
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Discount Configurations */}
                <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                  <CardHeader className="bg-white border-b border-slate-100 pt-3 pb-3 px-6">
                    <CardTitle className="text-sm font-bold text-slate-900">Discount Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 block mb-1">Discount Type</Label>
                        <Controller
                          name="discountType"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full border-slate-200 text-slate-900 text-xs font-semibold h-10">
                                <SelectValue placeholder="Select discount type" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-md">
                                <SelectItem value="Percentage" className="text-xs font-semibold">Percentage</SelectItem>
                                <SelectItem value="Fixed" className="text-xs font-semibold">Fixed Amount</SelectItem>
                                <SelectItem value="Free Shipping" className="text-xs font-semibold">Free Shipping</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      {discountType !== "Free Shipping" && (
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700">Discount Value</Label>
                          <div className="relative">
                            <Input 
                              {...register("discountValue")}
                              className="h-10 text-sm font-semibold border-slate-200 pr-8 !text-black" 
                              placeholder="0" 
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                              {discountType === "Percentage" ? "%" : "₹"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-5 pt-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">Minimum Order Amount (₹)</Label>
                        <Input 
                          {...register("minimumOrderAmount")}
                          className="h-10 text-sm font-semibold border-slate-200 !text-black" 
                          placeholder="0" 
                        />
                      </div>
                      {discountType !== "Free Shipping" && (
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700">Maximum Discount Amount (₹)</Label>
                          <Input 
                            {...register("maximumDiscountAmount")}
                            className="h-10 text-sm font-semibold border-slate-200 !text-black" 
                            placeholder="e.g. 500 (Leave empty for no limit)" 
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Scheduling */}
                <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                  <CardHeader className="bg-white border-b border-slate-100 pt-3 pb-3 px-6">
                    <CardTitle className="text-sm font-bold text-slate-900">Validity Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">Start Date & Time</Label>
                        <Input 
                          type="datetime-local" 
                          {...register("startsAt")}
                          className="h-10 text-sm font-semibold border-slate-200 !text-black" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">Expiration Date & Time</Label>
                        <Input 
                          type="datetime-local" 
                          {...register("expiresAt")}
                          disabled={noExpiry}
                          className="h-10 text-sm font-semibold border-slate-200 !text-black disabled:opacity-50" 
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Controller
                        name="noExpiry"
                        control={control}
                        render={({ field }) => (
                          <Switch 
                            id="no-expiry" 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="!border-slate-400 !border data-[state=unchecked]:!bg-slate-500 data-[state=checked]:!bg-black shadow-sm" 
                          />
                        )}
                      />
                      <Label htmlFor="no-expiry" className="text-xs font-semibold text-slate-700 cursor-pointer">Never expires</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Usage & Limits */}
                <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                  <CardHeader className="bg-white border-b border-slate-100 pt-3 pb-3 px-6">
                    <CardTitle className="text-sm font-bold text-slate-900">Usage Limits</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">Total Usage Limit</Label>
                        <Input 
                          {...register("usageLimit")}
                          className="h-10 text-sm font-semibold border-slate-200 !text-black" 
                          placeholder="Leave empty for unlimited" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">Limit Per Customer</Label>
                        <Input 
                          {...register("perUserLimit")}
                          className="h-10 text-sm font-semibold border-slate-200 !text-black" 
                          placeholder="e.g. 1" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Right Column - Status & Storefront Preview */}
              <div className="space-y-6">

                {/* Status and Visibility Card */}
                <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-600">Active Status</span>
                      <Controller
                        name="isActive"
                        control={control}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="!border-slate-400 !border data-[state=unchecked]:!bg-slate-500 data-[state=checked]:!bg-black shadow-sm"
                          />
                        )}
                      />
                    </div>
                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs text-slate-500">
                      <span>Visibility</span>
                      <span className="font-bold text-slate-900">Public Storefront</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Real-time Storefront Preview */}
                <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                  <div className="bg-black text-white px-5 py-3 flex justify-between items-center">
                    <h3 className="text-xs font-bold capitalize tracking-wider">Storefront Preview</h3>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                  </div>
                  <CardContent className="p-0">
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                        <span>Minimum Cart Order</span>
                        <span className="text-slate-900">₹{minOrder.toFixed(2)}</span>
                      </div>
                      {discountType !== "Free Shipping" && maxDiscount > 0 && (
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                          <span>Maximum Discount Cap</span>
                          <span className="text-slate-900">₹{maxDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                        <span>Status</span>
                        <span className={`font-bold ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                          {isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </div>
                    </div>
                    <div className="px-5 pb-5 text-center">
                      <p className="text-[10px] italic font-medium text-slate-400 leading-normal">
                        "Enter this promo code at checkout to claim the discount."
                      </p>
                    </div>
                  </CardContent>
                </Card>

              </div>

            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
