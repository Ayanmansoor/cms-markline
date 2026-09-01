"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Folder, Globe, Trash2, ImageIcon, FolderIcon, ChevronDownIcon, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useForm } from "react-hook-form"

import { categoryService } from "@/services/category.service"
import { uploadService } from "@/services/upload.service"

interface CategoryFormValues {
  name: string
  slug: string
  description: string
  gender: string
  type: string
  bannerImage: string
  imageUrl: string
  isNew: boolean
  isShow: boolean
  seoTitle: string
  seoDescription: string
  keywords: string[]
}

const defaultFormValues: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  gender: "WOMEN",
  type: "ALL",
  bannerImage: "",
  imageUrl: "",
  isNew: false,
  isShow: true,
  seoTitle: "",
  seoDescription: "",
  keywords: [],
}

export default function EditCollectionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const queryClient = useQueryClient()

  const { register, watch, setValue, reset, getValues } = useForm<CategoryFormValues>({
    defaultValues: defaultFormValues,
  })

  // Image Upload Methods
  const [imageUploadMethod, setImageUploadMethod] = useState<"url" | "file">("url")
  const [bannerUploadMethod, setBannerUploadMethod] = useState<"url" | "file">("url")
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)

  // GitHub Folders State
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [isFoldersLoading, setIsFoldersLoading] = useState(false)

  // Local file previews for deferred upload
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  const watchedName = watch("name")
  const watchedImageUrl = watch("imageUrl")
  const watchedBannerImage = watch("bannerImage")
  const watchedIsNew = watch("isNew")
  const watchedIsShow = watch("isShow")
  const watchedKeywords = watch("keywords") || []

  // Fetch available folders in the GitHub repository on mount
  useEffect(() => {
    async function loadFolders() {
      setIsFoldersLoading(true)
      try {
        const data = await uploadService.getFolders()
        if (data.folders) {
          setFolders(data.folders)
          if (data.folders.length > 0) {
            setSelectedFolder(data.folders[0])
          }
        }
      } catch (err) {
        console.error("Failed to load GitHub repository folders:", err)
      } finally {
        setIsFoldersLoading(false)
      }
    }
    loadFolders()
  }, [])

  // Auto-routing folder logic based on filename
  const autoRouteFolder = (filename: string) => {
    if (folders.length === 0) return
    const filenameLower = filename.toLowerCase()
    let bestMatch = ""
    let maxScore = 0

    for (const folderPath of folders) {
      const parts = folderPath.toLowerCase().split('/')
      const folderName = parts[parts.length - 1]
      const keywords = folderName.split(/[-_\s]/).filter(word => word.length > 2)
      keywords.push(folderName)

      let score = 0
      for (const word of keywords) {
        if (filenameLower.includes(word)) {
          score += word.length
        }
      }

      if (score > maxScore) {
        maxScore = score
        bestMatch = folderPath
      }
    }

    if (maxScore > 0 && bestMatch) {
      setSelectedFolder(bestMatch)
      toast.info(`Auto-routed to folder: "${bestMatch}"`)
    }
  }

  // Handle local File selections (Thumbnail)
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setThumbnailFile(file)
    autoRouteFolder(file.name)
    const localUrl = URL.createObjectURL(file)
    setValue("imageUrl", localUrl)
  }

  // Handle local File selections (Banner)
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setBannerFile(file)
    autoRouteFolder(file.name)
    const localUrl = URL.createObjectURL(file)
    setValue("bannerImage", localUrl)
  }

  // Fetch collection data
  const { data: collectionResponse, isLoading: isCollectionLoading } = useQuery({
    queryKey: ["collection", id],
    queryFn: () => categoryService.getCollectionById(id),
    enabled: !!id
  })

  // Populate form states once data is fetched
  useEffect(() => {
    if (collectionResponse?.success && collectionResponse.collection) {
      const col = collectionResponse.collection
      
      let imageUrlParsed = ""
      if (col.image_urls && col.image_urls.length > 0) {
        try {
          const cleanStr = String(col.image_urls[0]).trim().replace(/^"|"$/g, '')
          const parsed = JSON.parse(cleanStr)
          imageUrlParsed = parsed.image_url || parsed.url || ""
        } catch (e) {
          imageUrlParsed = typeof col.image_urls[0] === 'string' ? col.image_urls[0] : ""
        }
      }

      let bannerImageParsed = ""
      if (col.banner_image && col.banner_image.length > 0) {
        try {
          const cleanStr = String(col.banner_image[0]).trim().replace(/^"|"$/g, '')
          const parsed = JSON.parse(cleanStr)
          bannerImageParsed = parsed.image_url || parsed.url || ""
        } catch (e) {
          bannerImageParsed = typeof col.banner_image[0] === 'string' ? col.banner_image[0] : ""
        }
      } else if (typeof col.banner_image === 'string') {
        try {
          const cleanStr = String(col.banner_image).trim().replace(/^"|"$/g, '')
          const parsed = JSON.parse(cleanStr)
          bannerImageParsed = parsed.image_url || parsed.url || ""
        } catch (e) {
          bannerImageParsed = col.banner_image
        }
      }

      reset({
        name: col.name || "",
        slug: col.slug || "",
        description: col.description || "",
        gender: col.gender || "WOMEN",
        type: col.type || "ALL",
        bannerImage: bannerImageParsed,
        imageUrl: imageUrlParsed,
        isNew: col.is_new_collection ?? false,
        isShow: col.is_show ?? true,
        seoTitle: col.seoTitle || "",
        seoDescription: col.seoDescription || "",
        keywords: col.keywords || [],
      })
    }
  }, [collectionResponse, reset])

  // Auto-generate slug helper
  const handleGenerateSlug = () => {
    if (watchedName) {
      const generated = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
      setValue("slug", generated)
      toast.success("Slug generated!")
    }
  }

  // React Query: Update Collection Mutation
  const updateCollectionMutation = useMutation({
    mutationFn: (payload: any) => categoryService.updateCollection(id, payload),
    onSuccess: () => {
      toast.success("Collection updated successfully! Task is complete")
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      queryClient.invalidateQueries({ queryKey: ["collection", id] })
      router.push("/category")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update collection")
    }
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => categoryService.deleteCollection(id),
    onSuccess: () => {
      toast.success("Collection deleted successfully! Task is complete")
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      router.push("/category")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete collection")
    }
  })

  const handleSave = async () => {
    const v = getValues()
    if (!v.name.trim()) {
      toast.error("Collection Name is required!")
      return
    }
    if (!v.slug.trim()) {
      toast.error("Collection Slug is required!")
      return
    }

    setIsUploading(true)
    const toastId = toast.loading("Processing collection images...")

    try {
      let finalThumbnailUrl = v.imageUrl.trim()
      let finalBannerUrl = v.bannerImage.trim()

      // 1. Upload Thumbnail Image sequentially if selected locally
      if (imageUploadMethod === "file" && thumbnailFile) {
        const data = await uploadService.uploadFile(thumbnailFile, selectedFolder)
        if (finalThumbnailUrl.startsWith("blob:")) {
          URL.revokeObjectURL(finalThumbnailUrl)
        }
        finalThumbnailUrl = data.url
      }

      // 2. Upload Banner Image sequentially to avoid Git SHA collision
      if (bannerUploadMethod === "file" && bannerFile) {
        const data = await uploadService.uploadFile(bannerFile, selectedFolder)
        if (finalBannerUrl.startsWith("blob:")) {
          URL.revokeObjectURL(finalBannerUrl)
        }
        finalBannerUrl = data.url
      }

      // Map images to serialized array matching target schema format:
      // ["{\"name\":\"Wedding Collection\",\"image_url\":\"https://...\"}"]
      const imageObject = finalThumbnailUrl
        ? [
            JSON.stringify({
              name: v.name.trim(),
              image_url: finalThumbnailUrl,
            }),
          ]
        : null

      const bannerObject = finalBannerUrl
        ? [
            JSON.stringify({
              name: `${v.name.trim()} Banner`,
              image_url: finalBannerUrl,
            }),
          ]
        : null

      const payload = {
        name: v.name.trim(),
        slug: v.slug.trim(),
        description: v.description.trim() || null,
        gender: v.gender,
        type: v.type,
        is_new_collection: v.isNew,
        is_show: v.isShow,
        banner_image: bannerObject, // Store banner_image as serialized array matching type text[]
        seoTitle: v.seoTitle.trim() || null,
        seoDescription: v.seoDescription.trim() || null,
        image_urls: imageObject,
        keywords: v.keywords || [],
      }

      toast.loading("Saving updated collection details...", { id: toastId })
      updateCollectionMutation.mutate(payload)
    } catch (err: any) {
      toast.error(err.message || "Failed to process image uploads", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = () => {
    const v = getValues()
    if (confirm(`Are you sure you want to delete collection "${v.name}"?`)) {
      deleteMutation.mutate()
    }
  }

  const isPending = updateCollectionMutation.isPending || deleteMutation.isPending || isUploading

  if (isCollectionLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen justify-center items-center">
          <div className="text-slate-500 font-semibold text-sm animate-pulse">Loading Collection Details...</div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 ">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/category")}
                className="h-8 w-8 text-slate-500 hover:text-slate-800 border-slate-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#0f172a] flex items-center gap-2">
                  <Folder className="h-5 w-5 text-blue-600" /> Edit Collection
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">Modify storefront collection line details and metadata.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 h-9 px-3 rounded-lg flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Delete Collection
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/category")}
                disabled={isPending}
                className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isPending}
                className="text-xs font-bold text-white bg-black hover:bg-black/90 px-4"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Form Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
            
            {/* Left Card: Core Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Target Folder Path Selection Card */}
              <Card className="shadow-xs border border-slate-200 rounded-xl bg-white p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                      <FolderIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">GitHub Storage Category</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Select the target folder in GitHub repository to store images.</p>
                    </div>
                  </div>
                  <div className="w-full sm:w-60 relative">
                    <select
                      value={selectedFolder}
                      disabled={isFoldersLoading}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs font-bold !text-black border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      {isFoldersLoading ? (
                        <option value="">Fetching folders...</option>
                      ) : (
                        <>
                          <option value="" className="!text-black">/ (Repository Root)</option>
                          {folders.map((f) => (
                            <option key={f} value={f} className="!text-black">
                              {f}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <ChevronDownIcon className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </Card>

              <Card className="shadow-sm border border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-950">Collection Information</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Provide the title, URL identifier, and target options for this line.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Collection Name</Label>
                    <Input
                      {...register("name")}
                      placeholder="e.g. Wedges Sandals"
                      className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
                    />
                  </div>

                  {/* Slug field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Slug (URL Path)</Label>
                      <Button
                        variant="ghost"
                        onClick={handleGenerateSlug}
                        className="h-auto py-0 px-1 text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:bg-transparent"
                      >
                        Auto-Generate
                      </Button>
                    </div>
                    <Input
                      {...register("slug")}
                      placeholder="e.g. wedges-sandals"
                      className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
                    />
                  </div>

                  {/* Description field */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Description</Label>
                    <textarea
                      {...register("description")}
                      placeholder="Describe the styles and fit details for this collection..."
                      rows={4}
                      className="w-full text-sm font-semibold border border-slate-200 text-slate-900 rounded-lg p-2.5 focus-visible:ring-1 focus-visible:outline-none focus:ring-slate-950 focus:border-slate-350 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Gender target */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Gender Target</Label>
                      <select
                        {...register("gender")}
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 shadow-sm"
                      >
                        <option value="WOMEN">WOMEN</option>
                        <option value="MEN">MEN</option>
                        <option value="KIDS">KIDS</option>
                        <option value="UNISEX">UNISEX</option>
                      </select>
                    </div>

                    {/* Collection Type */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Collection Type</Label>
                      <select
                        {...register("type")}
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 shadow-sm"
                      >
                        <option value="ALL">ALL</option>
                        <option value="NEW">NEW</option>
                      </select>
                    </div>
                  </div>

                  {/* Banner Image Selection */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Collection Banner Image</Label>
                    <div className="flex gap-4 mb-2">
                      <button
                        type="button"
                        onClick={() => setBannerUploadMethod("url")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${bannerUploadMethod === "url"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        Paste Banner URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setBannerUploadMethod("file")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${bannerUploadMethod === "file"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        Upload Local Banner
                      </button>
                    </div>

                    {bannerUploadMethod === "url" ? (
                      <Input
                        {...register("bannerImage")}
                        placeholder="e.g. https://images.shopmarkline.in/..."
                        className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerChange}
                          disabled={isPending}
                          className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1 cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                        />
                      </div>
                    )}

                    {/* Banner Preview Block */}
                    {watchedBannerImage && (
                      <div className="mt-3 p-3 border border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase self-start">Banner Preview</span>
                        <div className="relative w-full max-h-[120px] border border-slate-200 rounded-md overflow-hidden bg-white shadow-xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={watchedBannerImage}
                            alt="Collection Banner Preview"
                            className="max-h-[118px] w-full object-cover mx-auto"
                            onError={(e) => {
                              ; (e.target as HTMLImageElement).src = "https://placehold.co/600x120?text=Invalid+Banner+URL"
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collection Catalog Image */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Collection Thumbnail Image</Label>
                    <div className="flex gap-4 mb-2">
                      <button
                        type="button"
                        onClick={() => setImageUploadMethod("url")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          imageUploadMethod === "url"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Paste Image URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMethod("file")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          imageUploadMethod === "file"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Upload Local File
                      </button>
                    </div>

                    {imageUploadMethod === "url" ? (
                      <Input
                        {...register("imageUrl")}
                        placeholder="e.g. https://images.shopmarkline.in/..."
                        className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          disabled={isPending}
                          className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1 cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                        />
                      </div>
                    )}

                    {/* Image Preview Block */}
                    {watchedImageUrl && (
                      <div className="mt-3 p-3 border border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase self-start">Image Preview</span>
                        <div className="relative max-w-[200px] max-h-[150px] border border-slate-200 rounded-md overflow-hidden bg-white shadow-xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={watchedImageUrl}
                            alt="Collection Thumbnail Preview"
                            className="max-h-[148px] object-contain mx-auto"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = "https://placehold.co/200x150?text=Invalid+Image+URL"
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Right Card: Status & SEO */}
            <div className="space-y-6">
              
              {/* Status and Visibility Settings */}
              <Card className="shadow-sm border border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-950">Visibility & Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-slate-900">Mark as New Collection</Label>
                      <p className="text-[9px] text-slate-400">Highlights this collection with a NEW label badge.</p>
                    </div>
                    <Switch checked={watchedIsNew} onCheckedChange={(checked) => setValue("isNew", checked)} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-slate-900">Show on Storefront Navigation</Label>
                      <p className="text-[9px] text-slate-400">Makes the collection page publicly visible.</p>
                    </div>
                    <Switch checked={watchedIsShow} onCheckedChange={(checked) => setValue("isShow", checked)} />
                  </div>

                </CardContent>
              </Card>

              {/* SEO Configurations */}
              <Card className="shadow-sm border border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-slate-500" /> Search Optimization (SEO)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* SEO Title */}
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-slate-500 uppercase block">SEO Title Meta</Label>
                    <Input
                      {...register("seoTitle")}
                      placeholder="Search engines metadata title..."
                      className="h-9 text-xs font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
                    />
                  </div>

                  {/* SEO Description */}
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-slate-500 uppercase block">SEO Description Meta</Label>
                    <textarea
                      {...register("seoDescription")}
                      placeholder="Meta description shown in Google search results..."
                      rows={3}
                      className="w-full text-xs font-semibold border border-slate-200 text-slate-900 rounded-md p-2 focus-visible:ring-1 focus-visible:outline-none focus:ring-slate-950 focus:border-slate-350 bg-white"
                    />
                  </div>

                  {/* SEO Keywords */}
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-slate-500 uppercase block">SEO Keywords</Label>
                    <Input
                      placeholder="Type a keyword and press Enter..."
                      className="h-9 text-xs font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const val = e.currentTarget.value.trim()
                          if (val) {
                            const currentKeywords = getValues("keywords") || []
                            if (!currentKeywords.includes(val)) {
                              setValue("keywords", [...currentKeywords, val])
                            }
                            e.currentTarget.value = ""
                          }
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {watchedKeywords.map((kw, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border-none">
                          {kw}
                          <button
                            type="button"
                            onClick={() => setValue("keywords", watchedKeywords.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-slate-600 transition-colors ml-0.5 focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                </CardContent>
              </Card>

            </div>

          </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
