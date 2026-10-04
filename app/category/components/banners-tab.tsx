"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PlusIcon, Pencil, Trash2, ExternalLink, ImageIcon, Search } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { BannerFormModal } from "@/components/catalog/banner-form-modal"
import { categoryService } from "@/services/category.service"
import { uploadService } from "@/services/upload.service"
import { parseImageUrl } from "@/lib/utils"

interface BannerFormValues {
  id?: number
  bannerName: string
  bannerUrl: string
  bannerImageUrl: string
  bannerGender: string
  bannerIsMobile: boolean
  bannerIsEnable: boolean
  bannerCollectionId: string
  bannerHomePromotional: boolean
}

const defaultFormValues: BannerFormValues = {
  id: undefined,
  bannerName: "",
  bannerUrl: "",
  bannerImageUrl: "",
  bannerGender: "WOMEN",
  bannerIsMobile: false,
  bannerIsEnable: true,
  bannerCollectionId: "",
  bannerHomePromotional: false,
}

export function BannersTab({ externalAddOpen, onExternalAddClose }: { externalAddOpen?: boolean; onExternalAddClose?: () => void }) {
  const queryClient = useQueryClient()
  const [bannerSearch, setBannerSearch] = useState("")
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false)
  const [editBanner, setEditBanner] = useState<any>(null)

  const [bannerImageUploadMethod, setBannerImageUploadMethod] = useState<"url" | "file">("url")
  const [bannerIsUploading, setBannerIsUploading] = useState(false)

  const { register, watch, setValue, reset, getValues } = useForm<BannerFormValues>({
    defaultValues: defaultFormValues,
  })

  // Fetch collection options for filter
  const { data: collectionsFilterResponse } = useQuery({
    queryKey: ["collections-filter"],
    queryFn: () => categoryService.getCollectionFilters(),
  })
  const collectionOptions = collectionsFilterResponse?.collections || []

  // Fetch banners
  const { data: bannersResponse, isLoading } = useQuery({
    queryKey: ["collection-banners"],
    queryFn: () => categoryService.getBanners(),
  })

  const collectionBanners = bannersResponse?.banners || []

  // Create Banner Mutation
  const createBannerMutation = useMutation({
    mutationFn: (payload: any) => categoryService.createBanner(payload),
    onSuccess: () => {
      toast.success("Collection banner created successfully!")
      queryClient.invalidateQueries({ queryKey: ["collection-banners"] })
      closeBannerDialog()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create banner")
    },
  })

  // Update Banner Mutation
  const updateBannerMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => categoryService.updateBanner(id, payload),
    onSuccess: () => {
      toast.success("Collection banner updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["collection-banners"] })
      closeBannerDialog()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update banner")
    },
  })

  // Delete Banner Mutation
  const deleteBannerMutation = useMutation({
    mutationFn: (id: number) => categoryService.deleteBanner(id),
    onSuccess: () => {
      toast.success("Collection banner deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["collection-banners"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete banner")
    },
  })

  // Toggle Enable Mutation
  const toggleEnableMutation = useMutation({
    mutationFn: ({ id, isEnable }: { id: number; isEnable: boolean }) => categoryService.updateBanner(id, { isEnable }),
    onSuccess: () => {
      toast.success("Banner status updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["collection-banners"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update banner status")
    },
  })

  const openAddBannerDialog = () => {
    setEditBanner(null)
    reset(defaultFormValues)
    setBannerImageUploadMethod("url")
    setIsBannerDialogOpen(true)
  }

  const openEditBannerDialog = (banner: any) => {
    setEditBanner(banner)
    reset({
      id: banner.id,
      bannerName: banner.name || "",
      bannerUrl: banner.url || "",
      bannerImageUrl: banner.image_url || "",
      bannerGender: banner.gender || "WOMEN",
      bannerIsMobile: !!banner.isMobile,
      bannerIsEnable: banner.isEnable !== false,
      bannerCollectionId: banner.collection_id ? banner.collection_id.toString() : "",
      bannerHomePromotional: !!banner.home_promotional,
    })
    setBannerImageUploadMethod("url")
    setIsBannerDialogOpen(true)
  }

  const closeBannerDialog = () => {
    setIsBannerDialogOpen(false)
    setEditBanner(null)
    if (onExternalAddClose) onExternalAddClose()
  }

  React.useEffect(() => {
    if (externalAddOpen) {
      openAddBannerDialog()
    }
  }, [externalAddOpen])

  const handleSaveBanner = () => {
    const v = getValues()
    if (!v.bannerName) {
      toast.error("Banner Name is required!")
      return
    }
    if (!v.bannerImageUrl) {
      toast.error("Image URL or Uploaded file is required!")
      return
    }

    const payload = {
      name: v.bannerName,
      url: v.bannerUrl,
      image_url: v.bannerImageUrl,
      gender: v.bannerGender,
      isMobile: v.bannerIsMobile,
      isEnable: v.bannerIsEnable,
      collection_id: v.bannerCollectionId ? parseInt(v.bannerCollectionId, 10) : null,
      home_promotional: v.bannerHomePromotional,
    }

    if (v.id) {
      updateBannerMutation.mutate({ id: v.id, payload })
    } else {
      createBannerMutation.mutate(payload)
    }
  }

  const handleDeleteBanner = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete banner "${name}"?`)) {
      deleteBannerMutation.mutate(id)
    }
  }

  const handleBannerImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerIsUploading(true)
    try {
      const data = await uploadService.uploadFile(file)
      setValue("bannerImageUrl", data.url)
      toast.success("Banner image uploaded successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to upload banner file")
    } finally {
      setBannerIsUploading(false)
    }
  }

  const filteredBanners = collectionBanners.filter((b: any) =>
    (b.name || "").toLowerCase().includes(bannerSearch.toLowerCase())
  )

  if (isLoading) {
    return <div className="text-center py-8 text-xs font-semibold text-slate-400">Loading collection banners...</div>
  }

  return (
    <div className="space-y-">
      {/* Search Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search category banners..."
            value={bannerSearch}
            onChange={(e) => setBannerSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={openAddBannerDialog} className="bg-slate-900 hover:bg-black text-white font-bold text-xs h-9 px-4 rounded-md shadow-xs cursor-pointer">
            <PlusIcon className="h-4 w-4 mr-1.5" /> Add Banner
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-200/80">
              <TableHead className="h-11 px-6 text-xs font-semibold text-slate-600">Banner</TableHead>
              <TableHead className="h-11 text-xs font-semibold text-slate-600">URL Route</TableHead>
              <TableHead className="h-11 text-xs font-semibold text-slate-600">Device Target</TableHead>
              <TableHead className="h-11 text-xs font-semibold text-slate-600">Gender</TableHead>
              <TableHead className="h-11 text-xs font-semibold text-slate-600">Status</TableHead>
              <TableHead className="h-11 text-xs font-semibold text-slate-600 text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBanners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs font-semibold text-slate-400">
                  No collection banners found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBanners.map((banner: any) => {
                const imgUrl = parseImageUrl(banner.image_url)
                const isEnable = banner.isEnable !== false && banner.isEnable !== null

                return (
                  <TableRow key={banner.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors h-14 text-xs">
                    <TableCell className="p-4 px-6 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 overflow-hidden shrink-0">
                          {imgUrl ? (
                            <img src={imgUrl} alt={banner.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          {(() => {
                            const linked = collectionOptions.find((c: any) => c.id.toString() === (banner.collection_id || "").toString())
                            return linked ? (
                              <span className="text-[10px] text-slate-500 font-semibold block">
                                Collection: {linked.name}
                              </span>
                            ) : null
                          })()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span>{banner.url || "N/A"}</span>
                        {banner.url && (
                          <a href={banner.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize font-bold">
                        {banner.isMobile ? "Mobile" : "Desktop"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-bold capitalize text-[10px]">
                      {banner.gender || "All"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isEnable}
                          disabled={toggleEnableMutation.isPending}
                          onCheckedChange={(checked: boolean) => {
                            toggleEnableMutation.mutate({ id: banner.id, isEnable: checked })
                          }}
                        />
                        {isEnable ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[9.5px] font-bold capitalize tracking-wide rounded-full px-2.5 py-0.5">
                            Active
                          </span>
                        ) : (
                          <span className="bg-slate-50 text-slate-500 border border-slate-200/80 text-[9.5px] font-bold capitalize tracking-wide rounded-full px-2.5 py-0.5">
                            Inactive
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditBannerDialog(banner)}
                          className="h-8 w-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBanner(banner.id, banner.name)}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
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
      </div>

      {/* Banner CRUD Dialog */}
      <BannerFormModal
        isOpen={isBannerDialogOpen}
        onClose={closeBannerDialog}
        onSave={handleSaveBanner}
        register={register}
        watch={watch}
        setValue={setValue}
        editBanner={editBanner}
        collectionOptions={collectionOptions}
        bannerImageUploadMethod={bannerImageUploadMethod}
        setBannerImageUploadMethod={setBannerImageUploadMethod}
        bannerIsUploading={bannerIsUploading}
        handleBannerImageFileChange={handleBannerImageFileChange}
      />
    </div>
  )
}
