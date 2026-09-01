"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PlusIcon, Pencil, Trash2, LayersIcon, LayoutGridIcon, MoreVerticalIcon, EyeIcon, ExternalLinkIcon } from "lucide-react"
import { toast } from "sonner"

interface GroupFormValues {
  heading: string
  discription: string
  type: string
  url: string
  urlText: string
  isActive?: boolean
  index?: number
}

const defaultFormValues: GroupFormValues = {
  heading: "",
  discription: "",
  type: "ALL",
  url: "",
  urlText: "",
  isActive: false,
  index: 0,
}

export function ProductGroupsTab() {
  const queryClient = useQueryClient()
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedGroupHeading, setSelectedGroupHeading] = useState<string>("")

  // Group CRUD states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [editGroup, setEditGroup] = useState<any>(null)

  const { register, watch, reset, getValues, setValue } = useForm<GroupFormValues>({
    defaultValues: defaultFormValues,
  })

  // Fetch groups
  const { data: groupsData, isLoading: isGroupsLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups")
      if (!res.ok) throw new Error("Failed to fetch product groups")
      return res.json()
    }
  })

  // Fetch products inside selected group
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ["group-products", selectedGroupId],
    queryFn: async () => {
      if (selectedGroupId === null) return null
      const res = await fetch(`/api/groups/${selectedGroupId}/products`)
      if (!res.ok) throw new Error("Failed to fetch products for group")
      return res.json()
    },
    enabled: selectedGroupId !== null
  })

  const groupsList = groupsData?.groups || []
  const productsList = productsData?.products || []

  const totalGroups = groupsList.length
  const totalAssignedProducts = groupsList.reduce((acc: number, cur: any) => acc + (cur.productCount || 0), 0)

  const openAddGroupModal = () => {
    setEditGroup(null)
    reset(defaultFormValues)
    setIsGroupModalOpen(true)
  }

  const openEditGroupModal = (group: any) => {
    setEditGroup(group)
    reset({
      heading: group.heading || "",
      discription: group.discription || "",
      type: group.type || "ALL",
      url: group.url || "",
      urlText: group.urlText || "",
      isActive: !!group.isActive,
      index: group.index !== undefined ? Number(group.index) : 0,
    })
    setIsGroupModalOpen(true)
  }

  const closeGroupModal = () => {
    setIsGroupModalOpen(false)
    setEditGroup(null)
  }

  const createGroupMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to create group")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Product Group created successfully!")
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      closeGroupModal()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create group")
    }
  })

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await fetch(`/api/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to update group")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Product Group updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      closeGroupModal()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update group")
    }
  })

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to delete group")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Product Group deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["groups"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete group")
    }
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to update status")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Product Group status updated!")
      queryClient.invalidateQueries({ queryKey: ["groups"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status")
    }
  })

  const handleSaveGroup = () => {
    const v = getValues()
    if (!v.heading.trim()) {
      toast.error("Group Heading is required")
      return
    }

    const payload = {
      heading: v.heading.trim(),
      discription: v.discription.trim(),
      type: v.type,
      url: v.url.trim(),
      urlText: v.urlText.trim(),
      isActive: !!v.isActive,
      index: v.index !== undefined ? Number(v.index) : 0,
    }

    if (editGroup) {
      updateGroupMutation.mutate({ id: editGroup.id, payload })
    } else {
      createGroupMutation.mutate(payload)
    }
  }

  const handleDeleteGroup = (id: number, heading: string) => {
    if (confirm(`Are you sure you want to delete product group "${heading}"?`)) {
      deleteGroupMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header card with add button */}
      <div className=" flex items-center justify-between mb-4 flex-wrap gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-950">Homepage Groups & Sections</h3>
          <p className="text-xs text-slate-500">Manage dynamic product sections and tag-based collections shown on the homepage.</p>
        </div>
        <Button
          onClick={openAddGroupModal}
          className="bg-black text-white hover:bg-black/90 font-bold text-xs h-9 rounded-lg px-4 flex items-center gap-1.5"
        >
          <PlusIcon className="h-4 w-4" /> Add Product Group
        </Button>
      </div>

      {/* Metrics summary cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6 ">
        <Card className="shadow-sm border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-150">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Sections</p>
              <h3 className="text-3xl font-black text-slate-900">{totalGroups}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <LayersIcon className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-150 delay-75">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Assigned Products</p>
              <h3 className="text-3xl font-black text-slate-900">{totalAssignedProducts}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <LayoutGridIcon className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups table card */}
      <Card className="shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200 rounded-2xl bg-white overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f8fafc] border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4 pl-6">ID</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4 text-center">Position</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Heading / Title</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Description</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4 text-center">Collection Type</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4 text-center">Product Count</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">URL Slug</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4 text-center">Active</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4 pr-6 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isGroupsLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-8 text-center text-xs font-semibold text-slate-400">
                    Loading homepage groups...
                  </TableCell>
                </TableRow>
              ) : groupsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-8 text-center text-xs font-semibold text-slate-400">
                    No groups found in database.
                  </TableCell>
                </TableRow>
              ) : (
                groupsList.map((group: any) => (
                  <TableRow key={group.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <TableCell className="font-bold text-slate-900 py-5 pl-6 text-sm">#{group.id}</TableCell>
                    <TableCell className="py-5 text-center text-sm font-semibold text-slate-700">
                      {group.index !== undefined ? group.index : 0}
                    </TableCell>
                    <TableCell className="py-5 font-bold text-slate-900 text-sm">
                      {group.heading}
                      {group.urlText && (
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Label: {group.urlText.slice(0, 15)}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-5 max-w-[280px]">
                      <p className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed">{group.discription}</p>
                    </TableCell>
                    <TableCell className="py-5 text-center">
                      <Badge variant="outline" className={`
                          ${group.type === 'ALL' ? 'bg-slate-100 text-slate-700 border-slate-200' : ''}
                          ${group.type === 'BEST_SELLER' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}
                          ${group.type === 'CAMPAING' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                          font-bold shadow-none rounded-md px-2.5 py-0.5 text-[10px] uppercase tracking-wide
                        `}>
                        {group.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 text-center">
                      <Badge variant="secondary" className="font-black text-slate-808 bg-slate-100 text-xs px-2.5 py-0.5 rounded-full">
                        {group.productCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5">
                      <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50/50 border border-blue-100 px-2 py-0.5 rounded">
                        {group.url}
                      </span>
                    </TableCell>
                    <TableCell className="py-5 text-center">
                      <Switch
                        checked={!!group.isActive}
                        disabled={toggleActiveMutation.isPending}
                        onCheckedChange={(checked) => {
                          toggleActiveMutation.mutate({ id: group.id, isActive: checked })
                        }}
                      />
                    </TableCell>
                    <TableCell className="py-5 pr-6 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border border-slate-200 text-slate-900 shadow-md min-w-[150px]">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedGroupId(group.id)
                              setSelectedGroupHeading(group.heading)
                            }}
                            className="text-xs font-semibold cursor-pointer hover:bg-slate-50 px-3 py-2 flex items-center gap-2"
                          >
                            <EyeIcon className="h-3.5 w-3.5 text-slate-400" /> View Products
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditGroupModal(group)}
                            className="text-xs font-semibold cursor-pointer hover:bg-slate-50 px-3 py-2 flex items-center gap-2 text-blue-600 hover:text-blue-800"
                          >
                            <Pencil className="h-3.5 w-3.5 text-blue-500" /> Edit Section
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={deleteGroupMutation.isPending}
                            onClick={() => handleDeleteGroup(group.id, group.heading)}
                            className="text-xs font-semibold cursor-pointer hover:bg-slate-50 px-3 py-2 flex items-center gap-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" /> Delete Section
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            asChild
                            className="text-xs font-semibold cursor-pointer hover:bg-slate-50 px-3 py-2 flex items-center gap-2 border-t border-slate-100"
                          >
                            <a href={`https://markline.com/${group.url}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLinkIcon className="h-3.5 w-3.5 text-slate-400" /> Open Public URL
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      {/* Dynamic Products Dialog for Product Groups */}
      <Dialog open={selectedGroupId !== null} onOpenChange={(open) => { if (!open) setSelectedGroupId(null); }}>
        <DialogContent className="max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-lg p-6 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <LayoutGridIcon className="h-5 w-5 text-blue-650" /> Products in &ldquo;{selectedGroupHeading}&rdquo;
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500">
              View the products currently tagged inside this dynamic homepage section.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
            {isProductsLoading ? (
              <div className="p-8 text-center text-xs font-semibold text-slate-400">
                Loading products list...
              </div>
            ) : productsList.length === 0 ? (
              <div className="p-8 text-center text-xs font-semibold text-slate-400">
                No products are currently assigned to this group.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3 pl-4">ID</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3">Product Name</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3">Brand</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3 text-center">Gender</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3">Slug</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsList.map((prod: any) => (
                    <TableRow key={prod.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <TableCell className="font-bold text-slate-900 py-3 pl-4 text-xs">#{prod.id}</TableCell>
                      <TableCell className="py-3 font-semibold text-slate-900 text-xs">{prod.name}</TableCell>
                      <TableCell className="py-3 text-slate-600 text-xs">{prod.brands?.name || 'N/A'}</TableCell>
                      <TableCell className="py-3 text-center text-xs">
                        <Badge variant="outline" className="text-[9px] font-bold rounded capitalize px-1.5 py-px border-slate-200 text-slate-600 bg-slate-50">
                          {prod.gender || 'unisex'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-slate-400 font-mono text-[10px]">{prod.slug}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setSelectedGroupId(null)}
              className="bg-black text-white hover:bg-black/90 font-bold text-xs px-5 h-9 rounded-lg"
            >
              Close Window
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Create/Edit Product Group */}
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-950">
              {editGroup ? "Edit Product Group" : "Add Product Group"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editGroup ? "Modify homepage section metadata details." : "Configure a new dynamic homepage group/section."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
            {/* Heading */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Group Heading / Title</Label>
              <Input
                {...register("heading")}
                placeholder="e.g. Best Sellers"
                className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Description</Label>
              <Input
                {...register("discription")}
                placeholder="e.g. Most popular products of the season"
                className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
              />
            </div>

            {/* Collection Type (Select) */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Collection Type</Label>
              <select
                {...register("type")}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 shadow-sm"
              >
                <option value="ALL">ALL (Standard Collection)</option>
                <option value="BEST_SELLER">BEST_SELLER (Best Sellers)</option>
                <option value="CAMPAING">CAMPAING (Campaign Section)</option>
              </select>
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">URL Slug</Label>
              <Input
                {...register("url")}
                placeholder="e.g. best-sellers"
                className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
              />
            </div>

            {/* URL Text Label */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">URL Label / Text</Label>
              <Input
                {...register("urlText")}
                placeholder="e.g. View All"
                className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
              />
            </div>

            {/* Position / Index */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Position / Index</Label>
              <Input
                type="number"
                {...register("index")}
                placeholder="e.g. 0"
                className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
              />
            </div>

            {/* Active Status Switch */}
            <div className="flex items-center justify-between py-3 border-t border-slate-100 mt-2 md:col-span-2">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active Status</Label>
                <span className="text-[11px] text-slate-500">Enable this section on the homepage</span>
              </div>
              <Switch
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>
          </div>

          <DialogFooter className="bg-slate-50 -mx-4 -mb-4 px-4 py-3 rounded-b-xl border-t border-slate-150 flex gap-2">
            <Button
              variant="outline"
              onClick={closeGroupModal}
              disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
              className="text-xs font-bold text-slate-700 border-slate-300 bg-white hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveGroup}
              disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
              className="text-xs font-bold text-white bg-black hover:bg-black/90 px-4"
            >
              {createGroupMutation.isPending || updateGroupMutation.isPending ? "Saving..." : editGroup ? "Save Changes" : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
