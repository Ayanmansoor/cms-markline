"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlusIcon, Pencil, Trash2, Warehouse, MapPin, Phone } from "lucide-react"
import { toast } from "sonner"

interface WarehouseRecord {
  id: number
  name: string
  contact_person: string
  phone: string
  email: string | null
  address_line_1: string
  address_line_2: string | null
  landmark: string | null
  city: string
  state: string
  country: string
  pincode: string
  latitude: number | null
  longitude: number | null
  gst_number: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WarehouseFormValues {
  name: string
  contactPerson: string
  phone: string
  email: string
  addressLine1: string
  addressLine2: string
  landmark: string
  city: string
  state: string
  country: string
  pincode: string
  latitude: string
  longitude: string
  gstNumber: string
  isDefault: boolean
  isActive: boolean
}

const defaultFormValues: WarehouseFormValues = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  latitude: "",
  longitude: "",
  gstNumber: "",
  isDefault: false,
  isActive: true,
}

export function WarehousesTab() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editWarehouse, setEditWarehouse] = useState<WarehouseRecord | null>(null)

  const { register, watch, setValue, reset, getValues } = useForm<WarehouseFormValues>({
    defaultValues: defaultFormValues,
  })

  const { data: warehousesResponse, isLoading } = useQuery({
    queryKey: ["settings-warehouses"],
    queryFn: async () => {
      const res = await fetch("/api/settings/warehouses")
      if (!res.ok) throw new Error("Failed to fetch warehouses")
      return res.json()
    }
  })

  const warehouses: WarehouseRecord[] = warehousesResponse?.warehouses || []

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/settings/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create warehouse")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Warehouse created successfully!")
      queryClient.invalidateQueries({ queryKey: ["settings-warehouses"] })
      closeModal()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create warehouse")
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await fetch(`/api/settings/warehouses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update warehouse")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Warehouse updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["settings-warehouses"] })
      closeModal()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update warehouse")
    }
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/settings/warehouses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Warehouse status updated!")
      queryClient.invalidateQueries({ queryKey: ["settings-warehouses"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status")
    }
  })

  const toggleDefaultMutation = useMutation({
    mutationFn: async ({ id, isDefault }: { id: number; isDefault: boolean }) => {
      const res = await fetch(`/api/settings/warehouses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault }),
      })
      if (!res.ok) throw new Error("Failed to update default status")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Default warehouse updated!")
      queryClient.invalidateQueries({ queryKey: ["settings-warehouses"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update default status")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/settings/warehouses/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete warehouse")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Warehouse deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["settings-warehouses"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete warehouse")
    }
  })

  const openCreateModal = () => {
    setEditWarehouse(null)
    reset(defaultFormValues)
    setIsDialogOpen(true)
  }

  const openEditModal = (wh: WarehouseRecord) => {
    setEditWarehouse(wh)
    reset({
      name: wh.name || "",
      contactPerson: wh.contact_person || "",
      phone: wh.phone || "",
      email: wh.email || "",
      addressLine1: wh.address_line_1 || "",
      addressLine2: wh.address_line_2 || "",
      landmark: wh.landmark || "",
      city: wh.city || "",
      state: wh.state || "",
      country: wh.country || "",
      pincode: wh.pincode || "",
      latitude: wh.latitude?.toString() || "",
      longitude: wh.longitude?.toString() || "",
      gstNumber: wh.gst_number || "",
      isDefault: wh.is_default || false,
      isActive: wh.is_active !== false,
    })
    setIsDialogOpen(true)
  }

  const closeModal = () => {
    setIsDialogOpen(false)
    setEditWarehouse(null)
  }

  const handleSave = () => {
    const v = getValues()
    if (!v.name.trim()) {
      toast.error("Warehouse name is required!")
      return
    }
    if (!v.contactPerson.trim()) {
      toast.error("Contact person is required!")
      return
    }
    if (!v.phone.trim()) {
      toast.error("Phone number is required!")
      return
    }
    if (!v.addressLine1.trim()) {
      toast.error("Address is required!")
      return
    }
    if (!v.city.trim()) {
      toast.error("City is required!")
      return
    }
    if (!v.state.trim()) {
      toast.error("State is required!")
      return
    }
    if (!v.country.trim()) {
      toast.error("Country is required!")
      return
    }
    if (!v.pincode.trim()) {
      toast.error("Pincode is required!")
      return
    }

    const payload = {
      name: v.name.trim(),
      contactPerson: v.contactPerson.trim(),
      phone: v.phone.trim(),
      email: v.email.trim() || null,
      addressLine1: v.addressLine1.trim(),
      addressLine2: v.addressLine2.trim() || null,
      landmark: v.landmark.trim() || null,
      city: v.city.trim(),
      state: v.state.trim(),
      country: v.country.trim(),
      pincode: v.pincode.trim(),
      latitude: v.latitude ? Number(v.latitude) : null,
      longitude: v.longitude ? Number(v.longitude) : null,
      gstNumber: v.gstNumber.trim() || null,
      isDefault: v.isDefault,
      isActive: v.isActive,
    }

    if (editWarehouse) {
      updateMutation.mutate({ id: editWarehouse.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete warehouse "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 max-w-6xl">
      <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-sm font-bold text-slate-950">Warehouses</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Manage your warehouse locations for inventory and order fulfillment.
            </CardDescription>
          </div>
          <Button
            onClick={openCreateModal}
            className="text-xs font-bold text-white bg-black hover:bg-black/90 shadow-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" /> Add Warehouse
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f8fafc]">
              <TableRow className="border-b border-slate-200 hover:bg-transparent">
                <TableHead className="h-11 text-[9px] font-black text-slate-700 uppercase tracking-widest pl-6">WAREHOUSE NAME</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-700 uppercase tracking-widest">CONTACT</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-700 uppercase tracking-widest">LOCATION</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-700 uppercase tracking-widest">DEFAULT</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-700 uppercase tracking-widest">STATUS</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-700 uppercase tracking-widest text-center pr-6">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-xs font-semibold text-slate-400">
                    Loading warehouses...
                  </TableCell>
                </TableRow>
              ) : warehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-xs font-semibold text-slate-400">
                    No warehouses configured. Add one to start managing inventory.
                  </TableCell>
                </TableRow>
              ) : (
                warehouses.map((wh) => (
                  <TableRow key={wh.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Warehouse className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{wh.name}</p>
                          {wh.gst_number && (
                            <p className="text-[10px] font-mono text-slate-400">GST: {wh.gst_number}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-900">{wh.contact_person}</p>
                        <p className="text-[10px] text-slate-700 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" /> {wh.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-start gap-1.5 max-w-[300px]">
                        <MapPin className="h-3.5 w-3.5 text-slate-900 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-slate-900 leading-snug">
                          {wh.address_line_1}{wh.address_line_2 ? `, ${wh.address_line_2}` : ""}
                          <br />
                          {wh.city}, {wh.state} {wh.pincode}
                          <br />
                          <span className="text-slate-400 ">{wh?.country?.slice(0, 20)}</span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Switch
                        className="border border-gray-200 "
                        size="sm"
                        checked={wh.is_default}
                        disabled={toggleDefaultMutation.isPending}
                        onCheckedChange={(checked) => {
                          toggleDefaultMutation.mutate({ id: wh.id, isDefault: checked })
                        }}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        {/* <Switch
                          size="sm"
                          checked={wh.is_active}
                          disabled={toggleActiveMutation.isPending}
                          onCheckedChange={(checked) => {
                            toggleActiveMutation.mutate({ id: wh.id, isActive: checked })
                          }}
                        /> */}
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold rounded px-1.5 py-0.5 uppercase tracking-wider ${wh.is_active
                            ? "text-green-600 bg-green-50 border-green-200"
                            : "text-slate-400 bg-slate-50 border-slate-200"
                            }`}
                        >
                          {wh.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center pr-6">
                      <div className="flex justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(wh)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(wh.id, wh.name)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Warehouse Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="  max-w-[800px] xl:min-w-[700px] 2xl:min-w-[800px] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editWarehouse ? "Edit Warehouse" : "Add New Warehouse"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editWarehouse ? "Update the warehouse details below." : "Fill in the details to add a new warehouse location."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Basic Information */}
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Warehouse Name *</Label>
                  <Input
                    placeholder="e.g. Main Distribution Center"
                    {...register("name")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Contact Person *</Label>
                  <Input
                    placeholder="e.g. Rajesh Kumar"
                    {...register("contactPerson")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Phone *</Label>
                  <Input
                    placeholder="e.g. +91 98765 43210"
                    {...register("phone")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Email</Label>
                  <Input
                    placeholder="e.g. warehouse@example.com"
                    {...register("email")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Address */}
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Address</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Address Line 1 *</Label>
                  <Input
                    placeholder="e.g. 123 Industrial Area, Phase II"
                    {...register("addressLine1")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Address Line 2</Label>
                  <Input
                    placeholder="e.g. Building No. 4, Floor 2"
                    {...register("addressLine2")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Landmark</Label>
                  <Input
                    placeholder="e.g. Near Metro Station"
                    {...register("landmark")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">City *</Label>
                  <Input
                    placeholder="e.g. Mumbai"
                    {...register("city")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">State *</Label>
                  <Input
                    placeholder="e.g. Maharashtra"
                    {...register("state")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Country *</Label>
                  <Input
                    placeholder="e.g. India"
                    {...register("country")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Pincode *</Label>
                  <Input
                    placeholder="e.g. 400001"
                    {...register("pincode")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Geo & Tax */}
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Location & Tax</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Latitude</Label>
                  <Input
                    placeholder="e.g. 19.0760"
                    {...register("latitude")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Longitude</Label>
                  <Input
                    placeholder="e.g. 72.8777"
                    {...register("longitude")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">GST Number</Label>
                  <Input
                    placeholder="e.g. 27AABCU9603R1ZM"
                    {...register("gstNumber")}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Settings */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={watch("isDefault")}
                    onCheckedChange={(checked) => setValue("isDefault", checked)}
                  />
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Default Warehouse</Label>
                    <p className="text-[10px] text-slate-400">Used for new orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={watch("isActive")}
                    onCheckedChange={(checked) => setValue("isActive", checked)}
                  />
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Active</Label>
                    <p className="text-[10px] text-slate-400">Visible for order assignment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={closeModal} className="h-8 text-xs font-bold border-slate-200">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-black hover:bg-black/90 text-white font-bold text-xs h-8 shadow-sm"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Warehouse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
