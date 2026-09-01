"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusIcon, Pencil, Trash2, ExternalLink, ImageIcon, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { BannerFormModal } from "@/components/catalog/banner-form-modal"

import { categoryService } from "@/services/category.service"
import { uploadService } from "@/services/upload.service"

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

export function BannersTab() {
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
    queryFn: () => categoryService.getCollectionFilters()
  })
  const collectionOptions = collectionsFilterResponse?.collections || []

  // Fetch banners
  const { data: bannersResponse, isLoading } = useQuery({
    queryKey: ["collection-banners"],
    queryFn: () => categoryService.getBanners()
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
    }
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
    }
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
    }
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
    }
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
  }

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
      home_promotional: v.bannerHomePromotional
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

  // Handle local file upload
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
    <div className="space-y-4">
      {/* Outer Card Wrapper */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Banner List</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Configure promotional marketing slides targeting Desktop or Mobile interfaces.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openAddBannerDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-2 shadow-xs">
              <PlusIcon className="h-4 w-4" /> Add Banner
            </Button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search all banners..."
              value={bannerSearch}
              onChange={(e) => setBannerSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 rounded-xl px-4 py-2 w-64 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          <button className="bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl px-3.5 py-2 flex items-center gap-1.5 transition-all">
            <Sparkles className="h-3.5 w-3.5 text-slate-500" /> Filter
          </button>
        </div>

        {/* Table Container */}
        <div className="border border-slate-200/80 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-[#f4f7fb]">
              <TableRow className="border-b border-slate-200/80 hover:bg-transparent">
                <TableHead className="w-12 h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </TableHead>
                <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4">Banner</TableHead>
                <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">URL Route</TableHead>
                <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Device Target</TableHead>
                <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Gender</TableHead>
                <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right px-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBanners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs font-semibold text-slate-400">
                    No collection banners found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBanners.map((banner: any) => (
                  <TableRow key={banner.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors h-14">
                    <TableCell className="text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-10 rounded-lg border border-slate-200/80 bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden shrink-0">
                          {banner.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={banner.image_url} alt={banner.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{banner.name}</p>
                          {(() => {
                            const linked = collectionOptions.find((c: any) => c.id.toString() === (banner.collection_id || "").toString())
                            return linked ? (
                              <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
                                Collection: {linked.name}
                              </span>
                            ) : null
                          })()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">{banner.url || "N/A"}</span>
                        {banner.url && (
                          <a href={banner.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-wrap gap-1">
                        <span className={`text-[9.5px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${banner.isMobile ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80' : 'bg-sky-50 text-sky-700 border-sky-200/80'}`}>
                          {banner.isMobile ? 'Mobile' : 'Desktop'}
                        </span>
                        {banner.home_promotional && (
                          <span className="text-[9.5px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                            Home Promo
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200/80">
                        {banner.gender || "All"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          size="sm"
                          checked={banner.isEnable !== false && banner.isEnable !== null}
                          disabled={toggleEnableMutation.isPending}
                          onCheckedChange={(checked: boolean) => {
                            toggleEnableMutation.mutate({ id: banner.id, isEnable: checked })
                          }}
                        />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${banner.isEnable !== false && banner.isEnable !== null ? "text-emerald-600" : "text-slate-400"
                          }`}>
                          {banner.isEnable !== false && banner.isEnable !== null ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditBannerDialog(banner)}
                          className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBanner(banner.id, banner.name)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
