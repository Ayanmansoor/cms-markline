"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlusIcon, Pencil, Trash2, Truck, IndianRupee, ShieldCheck, Gift } from "lucide-react"
import { toast } from "sonner"

interface ShippingFormValues {
  shipping_enabled: boolean
  free_delivery_enabled: boolean
  free_delivery_min_amount: number
  shipping_charge: number
}

const defaultFormValues: ShippingFormValues = {
  shipping_enabled: true,
  free_delivery_enabled: true,
  free_delivery_min_amount: 600.00,
  shipping_charge: 79.00,
}

export function ShippingSettingsTab() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editSetting, setEditSetting] = useState<any>(null)

  const { register, watch, setValue, reset, getValues } = useForm<ShippingFormValues>({
    defaultValues: defaultFormValues,
  })

  // Fetch all shipping settings with Axios
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ["settings-shipping"],
    queryFn: async () => {
      const response = await axios.get("/api/settings/shipping")
      return response.data
    }
  })

  const settings = settingsResponse?.settings || []
  const activeSetting = settings.length > 0 ? settings[settings.length - 1] : null

  // Create Mutation with Axios
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await axios.post("/api/settings/shipping", payload)
      return response.data
    },
    onSuccess: () => {
      toast.success("Shipping configuration created successfully!")
      queryClient.invalidateQueries({ queryKey: ["settings-shipping"] })
      closeModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Failed to create shipping settings"
      toast.error(msg)
    }
  })

  // Update Mutation with Axios
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const response = await axios.put(`/api/settings/shipping/${id}`, payload)
      return response.data
    },
    onSuccess: () => {
      toast.success("Shipping configuration updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["settings-shipping"] })
      closeModal()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Failed to update shipping settings"
      toast.error(msg)
    }
  })

  // Toggle Single Switch Mutation with Axios
  const toggleMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const response = await axios.put(`/api/settings/shipping/${id}`, payload)
      return response.data
    },
    onSuccess: () => {
      toast.success("Shipping configuration status updated!")
      queryClient.invalidateQueries({ queryKey: ["settings-shipping"] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Failed to update status"
      toast.error(msg)
    }
  })

  // Delete Mutation with Axios
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`/api/settings/shipping/${id}`)
      return response.data
    },
    onSuccess: () => {
      toast.success("Shipping configuration deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["settings-shipping"] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Failed to delete shipping configuration"
      toast.error(msg)
    }
  })

  const openCreateModal = () => {
    setEditSetting(null)
    reset(defaultFormValues)
    setIsDialogOpen(true)
  }

  const openEditModal = (item: any) => {
    setEditSetting(item)
    reset({
      shipping_enabled: item.shipping_enabled !== false,
      free_delivery_enabled: item.free_delivery_enabled !== false,
      free_delivery_min_amount: Number(item.free_delivery_min_amount ?? 600.00),
      shipping_charge: Number(item.shipping_charge ?? 79.00),
    })
    setIsDialogOpen(true)
  }

  const closeModal = () => {
    setIsDialogOpen(false)
    setEditSetting(null)
  }

  const handleSave = () => {
    const v = getValues()
    const minAmount = Number(v.free_delivery_min_amount)
    const charge = Number(v.shipping_charge)

    if (isNaN(minAmount) || minAmount < 0) {
      toast.error("Please enter a valid non-negative free delivery threshold amount!")
      return
    }
    if (isNaN(charge) || charge < 0) {
      toast.error("Please enter a valid non-negative shipping charge!")
      return
    }

    const payload = {
      shipping_enabled: v.shipping_enabled,
      free_delivery_enabled: v.free_delivery_enabled,
      free_delivery_min_amount: minAmount,
      shipping_charge: charge,
    }

    if (editSetting) {
      updateMutation.mutate({ id: editSetting.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: number) => {
    if (confirm(`Are you sure you want to delete shipping configuration #${id}?`)) {
      deleteMutation.mutate(id)
    }
  }

  const formatCurrency = (amount: number | string) => {
    const num = Number(amount)
    return isNaN(num) ? "₹0.00" : `₹${num.toFixed(2)}`
  }

  return (
    <div className="grid grid-cols-1 gap-6">


      {/* Main Table Card */}
      <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-sm font-bold text-slate-950 flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-600" />
              Shipping & Delivery Settings
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Manage free shipping thresholds, standard shipping fees, and site-wide delivery toggles.
            </CardDescription>
          </div>
          <Button
            onClick={openCreateModal}
            className="text-xs font-bold text-white bg-black hover:bg-black/90 shadow-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" /> Add Configuration
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f8fafc]">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="h-11 text-xs font-black text-slate-500  tracking-widest pl-6">ID</TableHead>
                <TableHead className="h-11 text-xs font-black text-slate-500  tracking-widest">SHIPPING STATUS</TableHead>
                <TableHead className="h-11 text-xs font-black text-slate-500  tracking-widest">FREE DELIVERY</TableHead>
                <TableHead className="h-11 text-xs font-black text-slate-500  tracking-widest">MIN FREE ORDER</TableHead>
                <TableHead className="h-11 text-xs font-black text-slate-500  tracking-widest">FLAT CHARGE</TableHead>
                <TableHead className="h-11 text-xs font-black text-slate-500  tracking-widest">LAST UPDATED</TableHead>
                <TableHead className="h-11 text-xs font-black text-slate-500  tracking-widest text-center pr-6">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-8 text-center text-xs font-semibold text-slate-400">
                    Loading shipping settings...
                  </TableCell>
                </TableRow>
              ) : settings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-10 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <Truck className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No Shipping Settings Found</p>
                      <p className="text-[11px] text-slate-400">
                        Create a shipping configuration profile or initialize standard storefront defaults.
                      </p>
                      <Button
                        onClick={() => createMutation.mutate(defaultFormValues)}
                        disabled={createMutation.isPending}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Initialize Default Settings
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                settings.map((item: any) => {
                  const updatedAt = item.updated_at
                    ? new Date(item.updated_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "N/A"

                  return (
                    <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="py-4 pl-6">
                        <span className="text-sm font-bold text-slate-800">#{item.id}</span>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            size="sm"
                            checked={item.shipping_enabled !== false}
                            disabled={toggleMutation.isPending}
                            onCheckedChange={(checked) => {
                              toggleMutation.mutate({ id: item.id, payload: { shipping_enabled: checked } })
                            }}
                          />
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold rounded px-1.5 py-0.5 uppercase tracking-wider ${item.shipping_enabled !== false
                              ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                              : "text-slate-400 bg-slate-50 border-slate-200"
                              }`}
                          >
                            {item.shipping_enabled !== false ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            size="sm"
                            checked={item.free_delivery_enabled !== false}
                            disabled={toggleMutation.isPending}
                            onCheckedChange={(checked) => {
                              toggleMutation.mutate({ id: item.id, payload: { free_delivery_enabled: checked } })
                            }}
                          />
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold rounded px-1.5 py-0.5 uppercase tracking-wider ${item.free_delivery_enabled !== false
                              ? "text-blue-600 bg-blue-50 border-blue-200"
                              : "text-slate-400 bg-slate-50 border-slate-200"
                              }`}
                          >
                            {item.free_delivery_enabled !== false ? "Active" : "Off"}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <span className="text-sm font-bold text-slate-900">
                          {formatCurrency(item.free_delivery_min_amount)}
                        </span>
                      </TableCell>

                      <TableCell className="py-4">
                        <span className="text-sm font-bold text-slate-900">
                          {formatCurrency(item.shipping_charge)}
                        </span>
                      </TableCell>

                      <TableCell className="py-4">
                        <span className="text-sm font-medium text-slate-500">{updatedAt}</span>
                      </TableCell>

                      <TableCell className="py-4 text-center pr-6">
                        <div className="flex justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(item)}
                            className="h-10 w-10 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(item.id)}
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Configuration Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-gray-50 border border-slate-200 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editSetting ? "Edit Shipping Configuration" : "Add Shipping Configuration"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Configure free shipping minimum order requirements and standard delivery charges.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <Label className="text-sm font-bold text-slate-800">Enable Shipping Service</Label>
                <p className="text-[10px] text-slate-400 mt-0.5">Toggle shipping capability across checkout.</p>
              </div>
              <Switch
                checked={watch("shipping_enabled")}
                onCheckedChange={(checked) => setValue("shipping_enabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <Label className="text-sm font-bold text-slate-800">Enable Free Delivery Threshold</Label>
                <p className="text-[10px] text-slate-400 mt-0.5">Waive shipping charge above minimum cart total.</p>
              </div>
              <Switch
                checked={watch("free_delivery_enabled")}
                onCheckedChange={(checked) => setValue("free_delivery_enabled", checked)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-slate-700">Free Delivery Minimum Order Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-bold">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="600.00"
                  {...register("free_delivery_min_amount", { valueAsNumber: true })}
                  className="h-9 text-sm pl-7 bg-slate-50/50"
                />
              </div>
              <p className="text-[10px] text-slate-400">Orders equal to or above this amount qualify for free shipping.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-slate-700">Standard Shipping Charge (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-bold">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="79.00"
                  {...register("shipping_charge", { valueAsNumber: true })}
                  className="h-9 text-sm pl-7 bg-slate-50/50"
                />
              </div>
              <p className="text-[10px] text-slate-400">Flat shipping fee applied when order total is below free delivery threshold.</p>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={closeModal} className="h-8 text-sm font-bold border-slate-200">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-black hover:bg-black/90 text-white font-bold text-sm h-8 shadow-sm"
            >
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
