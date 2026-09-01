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
import { PlusIcon, Pencil, Trash2, Link2 } from "lucide-react"
import { toast } from "sonner"

function getContrastTextColor(hexColor: string) {
  if (!hexColor || !hexColor.startsWith("#")) return "#ffffff";
  let fullHex = hexColor;
  if (hexColor.length === 4) {
    fullHex = "#" + hexColor[1] + hexColor[1] + hexColor[2] + hexColor[2] + hexColor[3] + hexColor[3];
  }
  const r = parseInt(fullHex.slice(1, 3), 16);
  const g = parseInt(fullHex.slice(3, 5), 16);
  const b = parseInt(fullHex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? "#000000" : "#ffffff";
}

interface FormValues {
  text: string
  color: string
  url: string
  isActive: boolean
}

const defaultFormValues: FormValues = {
  text: "",
  color: "#018001",
  url: "",
  isActive: true,
}

export function HeaderAlertsTab() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editHeader, setEditHeader] = useState<any>(null)

  const { register, watch, setValue, reset, getValues } = useForm<FormValues>({
    defaultValues: defaultFormValues,
  })

  // Fetch all headers
  const { data: headersResponse, isLoading } = useQuery({
    queryKey: ["settings-headers"],
    queryFn: async () => {
      const res = await fetch("/api/settings/header")
      if (!res.ok) throw new Error("Failed to fetch settings")
      return res.json()
    }
  })

  const headers = headersResponse?.headers || []

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/settings/header", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create header alert")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Header alert created successfully!")
      queryClient.invalidateQueries({ queryKey: ["settings-headers"] })
      closeModal()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create header alert")
    }
  })

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await fetch(`/api/settings/header/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to update header alert")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Header alert updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["settings-headers"] })
      closeModal()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update header alert")
    }
  })

  // Toggle Status Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/settings/header/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Header alert status updated!")
      queryClient.invalidateQueries({ queryKey: ["settings-headers"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status")
    }
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/settings/header/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete header alert")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Header alert deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["settings-headers"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete header alert")
    }
  })

  const openCreateModal = () => {
    setEditHeader(null)
    reset(defaultFormValues)
    setIsDialogOpen(true)
  }

  const openEditModal = (header: any) => {
    setEditHeader(header)
    reset({
      text: header.text || "",
      color: header.color || "#018001",
      url: header.url || "",
      isActive: header.isActive !== false,
    })
    setIsDialogOpen(true)
  }

  const closeModal = () => {
    setIsDialogOpen(false)
    setEditHeader(null)
  }

  const handleSave = () => {
    const v = getValues()
    if (!v.text.trim()) {
      toast.error("Text content is required!")
      return
    }

    const payload = {
      text: v.text.trim(),
      color: v.color.trim() || "#018001",
      url: v.url.trim() || null,
      isActive: v.isActive
    }

    if (editHeader) {
      updateMutation.mutate({ id: editHeader.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: number, content: string) => {
    if (confirm(`Are you sure you want to delete header alert "${content}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 ">
      <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-sm font-bold text-slate-950">Storefront Header Alerts</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Configure the announcement banner displayed at the absolute top of the consumer web storefront.
            </CardDescription>
          </div>
          <Button
            onClick={openCreateModal}
            className="text-xs font-bold text-white bg-black hover:bg-black/90 shadow-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" /> Add New Alert
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f8fafc]">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest pl-6">PREVIEW / TEXT</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">URL REDIRECT</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">COLOR</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">STATUS</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center pr-6">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8 text-center text-xs font-semibold text-slate-400">
                    Loading configurations...
                  </TableCell>
                </TableRow>
              ) : headers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8 text-center text-xs font-semibold text-slate-400">
                    No header alerts configured. Create one to display on the storefront.
                  </TableCell>
                </TableRow>
              ) : (
                headers.map((header: any) => {
                  const contrastText = getContrastTextColor(header.color || "#018001")
                  return (
                    <TableRow key={header.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="py-4 pl-6">
                        <div className="space-y-2">
                          <div
                            className="py-1 px-3 rounded text-[10px] font-bold text-center border inline-block max-w-sm truncate shadow-xs"
                            style={{
                              backgroundColor: header.color || "#018001",
                              color: contrastText,
                              borderColor: "rgba(0,0,0,0.05)"
                            }}
                          >
                            {header.text}
                          </div>
                          <p className="text-xs font-semibold text-slate-700 max-w-sm truncate">{header.text}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {header.url ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors">
                            <Link2 className="h-3.5 w-3.5" />
                            {header.url}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 italic">None (Static bar)</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 shadow-xs">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300"
                            style={{ backgroundColor: header.color || "#018001" }}
                          ></span>
                          <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">
                            {header.color || "#018001"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            size="sm"
                            checked={header.isActive !== false}
                            disabled={toggleMutation.isPending}
                            onCheckedChange={(checked) => {
                              toggleMutation.mutate({ id: header.id, isActive: checked })
                            }}
                          />
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold rounded px-1.5 py-0.5 uppercase tracking-wider ${header.isActive !== false
                                ? "text-green-600 bg-green-50 border-green-200"
                                : "text-slate-400 bg-slate-50 border-slate-200"
                              }`}
                          >
                            {header.isActive !== false ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center pr-6">
                        <div className="flex justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(header)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(header.id, header.text)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Dialog Alert Configuration modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editHeader ? "Edit Header Alert Announcement" : "Create Header Alert Announcement"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Write the text display and banner styles for the storefront announcements.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Banner Announcement Text</Label>
              <Input
                placeholder="e.g. Special Offer: 20% Off All Collection Items!"
                {...register("text")}
                className="h-9 text-xs bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Redirect Route URL</Label>
              <Input
                placeholder="e.g. /category/new-arrivals"
                {...register("url")}
                className="h-9 text-xs bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Banner Background Color (Hex)</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={watch("color")}
                  onChange={(e) => setValue("color", e.target.value)}
                  className="w-12 h-9 p-0 border border-slate-200 cursor-pointer"
                />
                <Input
                  placeholder="#018001"
                  {...register("color")}
                  className="h-9 text-xs flex-1 bg-slate-50/50 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <Label className="text-xs font-bold text-slate-800">Activate Alert</Label>
                <p className="text-[10px] text-slate-400 mt-0.5">Show this announcement on the storefront.</p>
              </div>
              <Switch
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={closeModal} className="h-8 text-xs font-bold border-slate-200">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="bg-black hover:bg-black/90 text-white font-bold text-xs h-8 shadow-sm">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
